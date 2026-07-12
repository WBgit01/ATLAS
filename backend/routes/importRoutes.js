import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ImportHistory from '../models/ImportHistory.js';
import Anomaly from '../models/Anomaly.js';
import { protect, authorize } from '../middleware/auth.js';
import { importAttendanceData } from '../services/importService.js';
import { createAuditLog } from '../services/auditService.js';
import { notifyImportCompleted, notifyImportFailed } from '../services/notificationService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xls', '.xlsx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = express.Router();

router.get('/', protect, authorize('imports:read'), async (req, res) => {
  const imports = await ImportHistory.find()
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(imports);
});

router.get('/:id', protect, authorize('imports:read'), async (req, res) => {
  const importRecord = await ImportHistory.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!importRecord) return res.status(404).json({ message: 'Import not found' });
  res.json(importRecord);
});

router.post(
  '/upload',
  protect,
  authorize('imports:write'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const io = req.app.get('io');
      io?.emit('import:started', { fileName: req.file.originalname });

      const result = await importAttendanceData({
        filePath: req.file.path,
        fileName: req.file.originalname,
        uploadedBy: req.user,
        createUnmatched: req.body.createUnmatched !== 'false',
        io,
      });

      await createAuditLog({
        user: req.user,
        action: 'import_attendance',
        resource: 'import',
        resourceId: result._id,
        details: {
          fileName: req.file.originalname,
          matchedStudents: result.matchedStudents,
          totalRecords: result.totalRecords,
        },
        req,
      });

      io?.emit('import:completed', {
        importId: result._id,
        fileName: result.fileName,
        status: result.status,
        matchedStudents: result.matchedStudents,
        anomaliesDetected: result.anomaliesDetected,
      });

      await notifyImportCompleted(result, io);

      res.status(201).json(result);
    } catch (error) {
      req.app.get('io')?.emit('import:failed', { message: error.message });
      await notifyImportFailed(req.file?.originalname || 'upload', error.message, req.app.get('io'));
      res.status(500).json({ message: error.message });
    }
  }
);

router.get('/anomalies/list', protect, authorize('anomalies:read'), async (req, res) => {
  const { status = 'open', page = 1, limit = 20 } = req.query;
  const filter = status === 'all' ? {} : { status };
  const skip = (Number(page) - 1) * Number(limit);

  const [anomalies, total] = await Promise.all([
    Anomaly.find(filter)
      .populate('student', 'name department')
      .populate('importBatch', 'fileName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Anomaly.countDocuments(filter),
  ]);

  res.json({ anomalies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

router.patch('/anomalies/:id', protect, authorize('anomalies:resolve'), async (req, res) => {
  const { status, resolutionNotes } = req.body;
  const anomaly = await Anomaly.findByIdAndUpdate(
    req.params.id,
    {
      status,
      resolutionNotes,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    },
    { new: true }
  );

  if (!anomaly) return res.status(404).json({ message: 'Anomaly not found' });

  await createAuditLog({
    user: req.user,
    action: 'resolve_anomaly',
    resource: 'anomaly',
    resourceId: anomaly._id,
    details: { status, resolutionNotes },
    req,
  });

  res.json(anomaly);
});

export default router;

import Student from '../models/Student.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Anomaly from '../models/Anomaly.js';
import ImportHistory from '../models/ImportHistory.js';
import { normalizeName } from '../utils/helpers.js';
import { processExcelFile } from './pythonService.js';
import { recalculateStudentStats } from './analyticsService.js';

export const importAttendanceData = async ({
  filePath,
  fileName,
  uploadedBy,
  createUnmatched = true,
  io = null,
}) => {
  const importRecord = await ImportHistory.create({
    fileName,
    filePath,
    uploadedBy: uploadedBy._id,
    status: 'processing',
  });

  try {
    const parsed = await processExcelFile(filePath);
    importRecord.periodStart = parsed.periodStart ? new Date(parsed.periodStart) : null;
    importRecord.periodEnd = parsed.periodEnd ? new Date(parsed.periodEnd) : null;

    let matchedStudents = 0;
    let unmatchedStudents = 0;
    let newStudentsCreated = 0;
    let totalRecords = 0;
    const affectedStudentIds = new Set();

    for (const studentData of parsed.students) {
      const normalizedName = studentData.normalizedName || normalizeName(studentData.name);
      let student = await Student.findOne({ normalizedName });

      if (!student && createUnmatched) {
        student = await Student.create({
          name: studentData.name,
          normalizedName,
          department: studentData.department,
          deviceUserId: studentData.deviceUserId,
          requiredServiceHours: Number(process.env.DEFAULT_SERVICE_HOURS) || 400,
        });
        newStudentsCreated += 1;
      }

      if (!student) {
        unmatchedStudents += 1;
        continue;
      }

      matchedStudents += 1;

      if (!student.department && studentData.department) {
        student.department = studentData.department;
        await student.save();
      }

      for (const daily of studentData.dailyRecords || []) {
        totalRecords += 1;
        const date = new Date(daily.date);

        await AttendanceRecord.findOneAndUpdate(
          { student: student._id, date },
          {
            student: student._id,
            date,
            timeIn: daily.timeIn,
            timeOut: daily.timeOut,
            punches: daily.punches || [],
            hoursRendered: daily.hoursRendered || 0,
            status: daily.status || 'present',
            flags: daily.flags || [],
            beforeNoonIn: daily.beforeNoonIn,
            beforeNoonOut: daily.beforeNoonOut,
            afterNoonIn: daily.afterNoonIn,
            afterNoonOut: daily.afterNoonOut,
            overtimeIn: daily.overtimeIn,
            overtimeOut: daily.overtimeOut,
            importBatch: importRecord._id,
            sourceFile: fileName,
          },
          { upsert: true, new: true }
        );

        affectedStudentIds.add(student._id.toString());
      }
    }

    for (const anomaly of parsed.anomalies || []) {
      const normalizedName = normalizeName(anomaly.studentName);
      const student = await Student.findOne({ normalizedName });
      await Anomaly.create({
        type: anomaly.type,
        student: student?._id,
        studentName: anomaly.studentName,
        date: anomaly.date ? new Date(anomaly.date) : null,
        message: anomaly.message,
        importBatch: importRecord._id,
      });
    }

    for (const studentId of affectedStudentIds) {
      await recalculateStudentStats(studentId, io);
    }

    importRecord.status = unmatchedStudents > 0 && matchedStudents === 0 ? 'partial' : 'completed';
    importRecord.totalRecords = totalRecords;
    importRecord.matchedStudents = matchedStudents;
    importRecord.unmatchedStudents = unmatchedStudents;
    importRecord.newStudentsCreated = newStudentsCreated;
    importRecord.anomaliesDetected = (parsed.anomalies || []).length;
    importRecord.summary = {
      studentCount: parsed.students.length,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
    };
    await importRecord.save();

    return importRecord;
  } catch (error) {
    importRecord.status = 'failed';
    importRecord.errorMessage = error.message;
    await importRecord.save();
    throw error;
  }
};

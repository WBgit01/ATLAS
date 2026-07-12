import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const processExcelFile = (filePath) =>
  new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const parserPath = path.join(__dirname, '../../python-service/parser.py');
    const proc = spawn(pythonPath, [parserPath, filePath], { windowsHide: true });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python parser exited with code ${code}`));
        return;
      }
      try {
        const data = JSON.parse(stdout);
        if (data.error) {
          reject(new Error(data.error));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });
  });

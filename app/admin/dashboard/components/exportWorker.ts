// Web Worker for Excel export with concurrency-limited image fetching, progress, and cancellation
import ExcelJS from 'exceljs';

// Concurrency limiter utility
function pLimit(concurrency: number) {
  let activeCount = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (queue.length > 0 && activeCount < concurrency) {
      activeCount++;
      const fn = queue.shift();
      if (fn) fn();
    }
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          activeCount--;
          next();
        }
      };
      if (activeCount < concurrency) {
        activeCount++;
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

// Worker state
let cancelled = false;

self.onmessage = async (e) => {
  if (e.data && e.data.type === 'cancel') {
    cancelled = true;
    self.postMessage({ type: 'cancelled' });
    return;
  }
  const { registrations, filtered, imageSize, columns, includeImages = true } = e.data;
  cancelled = false;
  try {
    const dataToExport = filtered ? registrations.filtered : registrations.all;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');
    worksheet.columns = columns;
    for (const reg of dataToExport) {
      worksheet.addRow({
        ...reg,
        gender: reg.gender === 'M' ? 'Male' : 'Female',
        hasParticipatedBefore: reg.hasParticipatedBefore ? 'Yes' : 'No',
        photo: '',
        aadhar: '',
      });
    }
    // Set row height for image rows only if includeImages is true
    if (includeImages) {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.height = imageSize.height * 0.75; // px to pt
      });
    }

    // Concurrency-limited image fetching
    const limit = pLimit(20); // 20 concurrent fetches
    const imageTasks = [];
    const failedImages: { row: number; type: string; key: string }[] = [];

    const cloudfrontBase = 'https://d3b13419yglo3r.cloudfront.net/';
    const fetchImageAsBuffer = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        return await response.arrayBuffer();
      } catch {
        return null;
      }
    };

    // Skip image processing if includeImages is false
    if (!includeImages) {
      // Still need to report progress
      self.postMessage({ type: 'progress', value: 100 });
    } else {
      for (let i = 0; i < dataToExport.length; i++) {
        if (cancelled) break;
        const reg = dataToExport[i];
        const rowNumber = i + 2;
        if (reg.photoKey) {
          imageTasks.push(limit(async () => {
            if (cancelled) return;
            const buffer = await fetchImageAsBuffer(cloudfrontBase + reg.photoKey);
            if (buffer) {
              const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
              worksheet.addImage(imageId, {
                tl: { col: worksheet.getColumn('photo').number - 1, row: rowNumber - 1 },
                ext: imageSize,
                editAs: 'oneCell',
              });
            } else {
              failedImages.push({ row: rowNumber, type: 'photo', key: reg.photoKey });
            }
            self.postMessage({ type: 'progress', value: (imageTasks.length / (dataToExport.length * 2)) * 100 });
          }));
        }
        if (reg.aadharKey) {
          imageTasks.push(limit(async () => {
            if (cancelled) return;
            const buffer = await fetchImageAsBuffer(cloudfrontBase + reg.aadharKey);
            if (buffer) {
              const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
              worksheet.addImage(imageId, {
                tl: { col: worksheet.getColumn('aadhar').number - 1, row: rowNumber - 1 },
                ext: imageSize,
                editAs: 'oneCell',
              });
            } else {
              failedImages.push({ row: rowNumber, type: 'aadhar', key: reg.aadharKey });
            }
            self.postMessage({ type: 'progress', value: (imageTasks.length / (dataToExport.length * 2)) * 100 });
          }));
        }
        if (i % 10 === 0) self.postMessage({ type: 'progress', value: (i / dataToExport.length) * 100 });
      }
    }
    await Promise.all(imageTasks);
    if (cancelled) return self.postMessage({ type: 'cancelled' });
    const buf = await workbook.xlsx.writeBuffer();
    self.postMessage({ type: 'done', buf, failedImages });
  } catch (err) {
    self.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) });
  }
};

self.onmessageerror = () => {
  cancelled = true;
  self.postMessage({ type: 'cancelled' });
};

// To cancel: post a message { type: 'cancel' } from main thread

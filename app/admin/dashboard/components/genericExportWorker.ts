// Web Worker for Generic Excel export with concurrency-limited image fetching, progress, and cancellation
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

interface Registration {
    [key: string]: unknown;
    gender: string;
    hasParticipatedBefore: boolean;
    arrivalDate?: string;
    arrivalTime?: string;
    arrivalPlace?: string;
    additionalNotes?: string;
    travelDetailsSubmittedAt?: string;
    returnDate?: string;
    busTime?: string;
    returnDetailsSubmittedAt?: string;
    photoKey?: string;
    aadharKey?: string;
}

self.onmessage = async (e) => {
    if (e.data && e.data.type === 'cancel') {
        cancelled = true;
        self.postMessage({ type: 'cancelled' });
        return;
    }
    const { registrations, filtered, imageSize, columns, includeImages = true, segregateBy } = e.data;
    cancelled = false;
    try {
        const dataToExport = (filtered ? registrations.filtered : registrations.all) as Registration[];
        const workbook = new ExcelJS.Workbook();

        // Helper function to add rows to a worksheet
        const addRowsToWorksheet = (sheet: ExcelJS.Worksheet, data: Registration[]) => {
            sheet.columns = columns;
            for (const reg of data) {
                sheet.addRow({
                    ...reg,
                    gender: reg.gender === 'M' ? 'Male' : 'Female',
                    hasParticipatedBefore: reg.hasParticipatedBefore ? 'Yes' : 'No',
                    arrivalDetailsSubmitted: reg.arrivalDate ? 'Yes' : 'No',
                    arrivalDate: reg.arrivalDate ? new Date(reg.arrivalDate).toLocaleDateString('en-GB') : '',
                    arrivalTime: reg.arrivalTime || '',
                    arrivalPlace: reg.arrivalPlace || '',
                    additionalNotes: reg.additionalNotes || '',
                    travelDetailsSubmittedAt: reg.travelDetailsSubmittedAt ? new Date(reg.travelDetailsSubmittedAt).toLocaleString() : '',
                    returnDate: reg.returnDate ? new Date(reg.returnDate).toLocaleDateString('en-GB') : '',
                    busTime: reg.busTime || '',
                    returnDetailsSubmitted: reg.returnDate ? 'Yes' : 'No',
                    returnDetailsSubmittedAt: reg.returnDetailsSubmittedAt ? new Date(reg.returnDetailsSubmittedAt).toLocaleString() : '',
                    photo: '',
                    aadhar: '',
                });
            }
            // Set row height for image rows only if includeImages is true
            if (includeImages) {
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber > 1) row.height = imageSize.height * 0.75; // px to pt
                });
            }
        };

        const sheets: { sheet: ExcelJS.Worksheet, data: Registration[] }[] = [];

        if (segregateBy && segregateBy !== 'none') {
            // Group data by segregateBy column
            const groups: Record<string, Registration[]> = {};
            for (const reg of dataToExport) {
                const key = String(reg[segregateBy] || 'Unspecified');
                if (!groups[key]) groups[key] = [];
                groups[key].push(reg);
            }

            // Create worksheets for each group
            for (const [key, groupData] of Object.entries(groups)) {
                // Sanitize sheet name (Excel limits to 31 chars and disallows some chars)
                const sheetName = key.replace(/[*?:\/\[\]\\]/g, '').substring(0, 31) || 'Sheet';
                const sheet = workbook.addWorksheet(sheetName);
                addRowsToWorksheet(sheet, groupData);
                sheets.push({ sheet, data: groupData });
            }
        } else {
            const sheet = workbook.addWorksheet('Registrations');
            addRowsToWorksheet(sheet, dataToExport);
            sheets.push({ sheet, data: dataToExport });
        }

        // Concurrency-limited image fetching
        const limit = pLimit(20); // 20 concurrent fetches
        const imageTasks: Promise<void>[] = [];
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
            let totalItems = 0;
            sheets.forEach(s => totalItems += s.data.length);
            let processedItems = 0;

            for (const { sheet, data } of sheets) {
                for (let i = 0; i < data.length; i++) {
                    if (cancelled) break;
                    const reg = data[i];
                    const rowNumber = i + 2;

                    if (reg.photoKey) {
                        imageTasks.push(limit(async () => {
                            if (cancelled) return;
                            const buffer = await fetchImageAsBuffer(cloudfrontBase + reg.photoKey);
                            if (buffer) {
                                const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
                                // Find column index for 'photo'
                                const col = sheet.getColumn('photo');
                                if (col) {
                                    sheet.addImage(imageId, {
                                        tl: { col: col.number - 1, row: rowNumber - 1 },
                                        ext: imageSize,
                                        editAs: 'oneCell',
                                    });
                                }
                            } else {
                                failedImages.push({ row: rowNumber, type: 'photo', key: reg.photoKey || '' });
                            }
                            processedItems++;
                            self.postMessage({ type: 'progress', value: (processedItems / (totalItems * 2)) * 100 });
                        }));
                    } else {
                        processedItems++;
                    }

                    if (reg.aadharKey) {
                        imageTasks.push(limit(async () => {
                            if (cancelled) return;
                            const buffer = await fetchImageAsBuffer(cloudfrontBase + reg.aadharKey);
                            if (buffer) {
                                const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
                                // Find column index for 'aadhar'
                                const col = sheet.getColumn('aadhar');
                                if (col) {
                                    sheet.addImage(imageId, {
                                        tl: { col: col.number - 1, row: rowNumber - 1 },
                                        ext: imageSize,
                                        editAs: 'oneCell',
                                    });
                                }
                            } else {
                                failedImages.push({ row: rowNumber, type: 'aadhar', key: reg.aadharKey || '' });
                            }
                            processedItems++;
                            self.postMessage({ type: 'progress', value: (processedItems / (totalItems * 2)) * 100 });
                        }));
                    } else {
                        processedItems++;
                    }

                    if (i % 10 === 0) self.postMessage({ type: 'progress', value: (processedItems / (totalItems * 2)) * 100 });
                }
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

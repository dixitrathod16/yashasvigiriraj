// Wrapper to instantiate and communicate with the exportWorker
// Import only the type from Registration.tsx
// Ensure Registration is exported as an interface from Registration.tsx

interface RunExcelExportWorkerParams {
  registrations: unknown;
  filtered: boolean;
  imageSize: {
    width: number;
    height: number;
  };
  columns: unknown[]; // TODO: Replace 'unknown' with a more specific type if available
  onProgress?: (value: number) => void;
  onDone?: (buf: ArrayBuffer, failedImages: string[]) => void;
  onError?: (error: string) => void;
  onCancelled?: () => void;
}

export function runExcelExportWorker({ registrations, filtered, imageSize, columns, onProgress, onDone, onError, onCancelled }: RunExcelExportWorkerParams) {
  const worker = new Worker(new URL('./exportWorker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (e) => {
    const { type, value, buf, failedImages, error } = e.data;
    if (type === 'progress' && onProgress) onProgress(value);
    if (type === 'done' && onDone) onDone(buf, failedImages);
    if (type === 'cancelled' && onCancelled) onCancelled();
    if (type === 'error' && onError) onError(error);
  };

  worker.onerror = (e) => {
    if (onError) onError(e.message);
  };

  worker.postMessage({ registrations, filtered, imageSize, columns });

  return {
    cancel: () => {
      worker.postMessage({ type: 'cancel' });
    },
    worker,
  };
}

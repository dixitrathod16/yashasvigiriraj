// Wrapper to instantiate and communicate with the genericExportWorker

interface RunGenericExportWorkerParams {
    registrations: unknown;
    filtered: boolean;
    imageSize: {
        width: number;
        height: number;
    };
    columns: unknown[]; // TODO: Replace 'unknown' with a more specific type if available
    includeImages?: boolean; // Optional parameter to include/exclude images in export
    segregateBy?: string; // Optional parameter to segregate data into multiple sheets
    onProgress?: (value: number) => void;
    onDone?: (buf: ArrayBuffer, failedImages: string[]) => void;
    onError?: (error: string) => void;
    onCancelled?: () => void;
}

export function runGenericExportWorker({ registrations, filtered, imageSize, columns, includeImages = true, segregateBy, onProgress, onDone, onError, onCancelled }: RunGenericExportWorkerParams) {
    const worker = new Worker(new URL('./genericExportWorker.ts', import.meta.url), { type: 'module' });

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

    worker.postMessage({ registrations, filtered, imageSize, columns, includeImages, segregateBy });

    return {
        cancel: () => {
            worker.postMessage({ type: 'cancel' });
        },
        worker,
    };
}

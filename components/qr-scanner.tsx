'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanning = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 5,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (!isScanning.current && isMounted) {
                            isScanning.current = true;
                            onScan(decodedText);
                            setTimeout(() => {
                                isScanning.current = false;
                            }, 3000);
                        }
                    },
                    () => {
                        // Error callback - ignore, this fires continuously when no QR is detected
                    }
                );

                // Store the stream reference to manually stop it later
                try {
                    const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
                    if (videoElement && videoElement.srcObject) {
                        streamRef.current = videoElement.srcObject as MediaStream;
                    }
                } catch {
                    console.debug("Could not get video stream reference");
                }
            } catch (err) {
                console.error("Unable to start scanning", err);
            }
        };

        startScanner();

        return () => {
            isMounted = false;

            // Synchronously stop the camera
            try {
                // First, manually stop all media stream tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => {
                        track.stop();
                    });
                    streamRef.current = null;
                }

                // Then stop the scanner
                if (scannerRef.current) {
                    scannerRef.current.stop().catch(() => {
                        // Ignore errors during stop
                    });
                    try {
                        scannerRef.current.clear();
                    } catch {
                        // Ignore errors during clear
                    }
                    scannerRef.current = null;
                }
            } catch {
                // Cleanup errors are non-critical
                console.debug("Scanner cleanup completed");
            }
        };
    }, [onScan]);

    return (
        <div className="w-full">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
        </div>
    );
}

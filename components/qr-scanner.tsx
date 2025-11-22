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
    const onScanRef = useRef(onScan);

    // Update the ref when onScan changes
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;

                // Make qrbox responsive - use 70% of the container width up to 300px
                // const qrboxSize = Math.min(300, Math.floor(window.innerWidth * 0.7));

                const config = {
                    fps: 5,
                    aspectRatio: 1.0,
                    qrbox: { width: 250, height: 250 },
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (!isScanning.current && isMounted) {
                            isScanning.current = true;
                            onScanRef.current(decodedText);
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

                        // Apply custom styling to ensure video fits the square container
                        videoElement.style.objectFit = 'cover';
                        videoElement.style.width = '100%';
                        videoElement.style.height = '100%';
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
    }, []); // Empty dependency array - only run once on mount

    return (
        <div className="w-full h-full">
            <div id="qr-reader" className="w-full h-full"></div>
        </div>
    );
}

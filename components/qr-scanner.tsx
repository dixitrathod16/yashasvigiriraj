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

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 5,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                if (!isScanning.current) {
                    isScanning.current = true;
                    onScan(decodedText);
                    // Add a small delay before allowing next scan
                    setTimeout(() => {
                        isScanning.current = false;
                    }, 3000);
                }
            },
            () => {
                // Error callback - ignore, this fires continuously when no QR is detected
            }
        ).catch((err) => {
            console.error("Unable to start scanning", err);
        });

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch((err) => {
                    console.error("Error stopping scanner:", err);
                });
            }
        };
    }, [onScan]);

    return (
        <div className="w-full">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
        </div>
    );
}

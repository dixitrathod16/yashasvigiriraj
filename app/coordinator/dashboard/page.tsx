'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import QRScanner from '@/components/qr-scanner';
import { LogOut, QrCode, Type } from 'lucide-react';

interface Destination {
    id: string;
    name: string;
    date: string;
}

interface ScanResult {
    timestamp: string;
    registrationId: string;
    name: string;
    status: 'success' | 'error' | 'duplicate';
    message: string;
}

export default function CoordinatorDashboard() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedDestination, setSelectedDestination] = useState<string>('');
    const [manualId, setManualId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
    const [activeTab, setActiveTab] = useState('scan');
    const router = useRouter();

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const res = await fetch('/api/admin/destinations');
            const data = await res.json();
            if (data.destinations) {
                setDestinations(data.destinations);
                // Auto-select today's destination if available
                const today = new Date().toISOString().split('T')[0];
                const todayDest = data.destinations.find((d: Destination) => d.date === today);
                if (todayDest) {
                    setSelectedDestination(todayDest.id);
                } else if (data.destinations.length > 0) {
                    setSelectedDestination(data.destinations[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch destinations', error);
            toast.error('Failed to load destinations');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/coordinator/auth', { method: 'DELETE' });
        router.push('/coordinator/login');
    };

    const processAttendance = async (registrationId: string) => {
        if (!selectedDestination) {
            toast.error('Please select a destination first');
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const res = await fetch('/api/attendance/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registrationId,
                    destinationId: selectedDestination,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Recorded: ${data.user.name} (${data.user.id})`);
                addScanResult({
                    timestamp: new Date().toLocaleTimeString(),
                    registrationId: data.user.id,
                    name: data.user.name,
                    status: 'success',
                    message: 'Recorded successfully'
                });
                setManualId(''); // Clear manual input
            } else {
                if (res.status === 409) {
                    toast.warning(`Already recorded: ${registrationId}`);
                    addScanResult({
                        timestamp: new Date().toLocaleTimeString(),
                        registrationId,
                        name: 'Unknown',
                        status: 'duplicate',
                        message: 'Already recorded'
                    });
                } else {
                    toast.error(data.error || 'Failed to record');
                    addScanResult({
                        timestamp: new Date().toLocaleTimeString(),
                        registrationId,
                        name: 'Unknown',
                        status: 'error',
                        message: data.error || 'Failed'
                    });
                }
            }
        } catch (error) {
            console.error('Error recording attendance', error);
            toast.error('Network error');
        } finally {
            setIsProcessing(false);
        }
    };

    const addScanResult = (result: ScanResult) => {
        setRecentScans(prev => [result, ...prev].slice(0, 10));
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualId.trim()) {
            processAttendance(manualId.trim());
        }
    };

    const onScan = (decodedText: string) => {
        // Simple debounce/throttle could be added here if scanner triggers too fast
        // But usually we want to process immediately.
        // We might want to check if we just processed this ID to avoid double submission loop from scanner
        // For now, let's just process it.
        processAttendance(decodedText);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                    <h1 className="font-bold text-lg">Coordinator Dashboard</h1>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Select Destination</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                            <SelectContent>
                                {destinations.map(dest => (
                                    <SelectItem key={dest.id} value={dest.id}>
                                        {dest.name} ({dest.date})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="scan"><QrCode className="mr-2 h-4 w-4" /> Scan QR</TabsTrigger>
                        <TabsTrigger value="manual"><Type className="mr-2 h-4 w-4" /> Manual Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scan" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                                    {activeTab === 'scan' && (
                                        <QRScanner onScan={onScan} />
                                    )}
                                </div>
                                <p className="text-center text-sm text-gray-500 mt-2">
                                    Point camera at ID card QR code
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="manual" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Enter ID Manually</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="manualId">Registration ID</Label>
                                        <Input
                                            id="manualId"
                                            placeholder="e.g. SAN1501"
                                            value={manualId}
                                            onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isProcessing || !manualId}>
                                        {isProcessing ? 'Processing...' : 'Submit'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-600">Recent Activity</h3>
                    {recentScans.map((scan, i) => (
                        <div key={i} className={`p-3 rounded-lg text-sm flex justify-between items-center ${scan.status === 'success' ? 'bg-green-50 border border-green-100' :
                                scan.status === 'duplicate' ? 'bg-yellow-50 border border-yellow-100' :
                                    'bg-red-50 border border-red-100'
                            }`}>
                            <div>
                                <p className="font-medium">{scan.registrationId} - {scan.name}</p>
                                <p className="text-xs text-gray-500">{scan.message}</p>
                            </div>
                            <span className="text-xs text-gray-400">{scan.timestamp}</span>
                        </div>
                    ))}
                    {recentScans.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">No scans yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

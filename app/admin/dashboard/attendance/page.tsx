'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from 'lucide-react';

interface Destination {
    id: string;
    name: string;
    date: string;
}

interface User {
    id: string;
    name: string;
    phone: string;
    type: string;
    timestamp?: string;
    scannedBy?: string;
    registrationId?: string;
    userName?: string;
}

interface Stats {
    total: number;
    arrived: number;
    pending: number;
}

export default function AttendancePage() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedDestination, setSelectedDestination] = useState<string>('');
    const [arrivedUsers, setArrivedUsers] = useState<User[]>([]);
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, arrived: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchDestinations();
    }, []);

    useEffect(() => {
        if (selectedDestination) {
            fetchAttendance(selectedDestination);
        }
    }, [selectedDestination]);

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

    const fetchAttendance = async (destId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/attendance/status?destinationId=${destId}`);
            const data = await res.json();

            if (res.ok) {
                setArrivedUsers(data.arrived || []);
                setPendingUsers(data.pending || []);
                setStats(data.stats || { total: 0, arrived: 0, pending: 0 });
            } else {
                toast.error('Failed to load attendance data');
            }
        } catch (error) {
            console.error('Error fetching attendance', error);
            toast.error('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 mt-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Attendance Tracking</h1>
                <div className="w-[300px]">
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Expected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Arrived</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.arrived}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="arrived">
                <TabsList>
                    <TabsTrigger value="arrived" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Arrived ({arrivedUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> Pending ({pendingUsers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="arrived" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Scanned By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                        </TableRow>
                                    ) : arrivedUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">No arrivals yet</TableCell>
                                        </TableRow>
                                    ) : (
                                        arrivedUsers.map((user, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{user.registrationId || user.id}</TableCell>
                                                <TableCell>{user.userName || user.name}</TableCell>
                                                <TableCell>
                                                    {user.phone ? (
                                                        <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                                                            {user.phone}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>{user.timestamp ? new Date(user.timestamp).toLocaleTimeString() : '-'}</TableCell>
                                                <TableCell>{user.scannedBy || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                                        </TableRow>
                                    ) : pendingUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">Everyone has arrived!</TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingUsers.map((user, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{user.id}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>
                                                    {user.phone ? (
                                                        <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                                                            {user.phone}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>{user.type}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

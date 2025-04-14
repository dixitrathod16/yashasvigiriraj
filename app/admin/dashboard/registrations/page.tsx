'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Registration {
  id: string;
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  city: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations');
      if (!response.ok) throw new Error('Failed to fetch registrations');
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success(`Registration ${newStatus.toLowerCase()} successfully`);
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.id.toLowerCase().includes(searchTerm) ||
    reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.phoneNumber.includes(searchTerm)
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isMobile) {
    return (
      <div className="space-y-4 p-4">
        <Input
          placeholder="Search by ID,name or mobile number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        {filteredRegistrations.map((reg) => (
          <Card key={reg.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{reg.fullName}</h3>
                <p className="text-sm text-gray-500">{reg.phoneNumber}</p>
              </div>
              <span className={`text-sm ${
                reg.status === 'APPROVED' ? 'text-green-600' :
                reg.status === 'REJECTED' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {reg.status}
              </span>
            </div>
            <div className="text-sm">
              <p>Guardian: {reg.guardianName}</p>
              <p>City: {reg.city}</p>
              <p>Date: {new Date(reg.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={reg.status === 'APPROVED' ? 'outline' : 'default'}
                onClick={() => handleStatusChange(reg.id, 'APPROVED')}
                disabled={reg.status === 'APPROVED'}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant={reg.status === 'REJECTED' ? 'outline' : 'destructive'}
                onClick={() => handleStatusChange(reg.id, 'REJECTED')}
                disabled={reg.status === 'REJECTED'}
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Registrations</h2>
        <Input
          placeholder="Search by ID,name or mobile number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Guardian Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell>{reg.id}</TableCell>
                <TableCell>{reg.fullName}</TableCell>
                <TableCell>{reg.guardianName}</TableCell>
                <TableCell>{reg.phoneNumber}</TableCell>
                <TableCell>{reg.city}</TableCell>
                <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className={
                    reg.status === 'APPROVED' ? 'text-green-600' :
                    reg.status === 'REJECTED' ? 'text-red-600' :
                    'text-yellow-600'
                  }>
                    {reg.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={reg.status === 'APPROVED' ? 'outline' : 'default'}
                      onClick={() => handleStatusChange(reg.id, 'APPROVED')}
                      disabled={reg.status === 'APPROVED'}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={reg.status === 'REJECTED' ? 'outline' : 'destructive'}
                      onClick={() => handleStatusChange(reg.id, 'REJECTED')}
                      disabled={reg.status === 'REJECTED'}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
} 
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

interface Registration {
  id: string;
  fullName: string;
  age: string;
  gender: 'M' | 'F';
  guardianName: string;
  address: string;
  city: string;
  pinCode: string;
  village: string;
  aadharNumber: number;
  phoneNumber: number;
  whatsappNumber: number;
  emergencyContact: number;
  existingTapasya?: string;
  linkedForm?: string;
  hasParticipatedBefore: boolean;
  photoKey: string;
  aadharKey: string;
  formType: 'SAN' | 'CHA' | 'NAV';
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (registration: Registration) => {
    setSelectedRegistration(registration);
    setIsEditDialogOpen(true);
  };

  const filteredRegistrations = registrations.filter(reg =>
    reg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.phoneNumber.toString().includes(searchTerm)
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
                variant="outline"
                onClick={() => handleViewDetails(reg)}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(reg)}
              >
                Edit
              </Button>
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
                      variant="outline"
                      onClick={() => handleViewDetails(reg)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(reg)}
                    >
                      Edit
                    </Button>
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

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Personal Information</h3>
                  <div className="space-y-2 mt-2">
                    <p><span className="font-medium">Full Name:</span> {selectedRegistration.fullName}</p>
                    <p><span className="font-medium">Age:</span> {selectedRegistration.age}</p>
                    <p><span className="font-medium">Gender:</span> {selectedRegistration.gender === 'M' ? 'Male' : 'Female'}</p>
                    <p><span className="font-medium">Guardian Name:</span> {selectedRegistration.guardianName}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="space-y-2 mt-2">
                    <p><span className="font-medium">Phone:</span> {selectedRegistration.phoneNumber}</p>
                    <p><span className="font-medium">WhatsApp:</span> {selectedRegistration.whatsappNumber}</p>
                    <p><span className="font-medium">Emergency Contact:</span> {selectedRegistration.emergencyContact}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <div className="space-y-2 mt-2">
                    <p><span className="font-medium">Address:</span> {selectedRegistration.address}</p>
                    <p><span className="font-medium">City:</span> {selectedRegistration.city}</p>
                    <p><span className="font-medium">Village:</span> {selectedRegistration.village}</p>
                    <p><span className="font-medium">Pin Code:</span> {selectedRegistration.pinCode}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Additional Information</h3>
                  <div className="space-y-2 mt-2">
                    <p><span className="font-medium">Aadhar Number:</span> {selectedRegistration.aadharNumber}</p>
                    <p><span className="font-medium">Previous Participation:</span> {selectedRegistration.hasParticipatedBefore ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Linked Form:</span> {selectedRegistration.linkedForm || 'N/A'}</p>
                    <p><span className="font-medium">Existing Tapasya:</span> {selectedRegistration.existingTapasya || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Passport Photo</h3>
                  <div className="mt-2 relative w-32 h-40 border rounded-lg overflow-hidden">
                    <Image
                      src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`}
                      alt="Passport Photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Aadhar Card</h3>
                  <div className="mt-2 relative w-32 h-40 border rounded-lg overflow-hidden">
                    <Image
                      src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`}
                      alt="Aadhar Card"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Add edit form fields here */}
              <p className="text-center text-gray-500">Edit functionality will be implemented in the next phase.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
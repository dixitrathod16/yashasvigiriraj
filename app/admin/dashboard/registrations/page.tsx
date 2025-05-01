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
import { Dialog as PreviewDialog, DialogContent as PreviewDialogContent } from "@/components/ui/dialog";

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

// Categories data
const categories = [
  {
    id: 'SAN',
    titleHindi: 'संपूर्ण संघ',
    titleEnglish: 'FULL SANGH',
    description: 'Sildar to Shatrunjay Maha Tirth',
    date: '26/11/2025 - 07/12/2025',
    previousYatraMessage: 'आपने पहले भी कभी छःरि पालित संघ यात्रा की है',
    bottomText: 'मैं निश्रा दाता पूज्य गुरुभगवंत की आज्ञा अनुसार एवं व्यवस्थापकों को सहयोग देकर छःरि पालित संघ के नियमों का पालन करूँगा / करूँगी। अतः आप मेरा प्रवेश पत्र स्वीकृत करें।',
  },
  {
    id: 'CHA',
    titleHindi: 'छःरिपालित संघ',
    titleEnglish: 'CHARIPALITH SANGH',
    description: 'Ayodhyapuram to Shatrunjay Maha Tirth',
    date: '02/11/2025 - 07/12/2025',
    previousYatraMessage: 'आपने पहले भी कभी छःरि पालित संघ यात्रा की है',
    bottomText: 'मैं निश्रा दाता पूज्य गुरुभगवंत की आज्ञा अनुसार एवं व्यवस्थापकों को सहयोग देकर छःरि पालित संघ के नियमों का पालन करूँगा / करूँगी। अतः आप मेरा प्रवेश पत्र स्वीकृत करें।',
  },
  {
    id: 'NAV',
    titleHindi: 'नवाणु',
    titleEnglish: 'NAVANU',
    description: 'Shatrunjay Maha Tirth',
    date: '07/11/2025 - 14/01/2026',
    previousYatraMessage: 'आपने पहले भी कभी नव्वाणु यात्रा की है',
    bottomText: 'मैं निश्रा दाता पूज्य गुरुभगवंत की आज्ञा अनुसार एवं व्यवस्थापकों को सहयोग देकर नवाणु के नियमों का पालन करूँगा / करूँगी। अतः आप मेरा प्रवेश पत्र स्वीकृत करें।',
  }
];

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SAN' | 'CHA' | 'NAV'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50];
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageAlt, setPreviewImageAlt] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<'id' | 'fullName' | 'age' | 'createdAt' | 'city' | 'village'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Calculate totals per category
  const totals = {
    SAN: registrations.filter(r => r.formType === 'SAN').length,
    CHA: registrations.filter(r => r.formType === 'CHA').length,
    NAV: registrations.filter(r => r.formType === 'NAV').length,
  };

  // Sorting function
  const sortRegistrations = (a: Registration, b: Registration) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (sortColumn === 'age') {
      // Ensure age is treated as a number
      return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
    } else if (sortColumn === 'createdAt') {
      // Sort createdAt as a date
      return sortOrder === 'asc' ? new Date(aValue).getTime() - new Date(bValue).getTime() : new Date(bValue).getTime() - new Date(aValue).getTime();
    } else {
      // Sort other fields (including city and village) as strings
      return sortOrder === 'asc' ? 
        String(aValue).localeCompare(String(bValue)) : 
        String(bValue).localeCompare(String(aValue));
    }
  };

  // Sort registrations based on current sort criteria
  const sortedRegistrations = [...registrations]
    .sort(sortRegistrations);

  // Filtered registrations by search, category, and status
  const filteredRegistrations = sortedRegistrations.filter(reg =>
    (categoryFilter === 'ALL' || reg.formType === categoryFilter) &&
    (statusFilter === 'ALL' || reg.status === statusFilter) &&
    (
      reg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phoneNumber.toString().includes(searchTerm)
    )
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRegistrations.length / pageSize);
  const paginatedRegistrations = filteredRegistrations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Category filter buttons
  const categoryButtons = [
    { id: 'ALL', label: 'All', count: registrations.length },
    ...categories.map(cat => ({ id: cat.id, label: cat.titleEnglish, count: totals[cat.id as keyof typeof totals] }))
  ];

  // Status filter buttons with counts based on current category filter
  const statusCounts = {
    ALL: filteredRegistrations.length,
    PENDING: registrations.filter(reg => (categoryFilter === 'ALL' || reg.formType === categoryFilter) && reg.status === 'PENDING').length,
    APPROVED: registrations.filter(reg => (categoryFilter === 'ALL' || reg.formType === categoryFilter) && reg.status === 'APPROVED').length,
  };
  const statusButtons = [
    { id: 'ALL', label: 'All', count: statusCounts.ALL },
    { id: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
    { id: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
  ];

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

  if (loading) {
    return <div className="p-6 mt-10">Loading...</div>;
  }

  const filterBar = (
    <div className="flex flex-col gap-4 mb-4 w-full">
      {/* Master Filter: Category */}
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-sm text-gray-700">Category</span>
        <div className="flex flex-wrap gap-2">
          {categoryButtons.map(btn => (
            <Button
              key={btn.id}
              variant={categoryFilter === btn.id ? 'default' : 'outline'}
              onClick={() => { setCategoryFilter(btn.id as typeof categoryFilter); setCurrentPage(1); }}
              className="px-4 py-2"
            >
              {btn.label} <span className="ml-2 text-xs text-gray-500">({btn.count})</span>
            </Button>
          ))}
        </div>
      </div>
      {/* Sub Filter: Status */}
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-sm text-gray-700">Status</span>
        <div className="flex flex-wrap gap-2">
          {statusButtons.map(btn => (
            <Button
              key={btn.id}
              variant={statusFilter === btn.id ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(btn.id as typeof statusFilter); setCurrentPage(1); }}
              className="px-3 py-2"
            >
              {btn.label} <span className="ml-2 text-xs text-gray-500">({btn.count})</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // Improved pagination with page numbers and ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const paginationBar = (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center items-stretch gap-2 mt-4 w-full">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt; Prev</Button>
        {getPageNumbers().map((page, idx) =>
          typeof page === 'number' ? (
            <Button
              key={page}
              size="sm"
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => setCurrentPage(page)}
              className="w-9 px-0"
            >
              {page}
            </Button>
          ) : (
            <span key={"ellipsis-" + idx} className="px-2 text-gray-400 select-none">...</span>
          )
        )}
        <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next &gt;</Button>
      </div>
      <div className="flex justify-center items-center gap-2">
        <label htmlFor="page-size-select" className="text-sm text-gray-700 font-medium">Items per page:</label>
        <select
          id="page-size-select"
          className="border rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
        >
          {pageSizeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const mainContent = isMobile ? (
    <div className="space-y-4 p-2 mt-2">
      {filterBar}
      <Input
        placeholder="Search by ID,name or mobile number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      {paginatedRegistrations.map((reg) => (
        <Card
          key={reg.id}
          className="p-4 space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleViewDetails(reg)}
        >
          <div className="text-xs text-gray-500 mb-1">ID: {reg.id}</div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{reg.fullName}</h3>
              <p className="text-sm text-gray-500">{reg.phoneNumber}</p>
            </div>
            <span className={`text-sm ${reg.status === 'APPROVED' ? 'text-green-600' :
                reg.status === 'REJECTED' ? 'text-red-600' :
                  'text-yellow-600'
              }`}>
              {reg.status}
            </span>
          </div>
          <div className="text-sm">
            <p>Guardian: {reg.guardianName}</p>
            <p>City: {reg.city}</p>
            <p>Date: {new Date(reg.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={e => { e.stopPropagation(); handleViewDetails(reg); }}
            >
              View Details
            </Button>
            <Button
              size="sm"
              variant={reg.status === 'APPROVED' ? 'outline' : 'default'}
              onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'APPROVED'); }}
              disabled={reg.status === 'APPROVED'}
            >
              Approve
            </Button>
          </div>
        </Card>
      ))}
      {paginationBar}
    </div>
  ) : (
    <Card className="p-6 mt-10">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Registrations</h2>
        </div>
        {filterBar}
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
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors" 
                onClick={() => { setSortColumn('id'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                ID {sortColumn === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setSortColumn('fullName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Name {sortColumn === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Guardian Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Aadhar Number</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setSortColumn('city'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                City {sortColumn === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setSortColumn('village'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Village {sortColumn === 'village' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setSortColumn('createdAt'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Date {sortColumn === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => { setSortColumn('age'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
              >
                Age {sortColumn === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRegistrations.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell>{reg.id}</TableCell>
                <TableCell>{reg.fullName}</TableCell>
                <TableCell>{reg.guardianName}</TableCell>
                <TableCell>{reg.phoneNumber}</TableCell>
                <TableCell>{reg.aadharNumber}</TableCell>
                <TableCell>{reg.city}</TableCell>
                <TableCell>{reg.village}</TableCell>
                <TableCell>{new Date(reg.createdAt).toLocaleString()}</TableCell>
                <TableCell>{reg.age}</TableCell>
                <TableCell>{reg.gender === 'M' ? 'Male' : 'Female'}</TableCell>
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
                      onClick={e => { e.stopPropagation(); handleViewDetails(reg); }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant={reg.status === 'APPROVED' ? 'outline' : 'default'}
                      onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'APPROVED'); }}
                      disabled={reg.status === 'APPROVED'}
                    >
                      Approve
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {paginationBar}
    </Card>
  );

  return (
    <>
      {mainContent}
      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] min-h-[60vh] overflow-y-auto p-0">
          <DialogHeader className="px-8 pt-7 pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Registration Details
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          {selectedRegistration && (
            <div className="bg-white/95">
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 p-8">
                {/* Left Column - Registration Details */}
                <div className="space-y-6">
                  {/* Top: Category and Registration ID */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {categories.find(c => c.id === selectedRegistration.formType)?.titleEnglish}
                      </span>
                      <span className="text-sm text-gray-500">({categories.find(c => c.id === selectedRegistration.formType)?.titleHindi})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Registration ID:</span>
                      <span className="text-primary font-bold tracking-wide">{selectedRegistration.id}</span>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.fullName}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Age & Gender</label>
                          <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                            {selectedRegistration.age} years • 
                            <span className="inline-flex items-center gap-1">
                              {selectedRegistration.gender === 'M' ? (
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M16 8l4-4m0 0v4m0-4h-4" /></svg>
                              ) : (
                                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0 0V8m0 4h4m-4 0H8" /></svg>
                              )}
                              {selectedRegistration.gender === 'M' ? 'Male' : 'Female'}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Guardian Name</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.guardianName}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.aadharNumber}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Previous Participation</label>
                          <p className="text-base font-medium">
                            <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${selectedRegistration.hasParticipatedBefore ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {selectedRegistration.hasParticipatedBefore ? 'Yes' : 'No'}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Registration Date</label>
                          <p className="text-base font-medium text-gray-900">{new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Phone Number</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.phoneNumber}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">WhatsApp Number</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.whatsappNumber}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.emergencyContact}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">City</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.city}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Village</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.village}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500">Pin Code</label>
                          <p className="text-base font-medium text-gray-900">{selectedRegistration.pinCode}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <label className="text-sm font-medium text-gray-500">Full Address</label>
                      <p className="text-base font-medium text-gray-900 whitespace-pre-line">{selectedRegistration.address}</p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Linked Form</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.linkedForm || 'Not Available'}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Existing Tapasya</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.existingTapasya || 'Not Available'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Images and Status */}
                <div className="space-y-6 lg:border-l lg:pl-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <div className="grid grid-cols-1 gap-6">
                      {/* Passport Photo */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-500">Passport Photo</label>
                        <div 
                          className="relative aspect-[3/4] w-full max-w-sm mx-auto border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            setPreviewImageUrl(`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`);
                            setPreviewImageAlt('Passport Photo');
                          }}
                        >
                          <Image
                            src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`}
                            alt="Passport Photo"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                            <span className="text-white font-semibold">Click to Preview</span>
                          </div>
                        </div>
                      </div>

                      {/* Aadhar Card */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-500">Aadhar Card</label>
                        <div 
                          className="relative aspect-[3/4] w-full max-w-sm mx-auto border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            setPreviewImageUrl(`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`);
                            setPreviewImageAlt('Aadhar Card');
                          }}
                        >
                          <Image
                            src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`}
                            alt="Aadhar Card"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                            <span className="text-white font-semibold">Click to Preview</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Sticky Bar */}
              <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t flex flex-wrap items-center justify-between shadow-lg bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 hidden sm:inline">Status:</span>
                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedRegistration.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                    selectedRegistration.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedRegistration.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedRegistration.status === 'APPROVED' ? 'outline' : 'default'}
                    onClick={() => handleStatusChange(selectedRegistration.id, 'APPROVED')}
                    disabled={selectedRegistration.status === 'APPROVED'}
                    size="sm"
                    className="h-9 px-2 sm:px-3"
                    title="Approve"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline ml-2">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(selectedRegistration)}
                    size="sm"
                    className="h-9 px-2 sm:px-3"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" />
                    </svg>
                    <span className="hidden sm:inline ml-2">Edit</span>
                  </Button>
                  <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2" /> {/* Vertical Divider */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 sm:px-3"
                    onClick={() => setIsViewDialogOpen(false)}
                    title="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline ml-2">Close</span>
                  </Button>
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
      {/* Full-size image preview dialog */}
      <PreviewDialog open={!!previewImageUrl} onOpenChange={(open) => { if (!open) setPreviewImageUrl(null); }}>
        <PreviewDialogContent className="max-w-[95vw] w-full max-h-[95vh] h-[95vh] overflow-hidden bg-black/90 p-0">
          {previewImageUrl && (
            <div className="relative w-full h-full flex flex-col">
              {/* Close button */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setPreviewImageUrl(null)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="ml-2">Close Preview</span>
                </Button>
              </div>

              {/* Image container with proper scaling */}
              <div className="flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden">
                <div className="relative max-w-full max-h-full w-auto h-auto">
                  <img
                    src={previewImageUrl}
                    alt={previewImageAlt}
                    className="max-w-full max-h-[75vh] w-auto h-auto object-contain mx-auto"
                    style={{ 
                      objectFit: 'contain',
                      objectPosition: 'center'
                    }}
                  />
                </div>
              </div>

              {/* Image info footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-center">
                <p className="font-semibold">{previewImageAlt}</p>
                {selectedRegistration && (
                  <>
                    <p className="text-base text-gray-200">{selectedRegistration.fullName}</p>
                    {previewImageAlt === 'Aadhar Card' && (
                      <p className="text-sm text-gray-300 mt-1">
                        Aadhar: {selectedRegistration.aadharNumber}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </PreviewDialogContent>
      </PreviewDialog>
    </>
  );
} 
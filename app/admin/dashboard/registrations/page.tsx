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

  // Calculate totals per category
  const totals = {
    SAN: registrations.filter(r => r.formType === 'SAN').length,
    CHA: registrations.filter(r => r.formType === 'CHA').length,
    NAV: registrations.filter(r => r.formType === 'NAV').length,
  };

  // Filtered registrations by search, category, and status
  const filteredRegistrations = registrations.filter(reg =>
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
            <p>Date: {new Date(reg.createdAt).toLocaleDateString()}</p>
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
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Guardian Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Aadhar Number</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Village</TableHead>
              <TableHead>Date</TableHead>
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
        <DialogContent className="max-w-3xl w-full max-h-[98vh] min-h-[60vh] overflow-y-auto px-0 py-0">
          <DialogHeader className="px-8 pt-7 pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Registration Details
            </DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="px-8 py-6 bg-white/95">
              {/* Top: Category and Registration ID */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-sm">
                    {categories.find(c => c.id === selectedRegistration.formType)?.titleEnglish}
                  </span>
                  <span className="text-xs text-gray-500">({categories.find(c => c.id === selectedRegistration.formType)?.titleHindi})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700 text-xs">ID:</span>
                  <span className="text-primary font-bold text-sm tracking-wide">{selectedRegistration.id}</span>
                </div>
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[15px]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Full Name:</span>
                    <span>{selectedRegistration.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Age:</span>
                    <span>{selectedRegistration.age}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Gender:</span>
                    <span className="inline-flex items-center gap-1">
                      {selectedRegistration.gender === 'M' ? (
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M16 8l4-4m0 0v4m0-4h-4" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0 0V8m0 4h4m-4 0H8" /></svg>
                      )}
                      {selectedRegistration.gender === 'M' ? 'Male' : 'Female'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Guardian:</span>
                    <span>{selectedRegistration.guardianName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">City:</span>
                    <span>{selectedRegistration.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Village:</span>
                    <span>{selectedRegistration.village}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary pt-0.5">Address:</span>
                    <span className="break-words whitespace-pre-line mt-0.5">{selectedRegistration.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Pin Code:</span>
                    <span>{selectedRegistration.pinCode}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Phone:</span>
                    <span>{selectedRegistration.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">WhatsApp:</span>
                    <span>{selectedRegistration.whatsappNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Emergency:</span>
                    <span>{selectedRegistration.emergencyContact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Aadhar:</span>
                    <span>{selectedRegistration.aadharNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Prev. Participation:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${selectedRegistration.hasParticipatedBefore ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{selectedRegistration.hasParticipatedBefore ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Linked Form:</span>
                    <span>{selectedRegistration.linkedForm || <span className="text-gray-400">N/A</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">Tapasya:</span>
                    <span>{selectedRegistration.existingTapasya || <span className="text-gray-400">N/A</span>}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t" />

              {/* Images Row */}
              <div className="flex flex-wrap gap-8 items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-gray-700 mb-1">Passport Photo</span>
                  <div className="relative w-28 h-36 border rounded-lg overflow-hidden group cursor-pointer shadow-sm" onClick={() => {
                    setPreviewImageUrl(`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`);
                    setPreviewImageAlt('Passport Photo');
                  }}>
                    <Image
                      src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`}
                      alt="Passport Photo"
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white text-xs font-semibold transition-opacity">Preview</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-gray-700 mb-1">Aadhar Card</span>
                  <div className="relative w-28 h-36 border rounded-lg overflow-hidden group cursor-pointer shadow-sm" onClick={() => {
                    setPreviewImageUrl(`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`);
                    setPreviewImageAlt('Aadhar Card');
                  }}>
                    <Image
                      src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`}
                      alt="Aadhar Card"
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white text-xs font-semibold transition-opacity">Preview</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t" />

              {/* Status and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 text-sm">Status:</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${selectedRegistration.status === 'APPROVED' ? 'bg-green-100 text-green-700' : selectedRegistration.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedRegistration.status}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(selectedRegistration)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" /></svg>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedRegistration.status === 'APPROVED' ? 'outline' : 'default'}
                    onClick={() => handleStatusChange(selectedRegistration.id, 'APPROVED')}
                    disabled={selectedRegistration.status === 'APPROVED'}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Approve
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
        <PreviewDialogContent className="flex flex-col items-center justify-center max-w-3xl w-full">
          {previewImageUrl && (
            <div className="w-full flex flex-col items-center">
              <img
                src={previewImageUrl}
                alt={previewImageAlt}
                className="max-w-full max-h-[80vh] rounded-lg border shadow-lg"
                style={{ objectFit: 'contain' }}
              />
              <span className="mt-2 text-gray-600 text-sm font-semibold">{previewImageAlt}</span>
              {selectedRegistration && (
                <span className="mt-1 text-gray-800 text-base font-bold">{selectedRegistration.fullName}</span>
              )}
            </div>
          )}
        </PreviewDialogContent>
      </PreviewDialog>
    </>
  );
} 
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
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
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { X } from 'lucide-react';

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
  const [advancedFilters, setAdvancedFilters] = useState({
    id: '',
    fullName: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    guardianName: '',
    address: '',
    city: '',
    pinCode: '',
    village: '',
    aadharNumber: '',
    phoneNumber: '',
    whatsappNumber: '',
    emergencyContact: '',
    existingTapasya: '',
    linkedForm: '',
    hasParticipatedBefore: '',
    formType: '',
    createdAtFrom: '',
    createdAtTo: '',
    status: '',
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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

  // Advanced filter logic
  const filteredRegistrations = sortedRegistrations.filter((reg: Registration) => {
    // Category and status filter (legacy, for buttons)
    if (categoryFilter !== 'ALL' && reg.formType !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && reg.status !== statusFilter) return false;
    // Advanced filters
    if (advancedFilters.id && !reg.id.toLowerCase().includes(advancedFilters.id.toLowerCase())) return false;
    if (advancedFilters.fullName && !reg.fullName.toLowerCase().includes(advancedFilters.fullName.toLowerCase())) return false;
    if (advancedFilters.ageMin && Number(reg.age) < Number(advancedFilters.ageMin)) return false;
    if (advancedFilters.ageMax && Number(reg.age) > Number(advancedFilters.ageMax)) return false;
    if (advancedFilters.gender && advancedFilters.gender !== 'any' && reg.gender !== advancedFilters.gender) return false;
    if (advancedFilters.city && !reg.city.toLowerCase().includes(advancedFilters.city.toLowerCase())) return false;
    if (advancedFilters.village && !reg.village.toLowerCase().includes(advancedFilters.village.toLowerCase())) return false;
    if (advancedFilters.aadharNumber && !reg.aadharNumber.toString().includes(advancedFilters.aadharNumber)) return false;
    if (advancedFilters.phoneNumber && !reg.phoneNumber.toString().includes(advancedFilters.phoneNumber)) return false;
    if (advancedFilters.whatsappNumber && !reg.whatsappNumber.toString().includes(advancedFilters.whatsappNumber)) return false;
    if (advancedFilters.emergencyContact && !reg.emergencyContact.toString().includes(advancedFilters.emergencyContact)) return false;
    if (advancedFilters.existingTapasya && !(reg.existingTapasya || '').toLowerCase().includes(advancedFilters.existingTapasya.toLowerCase())) return false;
    if (advancedFilters.linkedForm && !(reg.linkedForm || '').toLowerCase().includes(advancedFilters.linkedForm.toLowerCase())) return false;
    if (advancedFilters.hasParticipatedBefore && advancedFilters.hasParticipatedBefore !== 'any') {
      if (advancedFilters.hasParticipatedBefore === 'true' && !reg.hasParticipatedBefore) return false;
      if (advancedFilters.hasParticipatedBefore === 'false' && reg.hasParticipatedBefore) return false;
    }
    if (advancedFilters.formType && advancedFilters.formType !== 'any' && reg.formType !== advancedFilters.formType) return false;
    if (advancedFilters.status && advancedFilters.status !== 'any' && reg.status !== advancedFilters.status) return false;
    if (advancedFilters.createdAtFrom && advancedFilters.createdAtTo) {
      const from = new Date(advancedFilters.createdAtFrom);
      const to = new Date(advancedFilters.createdAtTo);
      const regDate = new Date(reg.createdAt);
      // Compare only the date part (ignore time)
      const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      const regDateOnly = new Date(regDate.getFullYear(), regDate.getMonth(), regDate.getDate());
      if (regDateOnly < fromDate || regDateOnly > toDate) return false;
    } else {
      if (advancedFilters.createdAtFrom) {
        const from = new Date(advancedFilters.createdAtFrom);
        const regDate = new Date(reg.createdAt);
        const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const regDateOnly = new Date(regDate.getFullYear(), regDate.getMonth(), regDate.getDate());
        if (regDateOnly < fromDate) return false;
      }
      if (advancedFilters.createdAtTo) {
        const to = new Date(advancedFilters.createdAtTo);
        const regDate = new Date(reg.createdAt);
        const toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());
        const regDateOnly = new Date(regDate.getFullYear(), regDate.getMonth(), regDate.getDate());
        if (regDateOnly > toDate) return false;
      }
    }
    return true;
  });

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

  // Helper for filter chips
  const filterLabels: Record<string, string> = {
    id: 'Registration ID',
    fullName: 'Full Name',
    city: 'City',
    village: 'Village',
    linkedForm: 'Linked Form',
    aadharNumber: 'Aadhar Number',
    phoneNumber: 'Phone Number',
    ageMin: 'Age Min',
    ageMax: 'Age Max',
    gender: 'Gender',
    hasParticipatedBefore: 'Previous Participation',
    createdAtFrom: 'Created From',
    createdAtTo: 'Created To',
  };
  const filterValueDisplay = (key: string, value: string) => {
    if (key === 'gender') return value === 'M' ? 'Male' : value === 'F' ? 'Female' : value;
    if (key === 'hasParticipatedBefore') return value === 'true' ? 'Yes' : value === 'false' ? 'No' : value;
    return value;
  };
  const appliedFilterChips = useMemo(() => {
    return Object.entries(advancedFilters)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([key, value]) => value && value !== 'any')
      .map(([key, value]) => ({
        key,
        label: filterLabels[key] || key,
        value: filterValueDisplay(key, value),
      }));
  }, [advancedFilters]);

  const removeFilter = (key: string) => {
    setAdvancedFilters(f => ({ ...f, [key]: '' }));
  };
  const clearAllFilters = () => {
    setAdvancedFilters({
      id: '',
      fullName: '',
      ageMin: '',
      ageMax: '',
      gender: '',
      guardianName: '',
      address: '',
      city: '',
      pinCode: '',
      village: '',
      aadharNumber: '',
      phoneNumber: '',
      whatsappNumber: '',
      emergencyContact: '',
      existingTapasya: '',
      linkedForm: '',
      hasParticipatedBefore: '',
      formType: '',
      createdAtFrom: '',
      createdAtTo: '',
      status: '',
    });
  };

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

  // Advanced filter popover UI (mobile friendly, with close button)
  const advancedFilterSection = (
    <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit">
          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          Advanced Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-4 w-[340px] max-w-[95vw] md:w-[340px] md:max-w-[340px] rounded-md md:rounded-md left-0 right-0 md:left-auto md:right-auto z-[60]"
        style={{ maxWidth: '95vw' }}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setIsAdvancedOpen(false)}
          aria-label="Close advanced filters"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Registration ID</label>
              <Input className="h-7 text-xs" value={advancedFilters.id} onChange={e => setAdvancedFilters(f => ({ ...f, id: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Name</label>
              <Input className="h-7 text-xs" value={advancedFilters.fullName} onChange={e => setAdvancedFilters(f => ({ ...f, fullName: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">City</label>
              <Input className="h-7 text-xs" value={advancedFilters.city} onChange={e => setAdvancedFilters(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1  gap-1">
              <label className="text-xs text-gray-700 font-semibold">Village</label>
              <Input className="h-7 text-xs" value={advancedFilters.village} onChange={e => setAdvancedFilters(f => ({ ...f, village: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1  gap-1">
              <label className="text-xs text-gray-700 font-semibold">Aadhar Number</label>
              <Input type="number" className="h-7 text-xs" value={advancedFilters.aadharNumber} onChange={e => setAdvancedFilters(f => ({ ...f, aadharNumber: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1  gap-1">
              <label className="text-xs text-gray-700 font-semibold">Linked Form</label>
              <Input className="h-7 text-xs" value={advancedFilters.linkedForm} onChange={e => setAdvancedFilters(f => ({ ...f, linkedForm: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Phone Number</label>
              <Input type="number" className="h-7 text-xs" value={advancedFilters.phoneNumber} onChange={e => setAdvancedFilters(f => ({ ...f, phoneNumber: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Gender</label>
              <Select value={advancedFilters.gender} onValueChange={v => setAdvancedFilters(f => ({ ...f, gender: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Age Min</label>
              <Input type="number" className="h-7 text-xs" value={advancedFilters.ageMin} onChange={e => setAdvancedFilters(f => ({ ...f, ageMin: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Age Max</label>
              <Input type="number" className="h-7 text-xs" value={advancedFilters.ageMax} onChange={e => setAdvancedFilters(f => ({ ...f, ageMax: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-row gap-2 items-end">
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Created From</label>
              <Input type="date" className="h-7 text-xs" value={advancedFilters.createdAtFrom} onChange={e => setAdvancedFilters(f => ({ ...f, createdAtFrom: e.target.value }))} />
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <label className="text-xs text-gray-700 font-semibold">Created To</label>
              <Input type="date" className="h-7 text-xs" value={advancedFilters.createdAtTo} onChange={e => setAdvancedFilters(f => ({ ...f, createdAtTo: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-700 font-semibold">Previous Participation</label>
            <Select value={advancedFilters.hasParticipatedBefore} onValueChange={v => setAdvancedFilters(f => ({ ...f, hasParticipatedBefore: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent className="z-[70]">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={clearAllFilters}>Clear</Button>
            <Button size="sm" variant="default" className="h-7 px-3 text-xs" onClick={() => setIsAdvancedOpen(false)}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // Filter bar with advanced filter button on the right
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
      {/* Status Filter and Advanced Filters Button */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
        <div className="flex flex-col gap-2 flex-1">
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
        {/* Advanced Filters Button: right of status on desktop, below on mobile */}
        <div className="flex md:mt-6 mt-0 md:justify-end justify-start w-full md:w-auto">
          {advancedFilterSection}
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

  // Chips for applied filters
  const filterChips = (
    <div className="flex flex-wrap gap-2 mb-4">
      {appliedFilterChips.map((chip, idx) => (
        <span key={chip.label + chip.value + idx} className="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
          {chip.label}: {chip.value}
          <button
            className="ml-2 text-primary-foreground bg-primary/60 rounded-full p-0.5 hover:bg-primary"
            onClick={() => removeFilter(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </span>
      ))}
      {appliedFilterChips.length > 1 && (
        <Button size="sm" variant="ghost" className="ml-2" onClick={clearAllFilters}>Clear All</Button>
      )}
    </div>
  );

  const mainContent = isMobile ? (
    <div className="space-y-4 p-2 mt-2">
      {filterBar}
      {filterChips}
      {paginatedRegistrations.map((reg: Registration) => (
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
        {filterChips}
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
            {paginatedRegistrations.map((reg: Registration) => (
              <TableRow key={reg.id}>
                <TableCell>{reg.id}</TableCell>
                <TableCell>{reg.fullName}</TableCell>
                <TableCell>
                  <a
                    href={`tel:${reg.phoneNumber}`}
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  >
                    {reg.phoneNumber}
                  </a>
                </TableCell>
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
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-6 p-8">
                {/* Left Column - Registration Details */}
                <div className="space-y-6 max-w-2xl">
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
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.fullName}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Guardian Name</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.guardianName}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Age & Gender</label>
                        <p className="text-base font-medium text-gray-900 flex items-center gap-2">
                          {selectedRegistration.age} years
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

                  {/* Contact Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p>
                          <a
                            href={`tel:${selectedRegistration.phoneNumber}`}
                            className="text-base font-medium text-primary underline hover:text-primary/80 transition-colors"
                          >
                            {selectedRegistration.phoneNumber}
                          </a>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">WhatsApp Number</label>
                        <p>
                          <a
                            href={`https://wa.me/${selectedRegistration.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-medium text-primary underline hover:text-primary/80 transition-colors"
                          >
                            {selectedRegistration.whatsappNumber}
                          </a>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                        <p>
                          <a
                            href={`tel:${selectedRegistration.emergencyContact}`}
                            className="text-base font-medium text-primary underline hover:text-primary/80 transition-colors"
                          >
                            {selectedRegistration.emergencyContact}
                          </a>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Pin Code</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.pinCode}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">City</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.city}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">Village</label>
                        <p className="text-base font-medium text-gray-900">{selectedRegistration.village}</p>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-gray-500">Full Address</label>
                        <p className="text-base font-medium text-gray-900 whitespace-pre-line">{selectedRegistration.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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

                {/* Right Column - Documents */}
                <div className="space-y-6 lg:border-l lg:pl-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Passport Photo */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-500">Passport Photo</label>
                        <div
                          className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-gray-50"
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
                            <div className="flex flex-col items-center text-white">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              <span className="text-sm font-semibold">Click to Preview</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">Click image to view full size</p>
                      </div>

                      {/* Aadhar Card */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-500">Aadhar Card</label>
                        <div
                          className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-gray-50"
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
                            <div className="flex flex-col items-center text-white">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              <span className="text-sm font-semibold">Click to Preview</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">Click image to view full size</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Bar */}
              <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t flex flex-wrap items-center justify-between shadow-lg bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 hidden sm:inline">Status:</span>
                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-sm font-semibold ${selectedRegistration.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
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
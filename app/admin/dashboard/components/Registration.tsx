'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { runExcelExportWorker } from './exportWorkerWrapper';
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
    DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Dialog as PreviewDialog, DialogContent as PreviewDialogContent } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { X, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Download } from 'lucide-react';

type RegistrationStatus = 'PENDING' | 'SHORTLISTED' | 'APPROVED' | 'REJECTED';
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
    status: 'PENDING' | 'SHORTLISTED' | 'APPROVED' | 'REJECTED' | 'INACTIVE';
    arrivalDate?: string;
    arrivalTime?: string;
    arrivalPlace?: string;
    additionalNotes?: string;
    idPhotoKey?: string;
    travelDetailsSubmittedAt?: string;
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

export function Registration() {
    // Ref to store the export worker instance for cancellation
    const exportWorkerRef = React.useRef<{ cancel: () => void } | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Registration> | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [statusActionLoading, setStatusActionLoading] = useState<{ id: string | null, action: string | null }>({ id: null, action: null });
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SAN' | 'CHA' | 'NAV'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SHORTLISTED' | 'APPROVED' | 'INACTIVE'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageSizeOptions = [5, 10, 20, 50];
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [previewImageAlt, setPreviewImageAlt] = useState<string>('');
    // --- Export Dialog States ---
    const [exportLoading, setExportLoading] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isContactExportDialogOpen, setIsContactExportDialogOpen] = useState(false);
    const [includeImages, setIncludeImages] = useState(true);
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
    const [gotoPageInput, setGotoPageInput] = useState<string>('');
    // Add state for new image files and previews
    const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
    const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
    const [newAadharFile, setNewAadharFile] = useState<File | null>(null);
    const [newAadharPreview, setNewAadharPreview] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<{ photo?: string; aadhar?: string }>({});
    // Multiselect state
    const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState<RegistrationStatus | ''>('');
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    // Confirmation dialog state
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [pendingBulkAction, setPendingBulkAction] = useState<RegistrationStatus | ''>('');


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
        } else if (sortColumn === 'fullName') {
            // Case-insensitive, trimmed, and normalized alphabetical sort for names
            const aName = String(aValue).trim().normalize('NFKD');
            const bName = String(bValue).trim().normalize('NFKD');
            return sortOrder === 'asc'
                ? aName.localeCompare(bName, undefined, { sensitivity: 'base' })
                : bName.localeCompare(aName, undefined, { sensitivity: 'base' });
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

    // Base filtered list: category + advanced filters (but NOT status)
    const baseFilteredRegistrations = sortedRegistrations.filter((reg: Registration) => {
        if (categoryFilter !== 'ALL' && reg.formType !== categoryFilter) return false;
        // Advanced filters (same as before, but skip status)
        if (advancedFilters.id) {
            const idFilter = advancedFilters.id.toLowerCase().trim().normalize('NFKD');
            // Check if the filter contains comma-separated values
            if (idFilter.includes(',')) {
                // Split by comma and check if any of the IDs match
                const ids = idFilter.split(',').map(id => id.trim()).filter(id => id.length > 0);
                const matches = ids.some(id => 
                    reg.id
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                        .includes(id)
                );
                if (!matches) return false;
            } else {
                // Single ID filter (existing logic)
                if (!reg.id
                    .toLowerCase()
                    .trim()
                    .normalize('NFKD')
                    .includes(idFilter)
                ) return false;
            }
        }
        if (
            advancedFilters.fullName &&
            !reg.fullName
                .toLowerCase()
                .trim()
                .normalize('NFKD')
                .includes(
                    advancedFilters.fullName
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                )
        ) return false;
        if (
            advancedFilters.city &&
            !reg.city
                .toLowerCase()
                .trim()
                .normalize('NFKD')
                .includes(
                    advancedFilters.city
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                )
        ) return false;
        if (
            advancedFilters.village &&
            !reg.village
                .toLowerCase()
                .trim()
                .normalize('NFKD')
                .includes(
                    advancedFilters.village
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                )
        ) return false;
        if (
            advancedFilters.existingTapasya &&
            !((reg.existingTapasya || '')
                .toLowerCase()
                .trim()
                .normalize('NFKD')
                .includes(
                    advancedFilters.existingTapasya
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                ))
        ) return false;
        if (
            advancedFilters.linkedForm &&
            !((reg.linkedForm || '')
                .toLowerCase()
                .trim()
                .normalize('NFKD')
                .includes(
                    advancedFilters.linkedForm
                        .toLowerCase()
                        .trim()
                        .normalize('NFKD')
                ))
        ) return false;

        // Robust age filter logic
        const regAge = Number(reg.age);
        const ageMin = Number(advancedFilters.ageMin);
        const ageMax = Number(advancedFilters.ageMax);
        const hasAgeMin = advancedFilters.ageMin !== '' && !isNaN(ageMin);
        const hasAgeMax = advancedFilters.ageMax !== '' && !isNaN(ageMax);
        if (isNaN(regAge)) return false; // Ignore registrations with invalid age
        if (hasAgeMin && regAge < ageMin) return false;
        if (hasAgeMax && regAge > ageMax) return false;

        if (advancedFilters.gender && advancedFilters.gender !== 'any' && reg.gender !== advancedFilters.gender) return false;
        if (advancedFilters.pinCode && !reg.pinCode.includes(advancedFilters.pinCode)) return false;
        if (advancedFilters.aadharNumber && !reg.aadharNumber.toString().includes(advancedFilters.aadharNumber)) return false;
        if (advancedFilters.phoneNumber && !reg.phoneNumber.toString().includes(advancedFilters.phoneNumber)) return false;
        if (advancedFilters.whatsappNumber && !reg.whatsappNumber.toString().includes(advancedFilters.whatsappNumber)) return false;
        if (advancedFilters.emergencyContact && !reg.emergencyContact.toString().includes(advancedFilters.emergencyContact)) return false;
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

    // Now, filteredRegistrations applies the status filter to the base list
    const filteredRegistrations = baseFilteredRegistrations.filter((reg: Registration) => {
        if (statusFilter !== 'ALL' && reg.status !== statusFilter) return false;
        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRegistrations.length / pageSize);
    const paginatedRegistrations = filteredRegistrations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Multiselect helper functions
    const toggleRegistrationSelection = (id: string) => {
        setSelectedRegistrations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Get all filtered registrations (not just paginated ones)
    const allFilteredRegistrations = useMemo(() => {
        return baseFilteredRegistrations.filter(reg => {
            if (statusFilter !== 'ALL' && reg.status !== statusFilter) return false;
            return true;
        });
    }, [baseFilteredRegistrations, statusFilter]);

    const selectAllFiltered = () => {
        const newSet = new Set(selectedRegistrations);
        allFilteredRegistrations.forEach(reg => newSet.add(reg.id));
        setSelectedRegistrations(newSet);
    };

    const deselectAllFiltered = () => {
        const newSet = new Set(selectedRegistrations);
        allFilteredRegistrations.forEach(reg => newSet.delete(reg.id));
        setSelectedRegistrations(newSet);
    };

    const isAllFilteredSelected = allFilteredRegistrations.length > 0 && 
        allFilteredRegistrations.every(reg => selectedRegistrations.has(reg.id));

    const clearSelection = () => {
        setSelectedRegistrations(new Set());
    };

    // Bulk status update function
    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus || selectedRegistrations.size === 0) return;
        
        // Show confirmation dialog instead of directly updating
        setPendingBulkAction(bulkStatus);
        setIsConfirmDialogOpen(true);
    };
    
    // Actual bulk update function that gets called after confirmation
    const performBulkStatusUpdate = async () => {
        if (!pendingBulkAction || selectedRegistrations.size === 0) return;
        
        setBulkActionLoading(true);
        setIsConfirmDialogOpen(false);
        try {
            // Get the selected registrations with their formType and aadharNumber
            // Use all registrations, not just paginated ones
            const registrationsToUpdate = registrations
                .filter(reg => selectedRegistrations.has(reg.id))
                .map(reg => ({
                    formType: reg.formType,
                    aadharNumber: reg.aadharNumber,
                    status: pendingBulkAction
                }));
            
            // Send bulk update request
            const response = await fetch(`/api/admin/registrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationsToUpdate)
            });
            
            if (response.ok) {
                // Update local state
                setRegistrations(prev => 
                    prev.map(reg => 
                        selectedRegistrations.has(reg.id) 
                            ? { ...reg, status: pendingBulkAction } 
                            : reg
                    )
                );
                
                toast.success(`${selectedRegistrations.size} registration(s) updated successfully`);
                clearSelection();
                setBulkStatus('PENDING'); // Reset bulk status
                setPendingBulkAction(''); // Reset pending action
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update registrations');
            }
        } catch (error) {
            console.error('Bulk update error:', error);
            toast.error('Failed to update registrations');
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Category filter buttons
    const categoryButtons = [
        { id: 'ALL', label: 'All', count: registrations.length },
        ...categories.map(cat => ({ id: cat.id, label: cat.titleEnglish, count: totals[cat.id as keyof typeof totals] }))
    ];

    // Status filter buttons with counts based on current category filter
    const statusCounts = {
        ALL: baseFilteredRegistrations.length,
        PENDING: baseFilteredRegistrations.filter(reg => reg.status === 'PENDING').length,
        SHORTLISTED: baseFilteredRegistrations.filter(reg => reg.status === 'SHORTLISTED').length,
        APPROVED: baseFilteredRegistrations.filter(reg => reg.status === 'APPROVED').length,
        INACTIVE: baseFilteredRegistrations.filter(reg => reg.status === 'INACTIVE').length,
    };
    const statusButtons = [
        { id: 'ALL', label: 'All', count: statusCounts.ALL },
        { id: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
        { id: 'SHORTLISTED', label: 'Shortlisted', count: statusCounts.SHORTLISTED },
        { id: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
        { id: 'INACTIVE', label: 'Inactive', count: statusCounts.INACTIVE },
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

    const handleStatusChange = async (id: string, newStatus: RegistrationStatus, actionType?: string) => {
        setStatusActionLoading({ id, action: actionType || null });
        try {
            // Find the registration by id to get formType and aadharNumber
            const regIndex = registrations.findIndex(r => r.id === id);
            if (regIndex === -1) throw new Error('Registration not found');

            // Update the status in the local state
            const updatedRegistration = { ...registrations[regIndex], status: newStatus };

            // Make the API call to update the status
            const response = await fetch(`/api/admin/registrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formType: updatedRegistration.formType,
                    aadharNumber: updatedRegistration.aadharNumber,
                    status: newStatus,
                }),
            });
            if (!response.ok) throw new Error('Failed to update status');

            // Show success toast
            const updatedRegistrations = [...registrations];
            updatedRegistrations[regIndex] = updatedRegistration;
            setRegistrations(updatedRegistrations);
            setSelectedRegistration(updatedRegistration);
            toast.success('Status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setStatusActionLoading({ id: null, action: null });
        }
    };

    const handleViewDetails = (registration: Registration) => {
        setSelectedRegistration(registration);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (registration: Registration) => {
        setEditForm({ ...registration });
        setEditErrors({});
        setIsEditing(true);
    };

    const handleDelete = async (registration: Registration) => {
        if (!window.confirm(`Are you sure you want to mark this registration as inactive for ${registration.fullName}?`)) {
            return;
        }

        setStatusActionLoading({ id: registration.id, action: 'delete' });
        try {
            // Perform soft delete by updating status to 'INACTIVE'
            const response = await fetch(`/api/admin/registrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formType: registration.formType,
                    aadharNumber: registration.aadharNumber,
                    status: 'INACTIVE',
                }),
            });

            if (!response.ok) throw new Error('Failed to mark registration as inactive');

            // Update the registration status in the local state
            const updatedRegistrations = registrations.map(reg => 
                reg.id === registration.id ? { ...reg, status: 'INACTIVE' as const } : reg
            );
            setRegistrations(updatedRegistrations);
            
            // Update selected registration if it's the one being deleted
            if (selectedRegistration?.id === registration.id) {
                setSelectedRegistration({ ...selectedRegistration, status: 'INACTIVE' });
            }

            toast.success('Registration marked as inactive successfully');
        } catch (error) {
            console.error('Error marking registration as inactive:', error);
            toast.error('Failed to mark registration as inactive');
        } finally {
            setStatusActionLoading({ id: null, action: null });
        }
    };

    const handleUndoDelete = async (registration: Registration) => {
        if (!window.confirm(`Are you sure you want to restore this registration for ${registration.fullName}?`)) {
            return;
        }

        setStatusActionLoading({ id: registration.id, action: 'undo-delete' });
        try {
            // Restore registration by updating status back to 'PENDING'
            const response = await fetch(`/api/admin/registrations`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formType: registration.formType,
                    aadharNumber: registration.aadharNumber,
                    status: 'PENDING',
                }),
            });

            if (!response.ok) throw new Error('Failed to restore registration');

            // Update the registration status in the local state
            const updatedRegistrations = registrations.map(reg => 
                reg.id === registration.id ? { ...reg, status: 'PENDING' as const } : reg
            );
            setRegistrations(updatedRegistrations);
            
            // Update selected registration if it's the one being restored
            if (selectedRegistration?.id === registration.id) {
                setSelectedRegistration({ ...selectedRegistration, status: 'PENDING' });
            }

            toast.success('Registration restored successfully');
        } catch (error) {
            console.error('Error restoring registration:', error);
            toast.error('Failed to restore registration');
        } finally {
            setStatusActionLoading({ id: null, action: null });
        }
    };

    // Validation logic (adapted from register/page.tsx)
    function validateEditForm(form: Partial<Registration>): Record<string, string> {
        const errors: Record<string, string> = {};
        if (!form.fullName?.trim()) {
            errors.fullName = 'Full name is required';
        } else if (form.fullName.trim().length < 3) {
            errors.fullName = 'Name should be at least 3 characters';
        } else if (!/^[a-zA-Z ]+$/.test(form.fullName)) {
            errors.fullName = 'Name should contain only letters and spaces';
        }
        if (!form.age) {
            errors.age = 'Age is required';
        } else if (parseInt(form.age) < 1 || parseInt(form.age) > 120) {
            errors.age = 'Age should be between 1 and 120';
        }
        if (!form.guardianName?.trim()) {
            errors.guardianName = "Father's/Husband's name is required";
        } else if (form.guardianName.trim().length < 3) {
            errors.guardianName = 'Name should be at least 3 characters';
        } else if (!/^[a-zA-Z ]+$/.test(form.guardianName)) {
            errors.guardianName = 'Name should contain only letters and spaces';
        }
        if (!form.address?.trim()) {
            errors.address = 'Address is required';
        } else if (form.address.trim().length < 5) {
            errors.address = 'Address should be detailed';
        }
        if (!form.city?.trim()) {
            errors.city = 'City is required';
        }
        if (!form.pinCode?.trim()) {
            errors.pinCode = 'Pin code is required';
        } else if (!/^\d{6}$/.test(form.pinCode.trim())) {
            errors.pinCode = 'Pin code should be 6 digits';
        }
        if (!form.village?.trim()) {
            errors.village = 'Village is required';
        }
        if (!form.aadharNumber) {
            errors.aadharNumber = 'Aadhar number is required';
        } else if (!/^\d{12}$/.test(form.aadharNumber.toString())) {
            errors.aadharNumber = 'Aadhar number should be 12 digits';
        }
        if (!form.phoneNumber) {
            errors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(form.phoneNumber.toString())) {
            errors.phoneNumber = 'Phone number should be 10 digits';
        }
        if (!form.whatsappNumber) {
            errors.whatsappNumber = 'WhatsApp number is required';
        } else if (!/^\d{10}$/.test(form.whatsappNumber.toString())) {
            errors.whatsappNumber = 'WhatsApp number should be 10 digits';
        }
        if (!form.emergencyContact) {
            errors.emergencyContact = 'Emergency number is required';
        } else if (!/^\d{10}$/.test(form.emergencyContact.toString())) {
            errors.emergencyContact = 'Emergency number should be 10 digits';
        } else if (Number(form.emergencyContact) !== Number('9999999999') && form.emergencyContact === form.phoneNumber) {
            errors.emergencyContact = 'Emergency number should be different from mobile number';
        }
        // No validation for optional fields
        return errors;
    }

    // Edit logic
    const handleEditCancel = () => {
        setIsEditing(false);
        setEditForm(null);
        setEditErrors({});
    };
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue: string | boolean = value;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            newValue = e.target.checked;
        }
        setEditForm(f => ({
            ...f!,
            [name]: newValue,
        }));
        setEditErrors(errors => {
            const newErrors = { ...errors };
            delete newErrors[name];
            return newErrors;
        });
    };
    const handleEditSave = async () => {
        if (!editForm || !selectedRegistration) return;
        const errors = validateEditForm(editForm);
        setEditErrors(errors);
        if (Object.keys(errors).length > 0) return;
        setEditLoading(true);
        const aadharChanged = String(editForm.aadharNumber) !== String(selectedRegistration.aadharNumber);
        try {
            // Find the registration by id to get formType and aadharNumber
            const regIndex = registrations.findIndex(r => r.id === selectedRegistration.id);
            if (regIndex === -1) throw new Error('Registration not found');
            // Update the status in the local state
            const updatedRegistration = { ...registrations[regIndex], ...editForm };

            // 1. If new photo or aadhar file, upload to S3 using the same key
            if (newPhotoFile) {
                const res = await fetch('/api/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: [{
                            fileType: newPhotoFile.type,
                            uploadType: 'photo',
                            key: selectedRegistration.photoKey,
                        }],
                    }),
                });
                if (!res.ok) throw new Error('Failed to get upload URL for photo');
                const { uploadUrls } = await res.json();
                const { url } = uploadUrls[0];
                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    body: newPhotoFile,
                    headers: { 'Content-Type': newPhotoFile.type },
                });
                if (!uploadRes.ok) throw new Error('Failed to upload new photo');
            }
            if (newAadharFile) {
                const res = await fetch('/api/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: [{
                            fileType: newAadharFile.type,
                            uploadType: 'aadhar',
                            key: selectedRegistration.aadharKey,
                        }],
                    }),
                });
                if (!res.ok) throw new Error('Failed to get upload URL for aadhar');
                const { uploadUrls } = await res.json();
                const { url } = uploadUrls[0];
                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    body: newAadharFile,
                    headers: { 'Content-Type': newAadharFile.type },
                });
                if (!uploadRes.ok) throw new Error('Failed to upload new aadhar card');
            }
            // 2. Continue with PATCH/POST/DELETE as before
            if (aadharChanged) {
                // 1. Create new record with original id (preserve registration ID)
                const res = await fetch('/api/admin/registrations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...editForm,
                        id: selectedRegistration.id, // preserve original registration ID
                        aadharNumber: editForm.aadharNumber,
                        formType: editForm.formType,
                        status: selectedRegistration.status,
                        createdAt: selectedRegistration.createdAt,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to create new record');
                }
                // 2. Delete old record
                const delRes = await fetch('/api/admin/registrations', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        formType: selectedRegistration.formType,
                        aadharNumber: selectedRegistration.aadharNumber,
                    }),
                });
                if (!delRes.ok) {
                    throw new Error('Failed to delete old record');
                }

                const updatedRegistrations = [...registrations];
                updatedRegistrations[regIndex] = updatedRegistration;
                setRegistrations(updatedRegistrations);
                setSelectedRegistration(updatedRegistration);
            } else {
                // PATCH as before
                const res = await fetch(`/api/admin/registrations`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...editForm,
                        formType: editForm.formType,
                        aadharNumber: editForm.aadharNumber,
                    }),
                });
                if (!res.ok) throw new Error('Failed to update registration');

                // Update the local state
                const updatedRegistrations = [...registrations];
                updatedRegistrations[regIndex] = updatedRegistration;
                setRegistrations(updatedRegistrations);
                setSelectedRegistration(updatedRegistration);
            }

            toast.success('Registration updated successfully');
            setIsEditing(false);
            setEditForm(null);
            setEditErrors({});
        } catch (e: unknown) {
            let message = 'Failed to update registration';
            if (e instanceof Error) message = e.message;
            toast.error(message);
        } finally {
            setEditLoading(false);
        }
    };

    // Utility for image validation/compression (from register/page.tsx)
    async function processImageFile({ file, setPreview, setFile, setError, fieldName }: {
        file: File | null,
        setPreview: (url: string | null) => void,
        setFile: (file: File | null) => void,
        setError: (cb: (prev: Record<string, string | undefined>) => Record<string, string | undefined>) => void,
        fieldName: 'photo' | 'aadhar',
    }) {
        if (!file) {
            setPreview(null);
            setFile(null);
            setError(prev => ({ ...prev, [fieldName]: undefined }));
            return;
        }
        let fileType = file.type.toLowerCase();
        let workingFile = file;
        if (fileType === 'image/heic' || fileType === 'image/heif') {
            try {
                const heic2any = (await import('heic2any')).default;
                const convertedBlob = await heic2any({ blob: file, toType: 'image/webp', quality: 0.85 });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                workingFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.webp'), { type: 'image/webp' });
                fileType = 'image/webp';
            } catch {
                setError(prev => ({ ...prev, [fieldName]: 'Could not convert HEIC/HEIF image. Please use JPG, PNG, or WEBP.' }));
                setPreview(null);
                setFile(null);
                return;
            }
        }
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(fileType)) {
            setError(prev => ({ ...prev, [fieldName]: 'Please upload a valid image file (JPG, PNG, WEBP)' }));
            setPreview(null);
            setFile(null);
            return;
        }
        if (workingFile.size > 10 * 1024 * 1024) {
            setError(prev => ({ ...prev, [fieldName]: 'File size should be less than 10mb before compression' }));
            setPreview(null);
            setFile(null);
            return;
        }
        try {
            const imageCompression = (await import('browser-image-compression')).default;
            const initialQuality = workingFile.size < 2 * 1024 * 1024 ? 0.95 : 0.85;
            const options = { maxSizeMB: 4, maxWidthOrHeight: 1800, useWebWorker: true, initialQuality, fileType: 'image/webp' };
            const compressedFile = await imageCompression(workingFile, options);
            if (compressedFile.size > 6 * 1024 * 1024) {
                setError(prev => ({ ...prev, [fieldName]: `Compressed ${fieldName === 'photo' ? 'photo' : 'Aadhar card'} is still larger than 10mb.` }));
                setPreview(null);
                setFile(null);
                return;
            }
            setError(prev => ({ ...prev, [fieldName]: undefined }));
            setFile(compressedFile);
            const reader = new FileReader();
            reader.onload = () => { if (reader.result) setPreview(reader.result as string); };
            reader.onerror = () => {
                setError(prev => ({ ...prev, [fieldName]: 'Error reading the file' }));
                setPreview(null);
                setFile(null);
            };
            reader.readAsDataURL(compressedFile);
        } catch {
            setError(prev => ({ ...prev, [fieldName]: 'Error compressing the image' }));
            setPreview(null);
            setFile(null);
        }
    }

    // Handlers for file input
    const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        await processImageFile({ file, setPreview: setNewPhotoPreview, setFile: setNewPhotoFile, setError: setImageErrors, fieldName: 'photo' });
    };
    const handleAadharFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        await processImageFile({ file, setPreview: setNewAadharPreview, setFile: setNewAadharFile, setError: setImageErrors, fieldName: 'aadhar' });
    };
    const handleClearPhoto = () => { setNewPhotoFile(null); setNewPhotoPreview(null); setImageErrors(e => ({ ...e, photo: undefined })); };
    const handleClearAadhar = () => { setNewAadharFile(null); setNewAadharPreview(null); setImageErrors(e => ({ ...e, aadhar: undefined })); };

    async function handleExport(type: 'all' | 'filtered') {
        setExportLoading(true);
        setIsExportDialogOpen(false);

        // Define base columns that are always included
        const baseColumns = [
            { header: 'ID', key: 'id', width: 18 },
            { header: 'Full Name', key: 'fullName', width: 22 },
            { header: 'Age', key: 'age', width: 8 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'Guardian Name', key: 'guardianName', width: 22 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'City', key: 'city', width: 16 },
            { header: 'Pin Code', key: 'pinCode', width: 12 },
            { header: 'Village', key: 'village', width: 16 },
            { header: 'Aadhar Number', key: 'aadharNumber', width: 18 },
            { header: 'Phone Number', key: 'phoneNumber', width: 16 },
            { header: 'WhatsApp Number', key: 'whatsappNumber', width: 16 },
            { header: 'Emergency Contact', key: 'emergencyContact', width: 18 },
            { header: 'Existing Tapasya', key: 'existingTapasya', width: 18 },
            { header: 'Linked Form', key: 'linkedForm', width: 18 },
            { header: 'Previous Participation', key: 'hasParticipatedBefore', width: 16 },
            { header: 'Form Type', key: 'formType', width: 10 },
            { header: 'Created At', key: 'createdAt', width: 20 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Arrival Date', key: 'arrivalDate', width: 16 },
            { header: 'Arrival Time', key: 'arrivalTime', width: 14 },
            { header: 'Arrival Place', key: 'arrivalPlace', width: 16 },
            { header: 'Additional Notes', key: 'additionalNotes', width: 30 },
            { header: 'Travel Details Submitted', key: 'travelDetailsSubmittedAt', width: 20 },
        ];
        
        // Add image columns only if includeImages is true
        const imageColumns = includeImages ? [
            { header: 'Photo', key: 'photo', width: 20 },
            { header: 'Aadhar', key: 'aadhar', width: 20 },
        ] : [];
        
        const columns = [...baseColumns, ...imageColumns];
        const imageSize = { width: 80, height: 100 };
        const registrationsObj = { all: registrations, filtered: filteredRegistrations };
        // Store the worker instance for cancellation
        exportWorkerRef.current = runExcelExportWorker({
            registrations: registrationsObj,
            filtered: type === 'filtered',
            imageSize: imageSize,
            columns: columns,
            includeImages: includeImages,
            onProgress: () => { },
            onDone: (buf: ArrayBuffer, failedImages: string[]) => {
                setExportLoading(false);
                exportWorkerRef.current = null;
                if (failedImages && failedImages.length > 0) {
                    toast.warning(`Exported with ${failedImages.length} missing images.`, { duration: 8000 });
                }
                const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `registrations_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            onError: (err: string) => {
                setExportLoading(false);
                exportWorkerRef.current = null;
                toast.error('Failed to export Excel: ' + err);
            },
            onCancelled: () => {
                setExportLoading(false);
                exportWorkerRef.current = null;
                toast('Export cancelled.');
            },
        });
    }

    // VCF export function (contacts)
    function handleExportVcf(type: 'all' | 'filtered') {
        try {
            setIsContactExportDialogOpen(false);
            const list = type === 'filtered' ? filteredRegistrations : registrations;

            const vcfEscape = (val: string | number | undefined | null) => {
                const s = val === undefined || val === null ? '' : String(val);
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/\n|\r\n/g, "\\n")
                    .replace(/;/g, "\\;")
                    .replace(/,/g, "\\,");
            };

            const toVCard = (reg: Registration) => {
                const lines: string[] = [];
                const firstName = vcfEscape(reg.id);
                const lastName = vcfEscape(reg.fullName);
                
                lines.push('BEGIN:VCARD');
                lines.push('VERSION:3.0');
                // N format: Last;First;Middle;Prefix;Suffix
                lines.push(`N:${lastName};${firstName};;;`);
                lines.push(`FN:${firstName} ${lastName}`);

                // Only include WhatsApp number as phone
                if (reg.whatsappNumber) {
                    const whatsappNum = String(reg.whatsappNumber).trim();
                    if (whatsappNum) {
                        lines.push(`TEL;TYPE=CELL:${vcfEscape(whatsappNum)}`);
                    }
                }

                if (reg.id) lines.push(`UID:${vcfEscape(reg.id)}`);

                lines.push('END:VCARD');
                return lines.join('\r\n');
            };

            const vcf = list.map(toVCard).filter(Boolean).join('\r\n');
            const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contacts_${type}_${new Date().toISOString().slice(0, 10)}.vcf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('VCF export failed:', err);
            toast.error('Failed to export contacts (.vcf)');
        }
    }

    // --- Export Progress Modal Render ---
    // Place this near the root of your Registration component
    //
    // The modal will show during export and allow canceling.
    //
    // Lint note: All hooks and imports are now at the top, types are fixed.

    // Export button UI
    const exportButton = (
        <>
            <div className="relative inline-flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsExportDialogOpen(true)}
                    disabled={exportLoading}
                >
                    {exportLoading ? (
                        <>
                            <svg className="animate-spin w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Export Data
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsContactExportDialogOpen(true)}
                    disabled={exportLoading}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Export Contacts
                </Button>
                {exportLoading && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                            exportWorkerRef.current?.cancel();
                            setIsExportDialogOpen(false);
                        }}
                    >
                        Cancel Export
                    </Button>
                )}
            </div>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="w-[320px] max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Export Data</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                id="include-images"
                                checked={includeImages}
                                onChange={(e) => setIncludeImages(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="include-images" className="text-sm font-medium text-gray-700">
                                Include images in export
                            </label>
                        </div>
                        <Button onClick={() => handleExport('all')} disabled={exportLoading} className="w-full">Complete Data Export</Button>
                        <Button onClick={() => handleExport('filtered')} disabled={exportLoading} className="w-full">Current Filtered Data Export</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isContactExportDialogOpen} onOpenChange={setIsContactExportDialogOpen}>
                <DialogContent className="w-[320px] max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Export Contacts</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="text-sm text-gray-600 mb-2">
                            Export contacts as .vcf file (ID as first name, full name as last name, WhatsApp number only)
                        </div>
                        <Button onClick={() => handleExportVcf('all')} disabled={exportLoading} className="w-full">All Contacts (.vcf)</Button>
                        <Button onClick={() => handleExportVcf('filtered')} disabled={exportLoading} className="w-full">Filtered Contacts (.vcf)</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary/60 border-solid mb-4" />
                <span className="text-primary text-lg font-semibold">Loading...</span>
            </div>
        );
    }

    // Advanced filter popover UI (mobile friendly, with close button)
    const advancedFilterForm = (
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
    );

    const advancedFilterSection = isMobile ? (
        <>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => setIsAdvancedOpen(true)}>
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                Advanced Filters
            </Button>
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <DialogContent className="p-4 w-[340px] max-w-[100vw] rounded-md">
                    {advancedFilterForm}
                </DialogContent>
            </Dialog>
        </>
    ) : (
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-fit">
                    <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Advanced Filters
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="p-6 w-[500px] max-w-[95vw] md:w-[500px] md:max-w-[500px] rounded-md md:rounded-md left-0 right-0 md:left-auto md:right-auto z-[60]"
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

                {advancedFilterForm}
            </PopoverContent>
        </Popover>
    );

    // Filter bar with advanced filter button on the right
    const filterBar = (
        <div className="flex flex-col gap-4 mb-4 w-full">
            {/* Bulk Actions */}
            {selectedRegistrations.size > 0 && (
                <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedRegistrations.size} registration{selectedRegistrations.size !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        >
                            Clear
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-700">Change status to:</span>
                        <div className="flex items-center gap-2">
                            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as RegistrationStatus)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive (Soft Delete)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={handleBulkStatusUpdate}
                                disabled={!bulkStatus || selectedRegistrations.size === 0 || bulkActionLoading}
                            >
                                {bulkActionLoading ? 'Updating...' : 'Update Status'}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={clearSelection}
                                disabled={selectedRegistrations.size === 0}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
                {/* Go to Page input */}
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        const page = Number(gotoPageInput);
                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                            setGotoPageInput('');
                        }
                    }}
                    className="flex items-center gap-1 ml-2"
                >
                    <label htmlFor="goto-page-input" className="text-xs text-gray-700">Go to:</label>
                    <input
                        id="goto-page-input"
                        type="number"
                        min={1}
                        max={totalPages}
                        value={gotoPageInput}
                        onChange={e => setGotoPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-14 px-1 py-0.5 border rounded text-xs text-center"
                        placeholder="#"
                    />
                    <Button type="submit" size="sm" variant="outline" className="px-2 py-1 text-xs">Go</Button>
                </form>
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
        <div className="space-y-2">
            <div className="flex justify-end mb-2">{exportButton}</div>
            {filterBar}
            {filterChips}
            {/* Mobile Sorting Controls */}
            <div className="flex gap-2 items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                    className="border rounded px-2 py-1 text-sm"
                    value={sortColumn}
                    onChange={e => setSortColumn(e.target.value as typeof sortColumn)}
                >
                    <option value="createdAt">Date</option>
                    <option value="id">ID</option>
                    <option value="fullName">Name</option>
                    <option value="age">Age</option>
                    <option value="city">City</option>
                    <option value="village">Village</option>
                </select>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2"
                    title="Toggle sort order"
                >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
            </div>
            {paginatedRegistrations.map((reg: Registration) => (
                <Card
                    key={reg.id}
                    className="p-4 space-y-2 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleViewDetails(reg)}
                >
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedRegistrations.has(reg.id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    toggleRegistrationSelection(reg.id);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>ID: {reg.id}</span>
                        </div>
                        {reg.status !== 'INACTIVE' && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={e => { e.stopPropagation(); handleDelete(reg); }}
                                disabled={statusActionLoading.id === reg.id}
                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'delete' ? (
                                    <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                                        <path d="M4 12a8 8 0 018-8" strokeOpacity=".75" />
                                    </svg>
                                ) : (
                                    <Trash2 className="w-3 h-3" />
                                )}
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{reg.fullName}</h3>
                            <p className="text-sm text-gray-500">
                                <a
                                    href={`https://wa.me/${reg.whatsappNumber}`}
                                    className="text-primary underline hover:text-primary/80 transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {reg.phoneNumber}
                                </a>
                            </p>
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
                        {reg.status === 'PENDING' && (
                            <Button
                                size="sm"
                                variant="default"
                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'SHORTLISTED', 'shortlist'); }}
                                disabled={statusActionLoading.id === reg.id}
                            >
                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'shortlist' ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                        Shortlisting...
                                    </span>
                                ) : 'Shortlist'}
                            </Button>
                        )}
                        {reg.status === 'SHORTLISTED' && (
                            <Button
                                size="sm"
                                variant="default"
                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'APPROVED', 'approve'); }}
                                disabled={statusActionLoading.id === reg.id}
                            >
                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'approve' ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                        Approving...
                                    </span>
                                ) : 'Approve'}
                            </Button>
                        )}
                        {reg.status === 'SHORTLISTED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'PENDING', 'undo-shortlist'); }}
                                disabled={statusActionLoading.id === reg.id}
                            >
                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'undo-shortlist' ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                        Undoing...
                                    </span>
                                ) : 'Undo Shortlist'}
                            </Button>
                        )}
                        {reg.status === 'APPROVED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'SHORTLISTED', 'undo-approve'); }}
                                disabled={statusActionLoading.id === reg.id}
                            >
                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'undo-approve' ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                        Undoing...
                                    </span>
                                ) : 'Undo Approve'}
                            </Button>
                        )}
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
                    {exportButton}
                </div>
                {filterBar}
                {filterChips}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={isAllFilteredSelected}
                                    onChange={isAllFilteredSelected ? deselectAllFiltered : selectAllFiltered}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('id'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                ID <span className="inline-block align-middle ml-1">{sortColumn === 'id' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('fullName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Name <span className="inline-block align-middle ml-1">{sortColumn === 'fullName' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Aadhar Number</TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('city'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                City <span className="inline-block align-middle ml-1">{sortColumn === 'city' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('village'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Village <span className="inline-block align-middle ml-1">{sortColumn === 'village' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('createdAt'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Date <span className="inline-block align-middle ml-1">{sortColumn === 'createdAt' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => { setSortColumn('age'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                            >
                                Age <span className="inline-block align-middle ml-1">{sortColumn === 'age' ? (sortOrder === 'asc' ? <span className="text-primary">↑</span> : <span className="text-primary">↓</span>) : <span className="text-gray-400">↕</span>}</span>
                            </TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead className="w-16 text-center">Delete</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRegistrations.map((reg: Registration) => (
                            <TableRow key={reg.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedRegistrations.has(reg.id)}
                                        onChange={() => toggleRegistrationSelection(reg.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </TableCell>
                                <TableCell>{reg.id}</TableCell>
                                <TableCell>{reg.fullName}</TableCell>
                                <TableCell>
                                    <a
                                        href={`https://wa.me/${reg.whatsappNumber}`}
                                        className="text-primary underline hover:text-primary/80 transition-colors"
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                                        {reg.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'SHORTLISTED', 'shortlist'); }}
                                                disabled={statusActionLoading.id === reg.id}
                                            >
                                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'shortlist' ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                        Shortlisting...
                                                    </span>
                                                ) : 'Shortlist'}
                                            </Button>
                                        )}
                                        {reg.status === 'SHORTLISTED' && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'APPROVED', 'approve'); }}
                                                disabled={statusActionLoading.id === reg.id}
                                            >
                                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'approve' ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                        Approving...
                                                    </span>
                                                ) : 'Approve'}
                                            </Button>
                                        )}
                                        {reg.status === 'SHORTLISTED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'PENDING', 'undo-shortlist'); }}
                                                disabled={statusActionLoading.id === reg.id}
                                            >
                                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'undo-shortlist' ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                        Undoing...
                                                    </span>
                                                ) : 'Undo Shortlist'}
                                            </Button>
                                        )}
                                        {reg.status === 'APPROVED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={e => { e.stopPropagation(); handleStatusChange(reg.id, 'SHORTLISTED', 'undo-approve'); }}
                                                disabled={statusActionLoading.id === reg.id}
                                            >
                                                {statusActionLoading.id === reg.id && statusActionLoading.action === 'undo-approve' ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                        Undoing...
                                                    </span>
                                                ) : 'Undo Approve'}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {reg.status !== 'INACTIVE' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={e => { e.stopPropagation(); handleDelete(reg); }}
                                            disabled={statusActionLoading.id === reg.id}
                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            {statusActionLoading.id === reg.id && statusActionLoading.action === 'delete' ? (
                                                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                                                    <path d="M4 12a8 8 0 018-8" strokeOpacity=".75" />
                                                </svg>
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
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
                    <DialogHeader className="px-8 pt-5 pb-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                Registration Details
                            </DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-gray-100"
                                onClick={() => { setIsViewDialogOpen(false); setIsEditing(false); setEditForm(null); setEditErrors({}); }}
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
                            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1.8fr] gap-6 p-4">
                                {/* Left Column - Registration Details */}
                                <div className="space-y-1 max-w-2xl">
                                    {/* Top: Category and Registration ID */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b">
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
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            {/* Full Name */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                                                {isEditing ? (
                                                    <Input name="fullName" value={editForm?.fullName || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.fullName}</p>
                                                )}
                                                {editErrors.fullName && <p className="text-xs text-red-500">{editErrors.fullName}</p>}
                                            </div>
                                            {/* Guardian Name */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Guardian Name</Label>
                                                {isEditing ? (
                                                    <Input name="guardianName" value={editForm?.guardianName || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.guardianName}</p>
                                                )}
                                                {editErrors.guardianName && <p className="text-xs text-red-500">{editErrors.guardianName}</p>}
                                            </div>
                                            {/* Age & Gender */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Age & Gender</Label>
                                                {isEditing ? (
                                                    <div className="flex gap-2 items-center">
                                                        <Input name="age" type="number" value={editForm?.age || ''} onChange={handleEditChange} className="w-20" />
                                                        <select name="gender" value={editForm?.gender || 'M'} onChange={handleEditChange} className="border rounded px-2 py-1 text-sm">
                                                            <option value="M">Male</option>
                                                            <option value="F">Female</option>
                                                        </select>
                                                    </div>
                                                ) : (
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
                                                )}
                                                {editErrors.age && <p className="text-xs text-red-500">{editErrors.age}</p>}
                                            </div>
                                            {/* Aadhar Number (editable in edit) */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Aadhar Number</Label>
                                                {isEditing ? (
                                                    <Input
                                                        name="aadharNumber"
                                                        type="number"
                                                        value={editForm?.aadharNumber?.toString() || ''}
                                                        onChange={handleEditChange}
                                                        className={editErrors.aadharNumber ? 'border-red-500' : ''}
                                                    />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.aadharNumber}</p>
                                                )}
                                                {editErrors.aadharNumber && <p className="text-xs text-red-500">{editErrors.aadharNumber}</p>}
                                            </div>
                                            {/* Previous Participation */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Previous Participation</Label>
                                                {isEditing ? (
                                                    <select name="hasParticipatedBefore" value={editForm?.hasParticipatedBefore ? 'true' : 'false'} onChange={e => setEditForm(f => ({ ...f!, hasParticipatedBefore: e.target.value === 'true' }))} className="border rounded px-2 py-1 text-sm">
                                                        <option value="true">Yes</option>
                                                        <option value="false">No</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-base font-medium">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${selectedRegistration.hasParticipatedBefore ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {selectedRegistration.hasParticipatedBefore ? 'Yes' : 'No'}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                            {/* Registration Date (not editable) */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                                                <p className="text-base font-medium text-gray-900">{new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            {/* Phone Number */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                                                {isEditing ? (
                                                    <Input name="phoneNumber" value={editForm?.phoneNumber || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p>
                                                        <a
                                                            href={`https://wa.me/${selectedRegistration.whatsappNumber}`}
                                                            className="text-base font-medium text-primary underline hover:text-primary/80 transition-colors"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {selectedRegistration.phoneNumber}
                                                        </a>
                                                    </p>

                                                )}
                                                {editErrors.phoneNumber && <p className="text-xs text-red-500">{editErrors.phoneNumber}</p>}
                                            </div>
                                            {/* WhatsApp Number */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">WhatsApp Number</Label>
                                                {isEditing ? (
                                                    <Input name="whatsappNumber" value={editForm?.whatsappNumber || ''} onChange={handleEditChange} />
                                                ) : (
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
                                                )}
                                                {editErrors.whatsappNumber && <p className="text-xs text-red-500">{editErrors.whatsappNumber}</p>}
                                            </div>
                                            {/* Emergency Contact */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                                                {isEditing ? (
                                                    <Input name="emergencyContact" value={editForm?.emergencyContact || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p>
                                                        <a
                                                            href={`tel:${selectedRegistration.emergencyContact}`}
                                                            className="text-base font-medium text-primary underline hover:text-primary/80 transition-colors"
                                                        >
                                                            {selectedRegistration.emergencyContact}
                                                        </a>
                                                    </p>

                                                )}
                                                {editErrors.emergencyContact && <p className="text-xs text-red-500">{editErrors.emergencyContact}</p>}
                                            </div>
                                            {/* Pin Code */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Pin Code</Label>
                                                {isEditing ? (
                                                    <Input name="pinCode" value={editForm?.pinCode || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.pinCode}</p>
                                                )}
                                                {editErrors.pinCode && <p className="text-xs text-red-500">{editErrors.pinCode}</p>}
                                            </div>
                                            {/* City */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">City</Label>
                                                {isEditing ? (
                                                    <Input name="city" value={editForm?.city || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.city}</p>
                                                )}
                                                {editErrors.city && <p className="text-xs text-red-500">{editErrors.city}</p>}
                                            </div>
                                            {/* Village */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Village</Label>
                                                {isEditing ? (
                                                    <Input name="village" value={editForm?.village || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.village}</p>
                                                )}
                                                {editErrors.village && <p className="text-xs text-red-500">{editErrors.village}</p>}
                                            </div>
                                            {/* Full Address */}
                                            <div className="space-y-2 col-span-2">
                                                <Label className="text-sm font-medium text-gray-500">Full Address</Label>
                                                {isEditing ? (
                                                    <Textarea name="address" value={editForm?.address || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900 whitespace-pre-line">{selectedRegistration.address}</p>
                                                )}
                                                {editErrors.address && <p className="text-xs text-red-500">{editErrors.address}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            {/* Linked Form */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Linked Form</Label>
                                                {isEditing ? (
                                                    <Input name="linkedForm" value={editForm?.linkedForm || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.linkedForm || 'Not Available'}</p>
                                                )}
                                            </div>
                                            {/* Existing Tapasya */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">Existing Tapasya</Label>
                                                {isEditing ? (
                                                    <Input name="existingTapasya" value={editForm?.existingTapasya || ''} onChange={handleEditChange} />
                                                ) : (
                                                    <p className="text-base font-medium text-gray-900">{selectedRegistration.existingTapasya || 'Not Available'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Travel Details (if available) */}
                                    {(selectedRegistration.arrivalDate || selectedRegistration.arrivalPlace || selectedRegistration.idPhotoKey) && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Arrival Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                {/* Arrival Date */}
                                                {selectedRegistration.arrivalDate && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-gray-500">Arrival Date</Label>
                                                        <p className="text-base font-medium text-gray-900">
                                                            {new Date(selectedRegistration.arrivalDate).toLocaleDateString('en-GB', { 
                                                                day: '2-digit', 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {/* Arrival Time */}
                                                {selectedRegistration.arrivalTime && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-gray-500">Arrival Time</Label>
                                                        <p className="text-base font-medium text-gray-900">{selectedRegistration.arrivalTime}</p>
                                                    </div>
                                                )}
                                                {/* Arrival Place */}
                                                {selectedRegistration.arrivalPlace && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium text-gray-500">Arrival Place</Label>
                                                        <p className="text-base font-medium text-gray-900">{selectedRegistration.arrivalPlace}</p>
                                                    </div>
                                                )}
                                                {/* Additional Notes */}
                                                {selectedRegistration.additionalNotes && (
                                                    <div className="space-y-2 col-span-2">
                                                        <Label className="text-sm font-medium text-gray-500">Additional Notes</Label>
                                                        <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedRegistration.additionalNotes}</p>
                                                    </div>
                                                )}
                                                {/* Travel Details Submitted At */}
                                                {selectedRegistration.travelDetailsSubmittedAt && (
                                                    <div className="space-y-2 col-span-2">
                                                        <Label className="text-sm font-medium text-gray-500">Submitted At</Label>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(selectedRegistration.travelDetailsSubmittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Documents (view only) */}
                                <div className="space-y-4 lg:border-l lg:pl-6">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-900">Registration Documents</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            {/* Passport Photo */}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-500">Passport Photo</Label>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                                            {newPhotoPreview ? (
                                                                <img src={newPhotoPreview} alt="New Passport Photo Preview" className="object-contain w-full h-full" />
                                                            ) : (
                                                                <Image
                                                                    src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.photoKey}`}
                                                                    alt="Passport Photo"
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            )}
                                                            {newPhotoPreview && (
                                                                <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1" onClick={handleClearPhoto}>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif" onChange={handlePhotoFileChange} className="block w-full text-xs" />
                                                        {imageErrors.photo && <p className="text-xs text-red-500">{imageErrors.photo}</p>}
                                                    </div>
                                                ) : (
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
                                                )}
                                                <p className="text-xs text-center text-gray-500 mt-1">Click image to view full size</p>
                                            </div>

                                            {/* Aadhar Card */}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-500">Aadhar Card</Label>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                                            {newAadharPreview ? (
                                                                <img src={newAadharPreview} alt="New Aadhar Card Preview" className="object-contain w-full h-full" />
                                                            ) : (
                                                                <Image
                                                                    src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.aadharKey}`}
                                                                    alt="Aadhar Card"
                                                                    fill
                                                                    className="object-contain"
                                                                />
                                                            )}
                                                            {newAadharPreview && (
                                                                <button type="button" className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1" onClick={handleClearAadhar}>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif" onChange={handleAadharFileChange} className="block w-full text-xs" />
                                                        {imageErrors.aadhar && <p className="text-xs text-red-500">{imageErrors.aadhar}</p>}
                                                    </div>
                                                ) : (
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
                                                )}
                                                <p className="text-xs text-center text-gray-500 mt-1">Click image to view full size</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passport Photo from Travel Details */}
                                    {selectedRegistration.idPhotoKey && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <h3 className="text-lg font-semibold text-gray-900">Arrival Document</h3>
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-500">ID Card Photo (for Arrival)</Label>
                                                <div
                                                    className="relative aspect-[3/4] w-full max-w-[200px] border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-gray-50"
                                                    onClick={() => {
                                                        setPreviewImageUrl(`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.idPhotoKey}`);
                                                        setPreviewImageAlt('ID Card Photo - Travel Details');
                                                    }}
                                                >
                                                    <Image
                                                        src={`https://d3b13419yglo3r.cloudfront.net/${selectedRegistration.idPhotoKey}`}
                                                        alt="ID Card Photo"
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, 200px"
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
                                    )}
                                </div>
                            </div>

                            {/* Bottom Sticky Bar */}
                            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t flex flex-wrap items-center justify-between shadow-lg bg-white/95 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500 hidden sm:inline">Status:</span>
                                    <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-sm font-semibold ${selectedRegistration.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        selectedRegistration.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        selectedRegistration.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700 line-through' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {selectedRegistration.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button
                                                variant="default"
                                                onClick={handleEditSave}
                                                size="sm"
                                                className="h-9 px-2 sm:px-3"
                                            >
                                                {editLoading ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                        Saving...
                                                    </span>
                                                ) : 'Save'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleEditCancel}
                                                size="sm"
                                                className="h-9 px-2 sm:px-3"
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {selectedRegistration.status === 'PENDING' && (
                                                <Button
                                                    variant="default"
                                                    onClick={() => handleStatusChange(selectedRegistration.id, 'SHORTLISTED', 'shortlist')}
                                                    size="sm"
                                                    className="h-9 px-2 sm:px-3"
                                                    title="Shortlist"
                                                    disabled={statusActionLoading.id === selectedRegistration.id}
                                                >
                                                    {statusActionLoading.id === selectedRegistration.id && statusActionLoading.action === 'shortlist' ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                            Shortlisting...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span className="hidden sm:inline ml-2">Shortlist</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {selectedRegistration.status === 'SHORTLISTED' && (
                                                <Button
                                                    variant="default"
                                                    onClick={() => handleStatusChange(selectedRegistration.id, 'APPROVED', 'approve')}
                                                    size="sm"
                                                    className="h-9 px-2 sm:px-3"
                                                    title="Approve"
                                                    disabled={statusActionLoading.id === selectedRegistration.id}
                                                >
                                                    {statusActionLoading.id === selectedRegistration.id && statusActionLoading.action === 'approve' ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                            Approving...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="hidden sm:inline ml-2">Approve</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {selectedRegistration.status === 'SHORTLISTED' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(selectedRegistration.id, 'PENDING', 'undo-shortlist')}
                                                    size="sm"
                                                    className="h-9 px-2 sm:px-3"
                                                    title="Undo Shortlist"
                                                    disabled={statusActionLoading.id === selectedRegistration.id}
                                                >
                                                    {statusActionLoading.id === selectedRegistration.id && statusActionLoading.action === 'undo-shortlist' ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                            Undoing...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                                                            </svg>
                                                            <span className="hidden sm:inline ml-2">Undo Shortlist</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {selectedRegistration.status === 'APPROVED' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(selectedRegistration.id, 'SHORTLISTED', 'undo-approve')}
                                                    size="sm"
                                                    className="h-9 px-2 sm:px-3"
                                                    title="Undo Approve"
                                                    disabled={statusActionLoading.id === selectedRegistration.id}
                                                >
                                                    {statusActionLoading.id === selectedRegistration.id && statusActionLoading.action === 'undo-approve' ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                            Undoing...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                                                            </svg>
                                                            <span className="hidden sm:inline ml-2">Undo Approve</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {selectedRegistration.status === 'INACTIVE' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleUndoDelete(selectedRegistration)}
                                                    size="sm"
                                                    className="h-9 px-2 sm:px-3"
                                                    title="Restore Registration"
                                                    disabled={statusActionLoading.id === selectedRegistration.id}
                                                >
                                                    {statusActionLoading.id === selectedRegistration.id && statusActionLoading.action === 'undo-delete' ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 018-8" strokeOpacity=".75" /></svg>
                                                            Restoring...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            <span className="hidden sm:inline ml-2">Restore</span>
                                                        </>
                                                    )}
                                                </Button>
                                            )}
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
                                        </>
                                    )}
                                </div>
                            </div>
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
            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Bulk Status Update</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {pendingBulkAction === ('INACTIVE' as RegistrationStatus) ? (
                            <>
                                <p>You are about to mark <span className="font-bold">{selectedRegistrations.size}</span> registration(s) as <span className="font-bold">Inactive (Soft Delete)</span>.</p>
                                <p className="mt-2 text-sm text-gray-500">These registrations will be hidden from regular views but can be restored later.</p>
                            </>
                        ) : (
                            <>
                                <p>You are about to update the status of <span className="font-bold">{selectedRegistrations.size}</span> registration(s) to <span className="font-bold">{pendingBulkAction}</span>.</p>
                                <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={performBulkStatusUpdate}>
                            Confirm Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface Subscriber {
  phoneNumber: string;
  fullName: string;
  createdAt: string;
  status: string;
}

interface EditingSubscriber extends Subscriber {
  isEditing?: boolean;
  newFullName?: string;
  newStatus?: string;
}

export function NotificationsTable() {
  const [subscribers, setSubscribers] = useState<EditingSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/subscribers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscribers');
      }

      const sortedSubscribers = [...data.subscribers].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setSubscribers(sortedSubscribers);
    } catch (error) {
      toast.error('Failed to load subscribers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (phoneNumber: string) => {
    setSubscribers(prev => prev.map(sub => {
      if (sub.phoneNumber === phoneNumber) {
        return {
          ...sub,
          isEditing: true,
          newFullName: sub.fullName,
          newStatus: sub.status
        };
      }
      return sub;
    }));
  };

  const handleCancelEdit = (phoneNumber: string) => {
    setSubscribers(prev => prev.map(sub => {
      if (sub.phoneNumber === phoneNumber) {
        return {
            ...sub,
            isEditing: false,
          };
      }
      return sub;
    }));
  };

  const handleSaveEdit = async (phoneNumber: string) => {
    const subscriber = subscribers.find(s => s.phoneNumber === phoneNumber);
    if (!subscriber?.newFullName || !subscriber?.newStatus) return;

    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          fullName: subscriber.newFullName,
          status: subscriber.newStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update subscriber');

      setSubscribers(prev => prev.map(sub => {
        if (sub.phoneNumber === phoneNumber) {
          const { newFullName, newStatus, ...rest } = sub;
          return {
            ...rest,
            fullName: newFullName!,
            status: newStatus!
          };
        }
        return sub;
      }));

      toast.success('Subscriber updated successfully');
    } catch (error) {
      toast.error('Failed to update subscriber');
      console.error(error);
    }
  };

  const handleDelete = async (phoneNumber: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const response = await fetch('/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) throw new Error('Failed to delete subscriber');

      setSubscribers(prev => prev.filter(sub => sub.phoneNumber !== phoneNumber));
      toast.success('Subscriber deleted successfully');
    } catch (error) {
      toast.error('Failed to delete subscriber');
      console.error(error);
    }
  };

  const downloadCSV = () => {
    const headers = ['Sr No', 'Full Name', 'Phone Number', 'Status', 'Registration Date'];
    const csvData = subscribers.map((sub, index) => [
      index + 1,
      sub.fullName,
      sub.phoneNumber,
      sub.status,
      `"${new Date(sub.createdAt).toLocaleString()}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.phoneNumber.includes(searchTerm)
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {filteredSubscribers.map((sub, index) => (
        <Card key={sub.phoneNumber} className="p-4 relative">
          {sub.isEditing ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <Input
                    value={sub.newFullName}
                    onChange={(e) => setSubscribers(prev => prev.map(s => 
                      s.phoneNumber === sub.phoneNumber 
                        ? { ...s, newFullName: e.target.value }
                        : s
                    ))}
                    placeholder="Full Name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Input
                    value={sub.newStatus}
                    onChange={(e) => setSubscribers(prev => prev.map(s => 
                      s.phoneNumber === sub.phoneNumber 
                        ? { ...s, newStatus: e.target.value }
                        : s
                    ))}
                    placeholder="Status"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleCancelEdit(sub.phoneNumber)}
                  className="flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleSaveEdit(sub.phoneNumber)}
                  className="flex items-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold ml-2">{sub.fullName}</h3>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEdit(sub.phoneNumber)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(sub.phoneNumber)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <span className="font-medium mr-2">Phone:</span>
                  <a 
                    href={`tel:${sub.phoneNumber}`}
                    className="text-primary hover:underline"
                  >
                    {sub.phoneNumber}
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    sub.status.toLowerCase() === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <span className="font-medium mr-2">Registered:</span>
                  {new Date(sub.createdAt).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );

  const renderDesktopView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Sr No</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead className="w-[120px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSubscribers.map((sub, index) => (
            <TableRow key={sub.phoneNumber} className="group">
              <TableCell className="text-center">
                <span className="bg-primary/10 text-primary rounded-full w-7 h-7 inline-flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
              </TableCell>
              <TableCell>
                {sub.isEditing ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Full Name</label>
                    <Input
                      value={sub.newFullName}
                      onChange={(e) => setSubscribers(prev => prev.map(s => 
                        s.phoneNumber === sub.phoneNumber 
                          ? { ...s, newFullName: e.target.value }
                          : s
                      ))}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <span className="font-medium">{sub.fullName}</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                <a 
                  href={`tel:${sub.phoneNumber}`}
                  className="text-primary hover:underline"
                >
                  {sub.phoneNumber}
                </a>
              </TableCell>
              <TableCell>
                {sub.isEditing ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Input
                      value={sub.newStatus}
                      onChange={(e) => setSubscribers(prev => prev.map(s => 
                        s.phoneNumber === sub.phoneNumber 
                          ? { ...s, newStatus: e.target.value }
                          : s
                      ))}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    sub.status.toLowerCase() === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(sub.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  {sub.isEditing ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleCancelEdit(sub.phoneNumber)}
                        className="h-8 px-2 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-xs">Cancel</span>
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSaveEdit(sub.phoneNumber)}
                        className="h-8 px-2 flex items-center"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-xs">Save</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(sub.phoneNumber)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(sub.phoneNumber)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Total: {subscribers.length} subscribers
          </p>
          <Button onClick={downloadCSV} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscribers...</span>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="text-center p-8">
          No subscribers found
        </div>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}
    </div>
  );
} 
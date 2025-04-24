'use client';

import { useState } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Categories data (same as register page)
const categories = [
  {
    id: 'SAN',
    titleHindi: 'संपूर्ण संघ',
    titleEnglish: 'FULL SANGH',
    description: 'Sildar to Shatrunjay Maha Tirth',
    date: '26/11/2025 - 07/12/2025',
  },
  {
    id: 'CHA',
    titleHindi: 'छःरिपालित संघ',
    titleEnglish: 'CHARIPALITH SANGH',
    description: 'Ayodhyapuram to Shatrunjay Maha Tirth',
    date: '02/11/2025 - 07/12/2025',
  },
  {
    id: 'NAV',
    titleHindi: 'नवाणु',
    titleEnglish: 'NAVANU',
    description: 'Shatrunjay Maha Tirth',
    date: '07/11/2025 - 14/01/2026',
  }
];

export default function CheckStatusPage() {
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [registrationId, setRegistrationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    fullName: string;
    status: string;
    lastUpdated: string;
    remarks: string;
    formType: string;
  } | null>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    // Basic validation
    if (!aadharNumber || !registrationId) {
      setError('कृपया आधार नंबर और पंजीकरण आईडी दर्ज करें / Please enter Aadhar number and Registration ID');
      setLoading(false);
      return;
    }

    if (!/^\d{12}$/.test(aadharNumber)) {
      setError('आधार नंबर 12 अंकों का होना चाहिए / Aadhar number should be 12 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadharNumber,
          registrationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get category details based on form type
  const getCategoryDetails = (formType: string) => {
    return categories.find(c => c.id === formType);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <RegistrationNavigation />
      <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10 pt-20">
        <div className="container mx-auto px-4 md:px-10 py-8 md:py-12 space-y-8">
          <motion.section
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-relaxed py-2">
              पंजीकरण स्थिति जांचें / Check Registration Status
            </h1>
            <p className="text-lg text-gray-700 text-center mb-10">
              कृपया अपना आधार नंबर और पंजीकरण आईडी दर्ज करें / Please enter your Aadhar number and Registration ID
            </p>

            <Card className="w-full max-w-3xl">
              <CardHeader>
                <CardTitle className="text-center text-2xl">स्थिति जांचें / Check Status</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckStatus} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="aadharNumber" className="text-base">
                        आधार नंबर / Aadhar Number
                      </Label>
                      <Input
                        id="aadharNumber"
                        type="tel"
                        maxLength={12}
                        placeholder="आधार नंबर / Aadhar Number"
                        value={aadharNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setAadharNumber(value);
                        }}
                        required
                        className="h-12 text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registrationId" className="text-base">
                        पंजीकरण आईडी / Registration ID
                      </Label>
                      <Input
                        id="registrationId"
                        type="text"
                        placeholder="पंजीकरण आईडी / Registration ID"
                        value={registrationId}
                        onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                        required
                        className="h-12 text-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={loading}
                  >
                    {loading ? 'जांच रहा है... / Checking...' : 'स्थिति जांचें / Check Status'}
                  </Button>
                </form>

                {status && (
                  <div className="mt-12 space-y-8">
                    <div className="border-t pt-8">
                      <h3 className="text-2xl font-bold mb-8 text-primary">पंजीकरण विवरण / Registration Details</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">नाम / Name</p>
                            <p className="font-semibold text-xl">{status.fullName}</p>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">स्थिति / Status</p>
                            <p className={`font-semibold text-xl ${
                              status.status === 'Approved' ? 'text-green-600' :
                              status.status === 'Rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {status.status}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">अंतिम अपडेट / Last Updated</p>
                          <p className="font-semibold text-lg">
                            {new Date(status.lastUpdated).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {status.remarks && (
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">टिप्पणी / Remarks</p>
                            <p className="text-gray-800 text-lg">{status.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {status.formType && (
                      <div className="border-t pt-8">
                        <h3 className="text-2xl font-bold mb-8 text-primary">यात्रा विवरण / Yatra Details</h3>
                        {(() => {
                          const category = getCategoryDetails(status.formType);
                          if (!category) return null;
                          return (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-6 rounded-lg">
                                  <p className="text-sm text-gray-600 mb-2">श्रेणी / Category</p>
                                  <div>
                                    <p className="font-semibold text-xl">{category.titleHindi}</p>
                                    <p className="text-gray-600 text-lg">{category.titleEnglish}</p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                  <p className="text-sm text-gray-600 mb-2">तिथि / Date</p>
                                  <p className="font-semibold text-xl">{category.date}</p>
                                </div>
                              </div>
                              <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">विवरण / Description</p>
                                <p className="font-semibold text-lg">{category.description}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
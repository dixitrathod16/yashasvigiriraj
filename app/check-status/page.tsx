'use client';

import { useState } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
    date: '02/12/2025 - 07/12/2025',
  },
  {
    id: 'NAV',
    titleHindi: 'नवाणु',
    titleEnglish: 'NAVANU',
    description: 'Shatrunjay Maha Tirth',
    date: '07/12/2025 - 14/01/2026',
  }
];

type Registration = {
  registrationId: string;
  fullName: string;
  status: string;
  lastUpdated: string;
  formType: string;
  aadharNumber: string;
  remarks?: string;
  age: string;
  gender: 'M' | 'F';
  guardianName: string;
  address: string;
  city: string;
  pinCode: string;
  village: string;
  phoneNumber: number;
  whatsappNumber: number;
  emergencyContact: number;
  existingTapasya?: string;
  hasParticipatedBefore: boolean;
  linkedForm?: string;
  photoKey?: string;
};

export default function CheckStatusPage() {
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingPdfIds, setLoadingPdfIds] = useState<Record<string, boolean>>({});

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRegistrations([]);

    // Basic validation
    if (!aadharNumber) {
      setError('कृपया आधार नंबर दर्ज करें / Please enter Aadhar number');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      setRegistrations(data.registrations);
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

  // Function to generate and download PDF
  const handleDownloadPDF = async (registration: Registration) => {
    setLoadingPdfIds(prev => ({ ...prev, [registration.registrationId]: true }));

    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      // Build the header image file name and absolute URL
      const headerFileName = `${registration.formType === 'SAN' ? 'Full Sangh' : registration.formType === 'CHA' ? 'Charipalith Sangh' : 'Navanu'} Header.jpg`;
      const headerFileNameEncoded = encodeURIComponent(headerFileName);
      let headerImageUrl = `/${headerFileNameEncoded}`;
      if (typeof window !== 'undefined') {
        headerImageUrl = `${window.location.origin}/${headerFileNameEncoded}`;
      }

      // Use our proxy API instead of direct CloudFront URL
      let passportPhotoUrl = '';
      if (registration.photoKey) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        passportPhotoUrl = `${baseUrl}/api/proxy-image?key=${encodeURIComponent(registration.photoKey)}`;
      }
      
      // Preload the passport photo to ensure it's available for PDF generation
      const photoPromise = new Promise((resolve) => {
        if (!passportPhotoUrl) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          // Convert image to base64 data URL to avoid CORS issues in PDF
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => {
          console.error('Failed to load passport photo');
          // Resolve with a placeholder to avoid breaking the PDF generation
          resolve('');
        };
        img.src = passportPhotoUrl;
      });

      // Wait for the image to load
      const photoDataUrl = await photoPromise;

      // Create a new div to contain the form content for PDF
      const pdfContent = document.createElement('div');
      pdfContent.classList.add('pdf-container');

      // Populate the PDF content with form data and styling
      pdfContent.innerHTML = `
        <style>
          .pdf-container {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 5px;
          }
          .header {
            text-align: center;
            margin-bottom: 5px;
          }
          .header img {
            max-width: 100%;
            height: auto;
          }
          .registration-id {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 3px 0;
            padding: 15px;
            padding-top: 0px;
            border: 2px solid #4F46E5;
            background-color: #EEF2FF;
          }
          .form-group {
            margin-bottom: 2px;
          }
          .form-label {
            font-weight: bold;
            display: block;
            margin-bottom: 7px;
          }
          .form-value {
            padding: 10px;
            padding-top: 0px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f9f9f9;
          }
          .form-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1px;
            margin-bottom: 1px;
          }
          .photo-container {
            display: flex;
            margin: 5px 0;
          }
          .photo {
            width: 120px;
            height: 150px;
            border: 1px solid #ddd;
            object-fit: cover;
          }
          .form-col {
            flex: 1;
            margin-right: 5px;
            margin-left: 5px;
            min-width: 170px;
          }
          .footer {
            margin-top: 5px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
        
        <div class="header">
          <img src="${headerImageUrl}" alt="Form Header" crossorigin="anonymous">
        </div>
        
        <div class="registration-id">
          Registration ID: ${registration.registrationId}
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आराधक का पूरा नाम</div>
              <div class="form-value">${registration.fullName}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">उम्र</div>
              <div class="form-value">${registration.age} - ${registration.gender === 'M' ? 'पुरुष' : 'स्त्री'}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">पिता/पति का नाम</div>
              <div class="form-value">${registration.guardianName}</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="form-label">पता</div>
          <div class="form-value">${registration.address}</div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">शहर</div>
              <div class="form-value">${registration.city}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">पिन कोड</div>
              <div class="form-value">${registration.pinCode}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">गाँव</div>
              <div class="form-value">${registration.village}</div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आधार नंबर</div>
              <div class="form-value">${registration.aadharNumber}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">संपर्क: मो.</div>
              <div class="form-value">${registration.phoneNumber}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">व्हाट्सऐप नंबर</div>
              <div class="form-value">${registration.whatsappNumber}</div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आपातकालीन नंबर</div>
              <div class="form-value">${registration.emergencyContact}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आपने पहले भी कभी यात्रा की है</div>
              <div class="form-value">${registration.hasParticipatedBefore ? 'हाँ' : 'नहीं '}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">लिंक्ड फॉर्म</div>
              <div class="form-value">${registration.linkedForm || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="form-label">वर्तमान में चल रही विशिष्ट तपस्या का विवरण</div>
          <div class="form-value">${registration.existingTapasya || 'N/A'}</div>
        </div>

        <div class="form-row">
          <div class="form-label">पासपोर्ट फोटो</div>
        </div>
        <div class="photo-container">
          ${photoDataUrl ? `<img src="${photoDataUrl}" alt="Passport Photo" class="photo">` : '<div class="photo" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0;">Photo not available</div>'}
        </div>
        
        <div class="footer">
          <p>This document was generated on ${new Date().toLocaleString()} © ${new Date().getFullYear()} Yashashvigiriraj</p>
        </div>
      `;

      // Temporary append to DOM for html2pdf to work
      document.body.appendChild(pdfContent);

      // Generate PDF
      const options = {
        margin: 6,
        filename: `Registration_${registration.registrationId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(pdfContent).set(options).save();

      // Remove the temporary element
      document.body.removeChild(pdfContent);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoadingPdfIds(prev => ({ ...prev, [registration.registrationId]: false }));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <RegistrationNavigation />
      <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10 pt-16">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <motion.section
            className="flex flex-col items-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              पंजीकरण स्थिति जांचें / Check Registration Status
            </h1>
            <p className="text-base md:text-lg text-gray-700 text-center mb-6">
              कृपया अपना आधार नंबर दर्ज करें / Please enter your Aadhar number
            </p>

            <Card className="w-full">
              <CardContent className="pt-6">
                <form onSubmit={handleCheckStatus} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="aadharNumber" className="text-sm font-medium mb-1.5">
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
                        className="h-10"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-10 px-8"
                      disabled={loading}
                    >
                      {loading ? 'जांच रहा है... / Checking...' : 'स्थिति जांचें / Check Status'}
                    </Button>
                  </div>
                </form>

                {registrations.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-primary">
                        पंजीकरण विवरण / Registration Details
                      </h3>
                      <span className="text-sm text-gray-600">
                        {registrations.length} registration{registrations.length > 1 ? 's' : ''} found
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {registrations.map((registration) => {
                        const category = getCategoryDetails(registration.formType);
                        return (
                          <div 
                            key={registration.registrationId} 
                            className="border rounded-lg overflow-hidden bg-white/50 hover:bg-white/80 transition-colors"
                          >
                            <div className="p-4">
                              {/* Header Section */}
                              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{registration.fullName}</h4>
                                  <p className="text-sm text-gray-600">ID: {registration.registrationId}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    registration.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    registration.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {registration.status}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(registration.lastUpdated).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>

                              {/* Yatra Details */}
                              {category && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">यात्रा / Yatra</p>
                                    <p className="font-medium">{category.titleHindi}</p>
                                    <p className="text-gray-700">{category.titleEnglish}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">तिथि / Date</p>
                                    <p className="font-medium">{category.date}</p>
                                    <p className="text-gray-700">{category.description}</p>
                                  </div>
                                </div>
                              )}

                              {/* Remarks if any */}
                              {registration.remarks && (
                                <div className="mt-3 text-sm">
                                  <p className="text-gray-600">टिप्पणी / Remarks</p>
                                  <p className="text-gray-800 mt-1">{registration.remarks}</p>
                                </div>
                              )}

                              {/* Download Button */}
                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPDF(registration)}
                                  disabled={loadingPdfIds[registration.registrationId]}
                                  className="flex items-center gap-2"
                                >
                                  {loadingPdfIds[registration.registrationId] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      डाउनलोड हो रहा है...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                      </svg>
                                      फॉर्म डाउनलोड करें
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
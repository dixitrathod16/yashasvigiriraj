'use client';

import React, { useState } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Calendar, AlertCircle, CheckCircle, Hash, ArrowRight, Bus } from 'lucide-react';
import { motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Registration {
  id: string;
  fullName: string;
  formType: 'SAN' | 'CHA' | 'NAV';
  aadharNumber: number;
  status: string;
}

// Full-screen loader overlay
const FullScreenLoader = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40">
    <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-xl shadow-lg">
      <Loader2 className="animate-spin w-12 h-12 text-primary" />
      <span className="text-lg font-semibold text-primary">Processing...</span>
    </div>
  </div>
);

export default function ReturnDetailsPage() {
  const [step, setStep] = useState<'lookup' | 'form' | 'success'>('lookup');
  const [registrationId, setRegistrationId] = useState('');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [busTime, setBusTime] = useState('');
  const [formErrors, setFormErrors] = useState<{
    busTime?: string;
  }>({});

  // Handler for registration ID lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrationId: registrationId.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch registration');
      }

      // Check if registration is approved and formType is SAN or CHA
      if (data.registration.status !== 'APPROVED') {
        setError('Only approved applicants can submit return details.');
        return;
      }

      if (data.registration.formType !== 'SAN' && data.registration.formType !== 'CHA') {
        setError('Return bus service is only available for SAN and CHA type registrations.');
        return;
      }

      // Check if return details already submitted
      if (data.registration.returnDate && data.registration.busTime) {
        setError('Return details have already been submitted for this registration.');
        return;
      }

      setRegistration(data.registration);
      setStep('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { busTime?: string } = {};

    if (!busTime) {
      errors.busTime = 'Please select a bus timing option';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !registration) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit return details
      const response = await fetch('/api/update-return-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: registration.formType,
          aadharNumber: registration.aadharNumber,
          returnDate: '2025-12-07',
          busTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit return details');
      }

      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('lookup');
    setRegistrationId('');
    setRegistration(null);
    setBusTime('');
    setFormErrors({});
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-secondary/5">
      {loading && <FullScreenLoader />}
      <RegistrationNavigation />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Lookup Step */}
        {step === 'lookup' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-br from-orange-50 via-white to-green-50 border-b pb-8">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-2">
                    <Bus className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    वापसी विवरण प्रस्तुत करें
                  </CardTitle>
                  <CardTitle className="text-2xl font-semibold text-gray-700">
                    Submit Return Details
                  </CardTitle>
                  <CardDescription className="text-base mt-3 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      केवल SAN/CHA स्वीकृत आवेदकों के लिए
                    </div>
                  </CardDescription>
                  <CardDescription className="text-sm text-gray-600">
                    For Approved SAN/CHA Applicants Only
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-10">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleLookup} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="regId" className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-primary" />
                      </div>
                      पंजीकरण आईडी / Registration ID
                    </Label>
                    <div className="relative">
                      <Input
                        id="regId"
                        value={registrationId}
                        onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                        placeholder="e.g., SAN1501, CHA1601"
                        className="text-lg h-14 pl-12 pr-4 border-2 focus:border-primary transition-colors"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Hash className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 leading-relaxed">
                        कृपया अपना पंजीकरण आईडी दर्ज करें जो आपको स्वीकृति के समय प्राप्त हुआ था
                      </p>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        खोज रहे हैं / Searching...
                      </>
                    ) : (
                      <>
                        आगे बढ़ें / Proceed
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Form Step */}
        {step === 'form' && registration && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-br from-orange-50 via-white to-green-50 border-b pb-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                      वापसी विवरण
                    </CardTitle>
                    <CardTitle className="text-2xl font-semibold text-gray-700">
                      Return Details
                    </CardTitle>
                  </div>
                  
                  {/* Registration Info Cards */}
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-white border-2 border-primary/20 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Hash className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Registration ID</p>
                          <p className="text-lg font-bold text-primary">{registration.id}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border-2 border-secondary/20 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Applicant Name</p>
                          <p className="text-lg font-bold text-secondary">{registration.fullName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-10">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Return Date Info */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                          अहमदाबाद के लिए बस सेवा / Bus Service to Ahmedabad
                        </h3>
                        <p className="text-sm text-blue-800 mb-3">
                          वापसी तिथि / Return Date: <span className="font-bold">7th December 2025 (07/12/2025)</span>
                        </p>
                        <p className="text-sm text-blue-800">
                          कृपया अपना पसंदीदा समय चुनें या स्वयं व्यवस्था करें
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Please select your preferred bus timing or arrange your own transport
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bus Time Selection */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bus className="w-4 h-4 text-primary" />
                      </div>
                      बस समय चुनें / Select Bus Timing <span className="text-red-500">*</span>
                    </Label>
                    
                    <RadioGroup value={busTime} onValueChange={(value) => {
                      setBusTime(value);
                      setFormErrors({ ...formErrors, busTime: undefined });
                    }}>
                      <div className="space-y-3">
                        {/* 2PM Option */}
                        <div className="relative">
                          <RadioGroupItem 
                            value="2PM" 
                            id="2pm"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="2pm"
                            className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all min-h-[88px] ${
                              busTime === '2PM' 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                                busTime === '2PM' ? 'bg-primary text-white' : 'bg-primary/10'
                              }`}>
                                <Bus className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-base sm:text-lg">2:00 PM बस / 2:00 PM Bus</p>
                                <p className="text-xs sm:text-sm text-gray-600">Afternoon departure to Ahmedabad</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ml-2 ${
                              busTime === '2PM' ? 'border-primary bg-primary' : 'border-gray-300'
                            }`}>
                              {busTime === '2PM' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                          </Label>
                        </div>

                        {/* 6PM Option */}
                        <div className="relative">
                          <RadioGroupItem 
                            value="6PM" 
                            id="6pm"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="6pm"
                            className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all min-h-[88px] ${
                              busTime === '6PM' 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                                busTime === '6PM' ? 'bg-primary text-white' : 'bg-primary/10'
                              }`}>
                                <Bus className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-base sm:text-lg">6:00 PM बस / 6:00 PM Bus</p>
                                <p className="text-xs sm:text-sm text-gray-600">Evening departure to Ahmedabad</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ml-2 ${
                              busTime === '6PM' ? 'border-primary bg-primary' : 'border-gray-300'
                            }`}>
                              {busTime === '6PM' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                          </Label>
                        </div>

                        {/* Self Arrangement Option */}
                        <div className="relative">
                          <RadioGroupItem 
                            value="SELF" 
                            id="self"
                            className="sr-only"
                          />
                          <Label
                            htmlFor="self"
                            className={`flex items-center justify-between p-5 border-2 rounded-xl cursor-pointer transition-all min-h-[88px] ${
                              busTime === 'SELF' 
                                ? 'border-secondary bg-secondary/10 shadow-md' 
                                : 'border-gray-200 hover:border-secondary hover:bg-secondary/5'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                                busTime === 'SELF' ? 'bg-secondary text-white' : 'bg-secondary/10'
                              }`}>
                                <CheckCircle className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-base sm:text-lg">स्वयं व्यवस्था / I will arrange my own transport</p>
                                <p className="text-xs sm:text-sm text-gray-600">Not using the bus service</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ml-2 ${
                              busTime === 'SELF' ? 'border-secondary bg-secondary' : 'border-gray-300'
                            }`}>
                              {busTime === 'SELF' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {formErrors.busTime && (
                      <p className="text-sm text-red-500 mt-2">{formErrors.busTime}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1 w-full h-14 text-lg font-semibold border-2 hover:bg-gray-50"
                      disabled={loading}
                    >
                      रद्द करें / Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      disabled={loading || !busTime}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          जमा हो रहा है / Submitting...
                        </>
                      ) : (
                        <>
                          प्रस्तुत करें / Submit
                          <CheckCircle className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.section
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-xl border-0">
              <CardContent className="p-8 md:p-10">
                {/* Success Message */}
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 250 }}
                    className="flex justify-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                      सफलतापूर्वक प्रस्तुत किया गया!
                    </h2>
                    <p className="text-lg text-gray-700">
                      Successfully Submitted
                    </p>
                  </div>

                  {/* Return Details Summary */}
                  <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 rounded-xl p-6 border-2 border-primary/20 max-w-md mx-auto">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 pb-4 border-b border-gray-200">
                        <Bus className="w-6 h-6 text-primary" />
                        <p className="text-lg font-bold text-gray-900">Your Return Details</p>
                      </div>
                      
                      <div className="text-left space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Registration ID</p>
                          <p className="text-lg font-bold text-primary">{registration?.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Return Date</p>
                          <p className="font-semibold text-gray-900">7th December 2025</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bus Timing</p>
                          <p className="font-semibold text-gray-900">
                            {busTime === '2PM' && '2:00 PM Bus'}
                            {busTime === '6PM' && '6:00 PM Bus'}
                            {busTime === 'SELF' && 'Self Arrangement'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 text-left leading-relaxed">
                        कृपया इस जानकारी को सुरक्षित रखें। यात्रा के दिन बस स्टैंड पर समय से पहुंचें।
                      </p>
                    </div>
                  </div>

                  {/* Submit Another Button */}
                  <div className="pt-6">
                    <Button 
                      onClick={handleReset} 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto h-14 text-lg font-semibold border-2 hover:bg-gray-50 px-8"
                    >
                      <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
                      Submit Another
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

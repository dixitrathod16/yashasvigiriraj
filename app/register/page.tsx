'use client';

import { useState } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function RegisterPage() {
  // States for the form
  const [step, setStep] = useState<'categories' | 'form' | 'success'>('categories');
  const [formType, setFormType] = useState<'SAN' | 'CHA' | 'NAV' | null>(null);
  const [formData, setFormData] = useState<{
    fullName?: string;
    age?: string;
    gender?: 'M' | 'F';
    guardianName?: string;
    address?: string;
    city?: string;
    pinCode?: string;
    village?: string;
    aadharNumber?: number;
    phoneNumber?: number;
    whatsappNumber?: number;
    emergencyContact?: number;
    existingTapasya?: string;
    linkedForm?: string;
    hasParticipatedBefore?: boolean;
    photoPreview?: string;
  }>({
    gender: 'M' // Set default gender value
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [previousYatraMessage, setPreviousYatraMessage] = useState<string | null>(null);
  const [bottomText, setBottomText] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [savedPhotoPreview, setSavedPhotoPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    age?: string;
    guardianName?: string;
    address?: string;
    city?: string;
    pinCode?: string;
    village?: string;
    aadharNumber?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    emergencyContact?: string;
    photo?: string;
  }>({});

  // Handler for category selection
  const handleCategorySelect = (categoryId: 'SAN' | 'CHA' | 'NAV') => {
    setFormType(categoryId);
    setStep('form');
    setPreviousYatraMessage(categories.find(c => c.id === categoryId)?.previousYatraMessage || null);
    setBottomText(categories.find(c => c.id === categoryId)?.bottomText || null);
  };

  // Handler for form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // For name fields, capitalize input and filter out non-alphabetic characters
    const capitalizeFields = ['fullName', 'guardianName', 'address', 'city', 'village', 'existingTapasya', 'linkedForm'];
    if (capitalizeFields.includes(name)) {
      const capitalizedValue = value.toUpperCase();
      setFormData({ ...formData, [name]: capitalizedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field when user makes changes
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };

  // Handler to restrict input to numbers only for numeric fields
  const handleNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers and navigation keys (backspace, arrows, etc.)
    if (!/^\d$/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  // Handler to restrict input to alphabets only for name fields
  const handleNameInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only letters, spaces and navigation keys
    if (!/^[a-zA-Z ]$/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  // Handler for pasting - allow only numbers
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text');
    if (!/^\d+$/.test(pastedData)) {
      e.preventDefault();
    }
  };

  // Handler for pasting in name fields - allow only letters and spaces
  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text');
    if (!/^[a-zA-Z ]+$/.test(pastedData)) {
      e.preventDefault();
    } else {
      // Allow paste but ensure it's uppercase
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      const newValue =
        currentValue.substring(0, start) +
        pastedData.toUpperCase() +
        currentValue.substring(end);

      // Need to update in both the input field and the state
      target.value = newValue;
      setFormData({
        ...formData,
        [target.name]: newValue
      });
    }
  };

  // Handler for checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, hasParticipatedBefore: checked });
  };

  // Handler for photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to validate the form data
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate full name
    if (!formData.fullName?.trim()) {
      errors.fullName = "पूरा नाम आवश्यक है / Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "नाम कम से कम 3 अक्षर होना चाहिए / Name should be at least 3 characters";
    } else if (!/^[a-zA-Z ]+$/.test(formData.fullName)) {
      errors.fullName = "नाम में केवल अक्षर और स्पेस का उपयोग करें / Name should contain only letters and spaces";
    }

    // Validate age
    if (!formData.age) {
      errors.age = "उम्र आवश्यक है / Age is required";
    } else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      errors.age = "उम्र 1 से 120 के बीच होना चाहिए / Age should be between 1 and 120";
    }

    // Validate guardian name
    if (!formData.guardianName?.trim()) {
      errors.guardianName = "पिता/पति का नाम आवश्यक है / Father's/Husband's name is required";
    } else if (formData.guardianName.trim().length < 3) {
      errors.guardianName = "नाम कम से कम 3 अक्षर होना चाहिए / Name should be at least 3 characters";
    } else if (!/^[a-zA-Z ]+$/.test(formData.guardianName)) {
      errors.guardianName = "नाम में केवल अक्षर और स्पेस का उपयोग करें / Name should contain only letters and spaces";
    }

    // Validate address
    if (!formData.address?.trim()) {
      errors.address = "पता आवश्यक है / Address is required";
    } else if (formData.address.trim().length < 5) {
      errors.address = "पता विस्तृत होना चाहिए / Address should be detailed";
    }

    // Validate city
    if (!formData.city?.trim()) {
      errors.city = "शहर आवश्यक है / City is required";
    }

    // Validate pin code
    if (!formData.pinCode?.trim()) {
      errors.pinCode = "पिन कोड आवश्यक है / Pin code is required";
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      errors.pinCode = "पिन कोड 6 अंकों का होना चाहिए / Pin code should be 6 digits";
    }

    // Validate village
    if (!formData.village?.trim()) {
      errors.village = "गाँव आवश्यक है / Village is required";
    }

    // Validate Aadhar number
    if (!formData.aadharNumber) {
      errors.aadharNumber = "आधार नंबर आवश्यक है / Aadhar number is required";
    } else if (!/^\d{12}$/.test(formData.aadharNumber.toString())) {
      errors.aadharNumber = "आधार नंबर 12 अंकों का होना चाहिए / Aadhar number should be 12 digits";
    }

    // Validate phone number
    if (!formData.phoneNumber) {
      errors.phoneNumber = "फोन नंबर आवश्यक है / Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber.toString())) {
      errors.phoneNumber = "फोन नंबर 10 अंकों का होना चाहिए / Phone number should be 10 digits";
    }

    // Validate WhatsApp number
    if (!formData.whatsappNumber) {
      errors.whatsappNumber = "व्हाट्सऐप नंबर आवश्यक है / WhatsApp number is required";
    } else if (!/^\d{10}$/.test(formData.whatsappNumber.toString())) {
      errors.whatsappNumber = "व्हाट्सऐप नंबर 10 अंकों का होना चाहिए / WhatsApp number should be 10 digits";
    }

    // Validate emergency contact
    if (!formData.emergencyContact) {
      errors.emergencyContact = "आपातकालीन नंबर आवश्यक है / Emergency number is required";
    } else if (!/^\d{10}$/.test(formData.emergencyContact.toString())) {
      errors.emergencyContact = "आपातकालीन नंबर 10 अंकों का होना चाहिए / Emergency number should be 10 digits";
    }

    // Validate photo
    if (!photoFile) {
      errors.photo = "फोटो आवश्यक है / Photo is required";
    } else if (photoFile.size > 5 * 1024 * 1024) { // 5MB limit
      errors.photo = "फोटो 5MB से कम होना चाहिए / Photo should be less than 5MB";
    } else if (!['image/jpeg', 'image/png', 'image/jpg'].includes(photoFile.type)) {
      errors.photo = "फोटो JPG या PNG फॉर्मेट में होना चाहिए / Photo should be in JPG or PNG format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false);
      // Set a general error message
      setError("कृपया सभी आवश्यक फ़ील्ड को सही तरीके से भरें / Please fill all required fields correctly");

      // Scroll to the top of the page to show error message
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;
    }

    try {
      // Step 1: Get pre-signed URL for photo upload
      if (!photoFile) {
        throw new Error('Please upload a passport size photo');
      }

      // Save photo preview for PDF generation
      setSavedPhotoPreview(photoPreview);

      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: photoFile.type
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key } = await uploadUrlResponse.json();

      // Step 2: Upload photo to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: photoFile,
        headers: {
          'Content-Type': photoFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      // Step 3: Submit form data with image key
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          formType,
          imageKey: key,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }

      // Success - show success message
      setRegistrationId(registerData.registrationId);
      setStep('success');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      // Scroll to the top of the page to show error message
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;
    } finally {
      setLoading(false);
    }
  };

  // Handler for new registration
  const handleNewRegistration = () => {
    setStep('categories');
    setFormType(null);
    setFormData({
      gender: 'M'
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setFormErrors({});
    setRegistrationId(null);
  };

  // Function to generate and download PDF
  const handleDownloadPDF = async () => {
    setPdfLoading(true);

    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

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
          .form-col {
            flex: 1;
            margin-right: 5px;
            margin-left: 5px;
            min-width: 170px;
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
          .footer {
            margin-top: 5px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
        
        <div class="header">
          <img src="${window.location.origin}/${formType === 'SAN' ? 'Full Sangh' : formType === 'CHA' ? 'Charipalith Sangh' : 'Navanu'} Header.jpg" alt="Form Header">
        </div>
        
        <div class="registration-id">
          Registration ID: ${registrationId}
        </div>

        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आराधक का पूरा नाम</div>
              <div class="form-value">${formData.fullName || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">उम्र</div>
              <div class="form-value">${formData.age || ''} - ${formData.gender === 'M' ? 'पुरुष' : 'स्त्री'}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">पिता/पति का नाम</div>
              <div class="form-value">${formData.guardianName || ''}</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="form-label">पता</div>
          <div class="form-value">${formData.address || ''}</div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">शहर</div>
              <div class="form-value">${formData.city || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">पिन कोड</div>
              <div class="form-value">${formData.pinCode || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">गाँव</div>
              <div class="form-value">${formData.village || ''}</div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आधार नंबर</div>
              <div class="form-value">${formData.aadharNumber || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">संपर्क: मो.</div>
              <div class="form-value">${formData.phoneNumber || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">व्हाट्सऐप नंबर</div>
              <div class="form-value">${formData.whatsappNumber || ''}</div>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आपातकालीन नंबर</div>
              <div class="form-value">${formData.emergencyContact || ''}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">आपने पहले भी कभी यात्रा की है</div>
              <div class="form-value">${formData.hasParticipatedBefore ? 'हाँ' : 'नहीं '}</div>
            </div>
          </div>
          <div class="form-col">
            <div class="form-group">
              <div class="form-label">लिंक्ड फॉर्म</div>
              <div class="form-value">${formData.linkedForm || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="form-label">वर्तमान में चल रही विशिष्ट तपस्या का विवरण</div>
          <div class="form-value">${formData.existingTapasya || 'N/A'}</div>
        </div>
        
        <div class="form-row">
          <div class="form-label">पासपोर्ट फोटो</div>
        </div>
        ${savedPhotoPreview ? `
          <div class="photo-container">
            <img src="${savedPhotoPreview}" alt="Passport Photo" class="photo">
          </div>
        ` : ''}
        
        <div class="footer">
          <p>This document was generated on ${new Date().toLocaleString()} © ${new Date().getFullYear()} Yashashvigiriraj</p>
        </div>
      `;

      // Temporary append to DOM for html2pdf to work
      document.body.appendChild(pdfContent);

      // Generate PDF
      const options = {
        margin: 6,
        filename: `Registration_${registrationId}.pdf`,
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
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <RegistrationNavigation />
      <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10 pt-24">
        <div className="container mx-auto px-4 md:px-10 py-8 md:py-12 space-y-8">
          {step === 'categories' && (
            <motion.section
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-relaxed py-2">
                पंजीकरण / Registration
              </h1>
              <p className="text-lg text-gray-700 text-center mb-10">
                कृपया अपना पंजीकरण श्रेणी चुनें / Please select your registration category
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.03 }}
                    className="cursor-pointer"
                    onClick={() => handleCategorySelect(category.id as 'SAN' | 'CHA' | 'NAV')}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-center">
                          <span className="block text-xl font-bold text-primary">{category.titleHindi}</span>
                          <span className="block text-lg">{category.titleEnglish}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-center text-base">
                          <span className="block font-medium text-gray-800">{category.description}</span>
                          <span className="block mt-2 text-gray-600">{category.date}</span>
                        </CardDescription>
                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <Button>चुनें / Select</Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {step === 'form' && formType && (
            <motion.section
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <form onSubmit={handleSubmit} className="w-full max-w-5xl space-y-8 bg-white/90 p-8 rounded-lg shadow-lg">
                <div className="w-full max-w-6xl mb-4 flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNewRegistration}
                    className="flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                      <path d="m12 19-7-7 7-7" />
                      <path d="M19 12H5" />
                    </svg>
                    वापस / Back
                  </Button>
                </div>
                <div className="w-full mb-8">
                  <Image
                    src={`/${formType === 'SAN' ? 'Full Sangh' : formType === 'CHA' ? 'Charipalith Sangh' : 'Navanu'} Header.jpg`}
                    alt={`${categories.find(c => c.id === formType)?.titleHindi} Header`}
                    width={800}
                    height={200}
                    className="w-full rounded-lg object-contain"
                    priority
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-6 max-w-3xl w-full">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base font-medium">
                      आराधक का पूरा नाम / Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="पूरा नाम / Full Name"
                      required
                      onChange={handleInputChange}
                      onKeyDown={handleNameInput}
                      onPaste={handleNamePaste}
                      className={formErrors.fullName ? "border-red-500" : ""}
                      value={formData.fullName || ''}
                    />
                    {formErrors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      उम्र / Age
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="Age"
                        required
                        min="1"
                        max="120"
                        onChange={handleInputChange}
                        className={formErrors.age ? "border-red-500" : ""}
                      />
                      <RadioGroup
                        value={formData.gender}
                        className="flex space-x-4"
                        onValueChange={(value: 'M' | 'F') => {
                          setFormData({ ...formData, gender: value });
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="M" id="male" />
                          <Label htmlFor="male">M/पु</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="F" id="female" />
                          <Label htmlFor="female">F/स्त्री</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formErrors.age && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.age}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianName" className="text-base font-medium">
                    पिता या पति का नाम / Father&apos;s or Husband&apos;s Name
                  </Label>
                  <Input
                    id="guardianName"
                    name="guardianName"
                    placeholder="पिता/पति का नाम"
                    required
                    onChange={handleInputChange}
                    onKeyDown={handleNameInput}
                    onPaste={handleNamePaste}
                    className={formErrors.guardianName ? "border-red-500" : ""}
                    value={formData.guardianName || ''}
                  />
                  {formErrors.guardianName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.guardianName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base font-medium">
                    पता / Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="पूरा पता / Full Address"
                    required
                    onChange={handleInputChange}
                    className={formErrors.address ? "border-red-500" : ""}
                    value={formData.address || ''}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-medium">
                      शहर / City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="शहर / City"
                      required
                      onChange={handleInputChange}
                      className={formErrors.city ? "border-red-500" : ""}
                      value={formData.city || ''}
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pinCode" className="text-base font-medium">
                      पिन कोड / Pin Code
                    </Label>
                    <Input
                      id="pinCode"
                      name="pinCode"
                      maxLength={6}
                      onKeyDown={handleNumericInput}
                      placeholder="Pin Code"
                      required
                      onChange={handleInputChange}
                      className={formErrors.pinCode ? "border-red-500" : ""}
                    />
                    {formErrors.pinCode && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.pinCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village" className="text-base font-medium">
                      गाँव / Village
                    </Label>
                    <Input
                      id="village"
                      name="village"
                      placeholder="गाँव / Village"
                      required
                      onChange={handleInputChange}
                      className={formErrors.village ? "border-red-500" : ""}
                      value={formData.village || ''}
                    />
                    {formErrors.village && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.village}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadharNumber" className="text-base font-medium">
                      आधार नंबर / Aadhar Number
                    </Label>
                    <Input
                      id="aadharNumber"
                      name="aadharNumber"
                      type="tel"
                      placeholder="आधार नंबर / Aadhar Number"
                      required
                      maxLength={12}
                      onChange={handleInputChange}
                      onKeyDown={handleNumericInput}
                      onPaste={handlePaste}
                      className={formErrors.aadharNumber ? "border-red-500" : ""}
                    />
                    {formErrors.aadharNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.aadharNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-base font-medium">
                      संपर्क: मो. / Mobile No.
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="मोबाइल नंबर / Mobile Number"
                      required
                      maxLength={10}
                      onChange={handleInputChange}
                      onKeyDown={handleNumericInput}
                      onPaste={handlePaste}
                      className={formErrors.phoneNumber ? "border-red-500" : ""}
                    />
                    {formErrors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber" className="text-base font-medium">
                      व्हाट्सऐप नंबर / Whatsapp No.
                    </Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      placeholder="व्हाट्सऐप नंबर / Whatsapp Number"
                      required
                      maxLength={10}
                      onChange={handleInputChange}
                      onKeyDown={handleNumericInput}
                      onPaste={handlePaste}
                      className={formErrors.whatsappNumber ? "border-red-500" : ""}
                    />
                    {formErrors.whatsappNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.whatsappNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-base font-medium">
                      आपातकालीन नंबर / Emergency No.
                    </Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="tel"
                      placeholder="आपातकालीन नंबर / Emergency Number"
                      required
                      maxLength={10}
                      onChange={handleInputChange}
                      onKeyDown={handleNumericInput}
                      onPaste={handlePaste}
                      className={formErrors.emergencyContact ? "border-red-500" : ""}
                    />
                    {formErrors.emergencyContact && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.emergencyContact}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    वर्तमान में चल रही विशिष्ट तपस्या का विवरण / Details of the special tapasya being carried out at present
                  </Label>
                  <Textarea
                    id="existingTapasya"
                    name="existingTapasya"
                    placeholder="यदि कोई है / If any"
                    onChange={handleInputChange}
                    value={formData.existingTapasya || ''}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="hasParticipatedBefore"
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="hasParticipatedBefore" className="text-base">
                      {previousYatraMessage} ? YES/NO
                    </Label>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="linkedForm" className="text-base font-medium">
                    आपके परिवार से या किसी मित्र, संबधि ने फार्म भरा हो तो उनका Form No. व नाम / If any
                  </Label>
                  <Input
                    id="linkedForm"
                    name="linkedForm"
                    placeholder="Form No. व नाम"
                    onChange={handleInputChange}
                    value={formData.linkedForm || ''}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    पासपोर्ट साइज़ फोटो / Passport Size Photo
                  </Label>
                  <div className="flex flex-col md:flex-col gap-4 items-start">
                    <Input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      required
                      onChange={handlePhotoChange}
                      className={`max-w-xs ${formErrors.photo ? "border-red-500" : ""}`}
                    />
                    {formErrors.photo && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.photo}</p>
                    )}

                    {photoPreview && (
                      <div className="relative w-32 h-40 border border-gray-300">
                        <Image
                          src={photoPreview}
                          alt="Passport size photo preview"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="text-base font-medium text-gray-800 text-center">
                    {bottomText}
                  </p>
                </div>

                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('categories')}
                  >
                    वापस / Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'प्रस्तुत कर रहा है... / Submitting...' : 'प्रस्तुत करें / Submit'}
                  </Button>
                </div>
              </form>
            </motion.section>
          )}

          {step === 'success' && (
            <motion.section
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white/90 p-8 rounded-lg shadow-lg max-w-4xl w-full text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <Image
                      src="/YASHVI LOGO 1 PNG.png"
                      alt="Yashashvigiriraj Logo"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                  पंजीकरण सफल! / Registration Successful!
                </h2>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-lg font-medium">आपका पंजीकरण आईडी / Your Registration ID:</p>
                  <p className="text-2xl font-bold text-primary">{registrationId}</p>
                  <p className="text-sm text-gray-700 mt-2">
                    कृपया भविष्य के संदर्भ के लिए या फॉर्म की स्थिति जांचने के लिए इस आईडी को नोट करें।
                    <br />
                    Please note down this ID for future reference or to check the status of your form.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
                  <Button variant="outline">
                    स्थिति जांचें / Check Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? 'डाउनलोड हो रहा है... / Downloading...' : 'फॉर्म डाउनलोड करें / Download Form'}
                  </Button>
                  <Button onClick={handleNewRegistration}>
                    नया पंजीकरण / New Registration
                  </Button>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 
'use client';

import React, { useState, useCallback } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Categories data
interface Category {
  id: 'SAN' | 'CHA' | 'NAV';
  titleHindi: string;
  titleEnglish: string;
  description: string;
  date: string;
  previousYatraMessage: string;
  bottomText: string;
}

const categories: Category[] = [
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
    date: '02/12/2025 - 07/12/2025',
    previousYatraMessage: 'आपने पहले भी कभी छःरि पालित संघ यात्रा की है',
    bottomText: 'मैं निश्रा दाता पूज्य गुरुभगवंत की आज्ञा अनुसार एवं व्यवस्थापकों को सहयोग देकर छःरि पालित संघ के नियमों का पालन करूँगा / करूँगी। अतः आप मेरा प्रवेश पत्र स्वीकृत करें।',
  },
  {
    id: 'NAV',
    titleHindi: 'नवाणु',
    titleEnglish: 'NAVANU',
    description: 'Shatrunjay Maha Tirth',
    date: '07/12/2025 - 14/01/2026',
    previousYatraMessage: 'आपने पहले भी कभी नव्वाणु यात्रा की है',
    bottomText: 'मैं निश्रा दाता पूज्य गुरुभगवंत की आज्ञा अनुसार एवं व्यवस्थापकों को सहयोग देकर नवाणु के नियमों का पालन करूँगा / करूँगी। अतः आप मेरा प्रवेश पत्र स्वीकृत करें।',
  }
];

const CharipalithRules = () => {
  return (
    <>
      <h3 className="text-xl font-semibold mb-4">छ:री पालित संघ के नियम</h3>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          <span className="font-bold">पादविहारी:</span>
          <ul className="list-disc pl-5">
            <li>गुरुभगवंतों के साथ उन्हीं की तरह पैदल विहार करके यात्रा करनी होती है।</li>
            <li>बस, ट्रेन आदि साधनों से भी तीर्थों की यात्रा हो सकती है, किन्तु उसमें जयणा, कायकष्ट, अन्य जीवों के प्रति दुःख का संवेदन, जिनाज्ञा का पालन नहीं होता... लेकिन पादविहार में होता है।</li>
            <li>मौनपूर्वक साढ़े तीन हाथ प्रमाण भूमि पर नजर करके जीवदया पालन करते हुए विहार करना उसी का नाम है... पादविहार!</li>
          </ul>
        </li>
        <li>
          <span className="font-bold">भूमिसंथारी:</span>
          <ul className="list-disc pl-5">
            <li>भूमि पर संथाराशयन करना।</li>
            <li>पलंग, गादी, तकिया आदि वस्तु का त्याग करना चाहिए।</li>
          </ul>
        </li>
        <li>
          <span className="font-bold">ब्रह्मचारी:</span>
          <ul className="list-disc pl-5">
            <li>शुद्ध ब्रह्मचर्य का पालन करना चाहिए।</li>
            <li>पुरुष एवं स्त्री को साथ में नहीं रहना चाहिए।</li>
          </ul>
        </li>
        <li>
          <span className="font-bold">सचितपरिहारी:</span>
          <ul className="list-disc pl-5">
            <li>सचित (अभक्ष्य) खान-पान का त्याग करना।</li>
            <li>बिना उबाला हुआ (कच्चा) पानी का त्याग करना।</li>
          </ul>
        </li>
        <li>
          <span className="font-bold">एकाहारी:</span>
          <ul className="list-disc pl-5">
            <li>प्रतिदिन कम से कम एकासणा का पच्चक्खाण करना एवं गरम पानी उपयोग करना।</li>
            <li>रात्रि भोजन का त्याग करना।</li>
          </ul>
        </li>
        <li>
          <span className="font-bold">आवश्यककारी:</span>
          <ul className="list-disc pl-5">
            <li>वीर प्रभु की बताई गई ६ आवश्यक जैसे सुबह और शाम प्रतिक्रमण एवं अन्य धार्मिक क्रियाएँ करना अनिवार्य है।</li>
          </ul>
        </li>
      </ol>
    </>
  )
}

const NavanuRules = () => {
  return (
    <>
      <>
        <h3 className="text-xl font-semibold mb-4">नवाणु के नियम</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <span className="font-bold">सचित्त परिहारी:</span>
            <ul className="list-disc pl-5">
              <li>सभी प्रकार के निषिद्ध खाद्य पदार्थों से परहेज, जैसे कंदमूल, खमीर वाली रोटी, या डिब्बाबंद खाना।</li>
            </ul>
          </li>
          <li>
            <span className="font-bold">एकासना:</span>
            <ul className="list-disc pl-5">
              <li>दिन में केवल एक बार भोजन ग्रहण करना।</li>
            </ul>
          </li>
          <li>
            <span className="font-bold">पद चारी:</span>
            <ul className="list-disc pl-5">
              <li>नंगे पैर चलना और अपने पैरों के अलावा किसी अन्य परिवहन का उपयोग न करना।</li>
            </ul>
          </li>
          <li>
            <span className="font-bold">भूमि शयन (संथारा):</span>
            <ul className="list-disc pl-5">
              <li>जमीन पर सोना।</li>
            </ul>
          </li>
          <li>
            <span className="font-bold">ब्रह्मचर्य:</span>
            <ul className="list-disc pl-5">
              <li>कर्म और विचार दोनों में यौन संयम का पालन करना।</li>
            </ul>
          </li>
          <li>
            <span className="font-bold">प्रतिक्रमण:</span>
            <ul className="list-disc pl-5">
              <li>दिन में दो बार प्रतिक्रमण विधि का पालन करना (सुबह और शाम)।</li>
            </ul>
          </li>
        </ol>
        <h4 className="text-lg font-semibold mt-6 mb-2">दैनिक आराधना और अनुष्ठान:</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>प्रतिदिन कम से कम दो बार यात्रा करनी चाहिए (यदि संभव हो)।</li>
          <li>प्रतिदिन सुबह और शाम प्रतिक्रमण, सेवा-पूजा, प्रवचन, प्रभु भक्ति में भाग लेना अनिवार्य है।</li>
          <li>कुल मिलाकर 108 बार मुख्य मंदिर की यात्रा पूरी करनी होती है - 99 बार आदिनाथ के पूर्व यात्राओं के स्मरण में और 9 बार अपनी आत्मरक्षा के लिए।</li>
          <li>प्रत्येक यात्रा में पांच निर्धारित पवित्र स्थलों पर आवश्यक धार्मिक अनुष्ठान करने होते हैं।</li>
          <li>यात्रा विशेष मार्गों से की जाती है, जैसे घेटी पाग से शुरू होकर, जहां से भगवान आदिनाथ ने अपनी यात्रा शुरू की थी।</li>
        </ul>
        <h4 className="text-lg font-semibold mt-6 mb-2">वेशभूषा और आचरण:</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>यात्रा के दौरान वेशभूषा भारतीय संस्कृति के अनुसार होनी चाहिए। बरमूडा, जींस, लुंगी, गाउन जैसे अशालीन वस्त्र वर्जित हैं।</li>
          <li>सर्दी के मौसम में गर्म कपड़े, शाल आदि साथ रखना चाहिए।</li>
          <li>यात्रा के दौरान ब्रह्मचर्य का पालन और संथारा शयन (जमीन पर सोना) अनिवार्य है।</li>
          <li>यात्रा के अलावा बाहर घूमने या दर्शन-पूजा के लिए जाना निषिद्ध है।</li>
          <li>नवकार मंत्र का जाप करते हुए यात्रा करें। जहां भगवान की प्रतिमा या पगलिए हों, वहां &ldquo;नमो जिणाणं&rdquo; बोलें।</li>
          <li>जहां मोक्षगामी महापुरुषों के पगलिए हों, वहां &ldquo;नमो सिद्धाणं&rdquo; बोलें।</li>
          <li>जहां देवी-देवताओं की प्रतिमा हो, वहां &ldquo;प्रणाम&rdquo; करें।</li>
        </ul>
      </>
    </>
  )
}

interface UploadUrlResponse {
  url: string;
  key: string;
  uploadType: 'photo' | 'aadhar';
}

// Get registration start date from environment variable
const REGISTRATION_DATE_FALLBACK = '2025-04-30T00:00:00';
const registrationStartDate = new Date(process.env.NEXT_PUBLIC_REGISTRATION_START_DATE || REGISTRATION_DATE_FALLBACK);
const isUsingFallbackDate = !process.env.NEXT_PUBLIC_REGISTRATION_START_DATE;

// Full-screen loader overlay
const FullScreenLoader = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40">
    <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-xl shadow-lg">
      <Loader2 className="animate-spin w-12 h-12 text-primary" />
      <span className="text-lg font-semibold text-primary">Submitting...</span>
    </div>
  </div>
);

// Utility function for image validation, conversion, and compression
async function processImageFile({
  file,
  setPreview,
  setFile,
  setError,
  fieldName
}: {
  file: File | null,
  setPreview: (url: string | null) => void,
  setFile: (file: File | null) => void,
  setError: (cb: (prev: Record<string, string | undefined>) => Record<string, string | undefined>) => void,
  fieldName: 'photo' | 'aadharCard',
}) {
  if (!file) {
    setPreview(null);
    setFile(null);
    setError(prev => ({ ...prev, [fieldName]: undefined }));
    return;
  }

  let fileType = file.type.toLowerCase();
  let workingFile = file;

  // HEIC/HEIF conversion
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/webp',
        quality: 0.85,
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      workingFile = new File(
        [blob],
        file.name.replace(/\.(heic|heif)$/i, '.webp'),
        { type: 'image/webp' }
      );
      fileType = 'image/webp';
    } catch {
      setError(prev => ({
        ...prev,
        [fieldName]: 'Could not convert HEIC/HEIF image. Please convert your image to JPG, PNG, or WEBP and try again.'
      }));
      setPreview(null);
      setFile(null);
      return;
    }
  }

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(fileType)) {
    setError(prev => ({
      ...prev,
      [fieldName]: 'Please upload a valid image file (JPG, PNG, WEBP)'
    }));
    setPreview(null);
    setFile(null);
    return;
  }

  // Validate file size (limit to 10mb for initial selection, compress to webp under 10mb)
  if (workingFile.size > 10 * 1024 * 1024) {
    setError(prev => ({
      ...prev,
      [fieldName]: 'File size should be less than 10mb before compression'
    }));
    setPreview(null);
    setFile(null);
    return;
  }

  // Compress and convert the image to webp
  try {
    const imageCompression = (await import('browser-image-compression')).default;
    const initialQuality = workingFile.size < 2 * 1024 * 1024 ? 0.95 : 0.85;
    const options = {
      maxSizeMB: 4,
      maxWidthOrHeight: 1800,
      useWebWorker: true,
      initialQuality,
      fileType: 'image/webp',
    };
    const compressedFile = await imageCompression(workingFile, options);
    if (compressedFile.size > 6 * 1024 * 1024) {
      setError(prev => ({
        ...prev,
        [fieldName]: `Compressed ${fieldName === 'photo' ? 'photo' : 'Aadhar card'} is still larger than 10mb. Please choose a smaller image.`
      }));
      setPreview(null);
      setFile(null);
      return;
    }
    setError(prev => ({ ...prev, [fieldName]: undefined }));
    setFile(compressedFile);
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setPreview(reader.result as string);
      }
    };
    reader.onerror = () => {
      setError(prev => ({
        ...prev,
        [fieldName]: 'Error reading the file'
      }));
      setPreview(null);
      setFile(null);
    };
    reader.readAsDataURL(compressedFile);
  } catch {
    setError(prev => ({
      ...prev,
      [fieldName]: 'Error compressing the image'
    }));
    setPreview(null);
    setFile(null);
  }
}

const CategorySelection = React.memo(function CategorySelection({ categories, handleCategorySelect }: { categories: Category[], handleCategorySelect: (id: 'SAN' | 'CHA' | 'NAV') => void }) {
  return (
    <motion.section
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-relaxed py-2">
        पंजीकरण / Registration
      </h1>
      <p className="text-lg text-gray-700 text-center mb-10">
        कृपया अपना पंजीकरण श्रेणी चुनें / Please select your registration category
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {categories.map((category: Category) => (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.03 }}
            className="cursor-pointer"
            onClick={() => handleCategorySelect(category.id)}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-center">
                  <span className="block text-3xl font-bold text-primary mb-2">{category.titleHindi}</span>
                  <span className="block text-base">{category.titleEnglish}</span>
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
  );
});

// Rules Step
const RulesStep = React.memo(function RulesStep({ formType, bottomText, agreedToRules, setAgreedToRules, handleNewRegistration, handleProceedFromRules }: {
  formType: 'SAN' | 'CHA' | 'NAV',
  bottomText: string | null,
  agreedToRules: boolean,
  setAgreedToRules: (v: boolean) => void,
  handleNewRegistration: () => void,
  handleProceedFromRules: () => void
}) {
  return (
    <motion.section
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-5xl bg-white/90 p-8 rounded-lg shadow-lg space-y-6">
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
        <h2 className="text-2xl font-bold text-center text-primary mb-4">नियम / Rules</h2>
        <div className="prose max-w-none text-gray-800 text-lg leading-relaxed">
          {formType === 'NAV' ? <NavanuRules /> : <CharipalithRules />}
          <div className="border-t mt-2 pt-6">
            <div className="flex items-start gap-3 w-full">
              <Checkbox id="agree-rules" checked={agreedToRules} onCheckedChange={(checked) => setAgreedToRules(checked === true)} className="mt-1" />
              <Label htmlFor="agree-rules" className="text-base font-medium cursor-pointer select-none w-full">
                {bottomText}
              </Label>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full md:justify-between">
          <Button
            variant="outline"
            onClick={handleNewRegistration}
            className="w-[200px]"
          >
            वापस / Back
          </Button>
          <Button onClick={handleProceedFromRules} disabled={!agreedToRules} className="w-[200px]">
            आगे बढ़ें / Continue
          </Button>
        </div>
      </div>
    </motion.section>
  );
});

// Registration Form Step
const RegistrationForm = React.memo(function RegistrationForm(props: React.PropsWithChildren<object>) {
  // All props and handlers are passed through
  return (
    <motion.section
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* The original form JSX goes here, using props for all state/handlers */}
      {props.children}
    </motion.section>
  );
});

// Review Step
const ReviewStep = React.memo(function ReviewStep(props: React.PropsWithChildren<object>) {
  return (
    <motion.section
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {props.children}
    </motion.section>
  );
});

// Success Step
const SuccessStep = React.memo(function SuccessStep(props: React.PropsWithChildren<object>) {
  return (
    <motion.section
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {props.children}
    </motion.section>
  );
});

export default function RegisterPage() {
  // States for the form
  const [step, setStep] = useState<'categories' | 'rules' | 'form' | 'review' | 'success'>('categories');
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
    aadharPreview?: string;
  }>({
    gender: 'M',
    hasParticipatedBefore: false // Set default gender value
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
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
    aadharCard?: string;
  }>({});
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [aadharInputKey, setAadharInputKey] = useState(0);
  const [hasRegistrationEnded, setHasRegistrationEnded] = useState(new Date() >= registrationStartDate);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToReview, setAgreedToReview] = useState(false);

  const handleCountdownComplete = () => {
    setHasRegistrationEnded(true);
  };

  // Handler for category selection
  const handleCategorySelect = (categoryId: 'SAN' | 'CHA' | 'NAV') => {
    // Reset all form data
    setFormData({
      gender: 'M',
      hasParticipatedBefore: false
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadharFile(null);
    setAadharPreview(null);
    setSavedPhotoPreview(null);
    setError(null);
    setFormErrors({});
    setRegistrationId(null);

    // Set new category and step
    setFormType(categoryId);
    setStep('rules');
    setPreviousYatraMessage(categories.find(c => c.id === categoryId)?.previousYatraMessage || null);
    setBottomText(categories.find(c => c.id === categoryId)?.bottomText || null);
    setAgreedToRules(false); // Reset checkbox

    // Scroll to top of the page
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Handler for form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // For name fields, capitalize input and filter out non-alphabetic characters
    const capitalizeFields = ['fullName', 'guardianName', 'address', 'city', 'village', 'existingTapasya', 'linkedForm'];
    if (capitalizeFields.includes(name)) {
      const capitalizedValue = value.toUpperCase();
      setFormData({ ...formData, [name]: capitalizedValue });
    }
    // For numeric fields, ensure we store them as numbers
    else if (['aadharNumber', 'phoneNumber', 'whatsappNumber', 'emergencyContact', 'age', 'pinCode'].includes(name)) {
      // Only update if the value is a valid number or empty
      if (value === '' || /^\d+$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    }
    // For all other fields
    else {
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

  // Handler for photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await processImageFile({
      file,
      setPreview: setPhotoPreview,
      setFile: setPhotoFile,
      setError: setFormErrors,
      fieldName: 'photo',
    });
  };

  // Handler for Aadhar card upload
  const handleAadharChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await processImageFile({
      file,
      setPreview: setAadharPreview,
      setFile: setAadharFile,
      setError: setFormErrors,
      fieldName: 'aadharCard',
    });
  };

  // Handler for clearing photo
  const handleClearPhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoInputKey(prev => prev + 1);
  };

  // Handler for clearing Aadhar
  const handleClearAadhar = () => {
    setAadharPreview(null);
    setAadharFile(null);
    setFormData(prev => ({ ...prev, aadharCard: null }));
    setAadharInputKey(prev => prev + 1);
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
    } else if (Number(formData.emergencyContact) !== Number('9999999999') && formData.emergencyContact === formData.phoneNumber) {
      errors.emergencyContact = "आपातकालीन नंबर मोबाइल नंबर से अलग होना चाहिए / Emergency number should be different from mobile number";
    }

    // Validate photo
    if (!photoFile) {
      errors.photo = "पासपोर्ट फोटो आवश्यक है / Passport photo is required";
    } else if (photoFile.size > 10 * 1024 * 1024) { // 10mb limit
      errors.photo = "फोटो 10mb से कम होना चाहिए (WEBP) / Photo should be less than 10mb (WEBP)";
    } else if (
      photoFile.type &&
      (photoFile.type.toLowerCase() === 'image/heic' || photoFile.type.toLowerCase() === 'image/heif')
    ) {
      errors.photo = "HEIC/HEIF इमेज सपोर्टेड नहीं है। कृपया JPG, PNG या WEBP में बदलें / HEIC/HEIF images are not supported. Please convert to JPG, PNG, or WEBP.";
    } else if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(photoFile.type.toLowerCase())) {
      errors.photo = "फोटो JPG, PNG या WEBP फॉर्मेट में होना चाहिए / Photo should be in JPG, PNG, or WEBP format";
    }

    // Validate Aadhar card
    if (!aadharFile) {
      errors.aadharCard = "आधार कार्ड आवश्यक है / Aadhar card is required";
    } else if (aadharFile.size > 10 * 1024 * 1024) { // 10mb limit
      errors.aadharCard = "आधार कार्ड 10mb से कम होना चाहिए (WEBP) / Aadhar card should be less than 10mb (WEBP)";
    } else if (
      aadharFile.type &&
      (aadharFile.type.toLowerCase() === 'image/heic' || aadharFile.type.toLowerCase() === 'image/heif')
    ) {
      errors.aadharCard = "HEIC/HEIF इमेज सपोर्टेड नहीं है। कृपया JPG, PNG या WEBP में बदलें / HEIC/HEIF images are not supported. Please convert to JPG, PNG, or WEBP.";
    } else if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(aadharFile.type.toLowerCase())) {
      errors.aadharCard = "आधार कार्ड JPG, PNG या WEBP फॉर्मेट में होना चाहिए / Aadhar card should be in JPG, PNG, or WEBP format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get pre-signed URLs for both files
      if (!photoFile || !aadharFile) {
        throw new Error('Please upload both passport photo and Aadhar card');
      }

      // Save photo preview for PDF generation
      setSavedPhotoPreview(photoPreview);

      // Get pre-signed URLs for both files in a single request
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            {
              fileType: photoFile.type,
              uploadType: 'photo'
            },
            {
              fileType: aadharFile.type,
              uploadType: 'aadhar'
            }
          ]
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URLs');
      }

      const { uploadUrls } = await uploadUrlResponse.json();
      const photoUpload = uploadUrls.find((u: UploadUrlResponse) => u.uploadType === 'photo');
      const aadharUpload = uploadUrls.find((u: UploadUrlResponse) => u.uploadType === 'aadhar');

      if (!photoUpload || !aadharUpload) {
        throw new Error('Failed to get upload URLs');
      }

      // Upload both files to S3 in parallel
      await Promise.all([
        fetch(photoUpload.url, {
          method: 'PUT',
          body: photoFile,
          headers: {
            'Content-Type': photoFile.type,
          },
        }),
        fetch(aadharUpload.url, {
          method: 'PUT',
          body: aadharFile,
          headers: {
            'Content-Type': aadharFile.type,
          },
        }),
      ]);

      // Step 3: Submit form data with image keys
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          formType,
          photoKey: photoUpload.key,
          aadharKey: aadharUpload.key,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }

      // Success - show success message
      setRegistrationId(registerData.registrationId);
      setStep('success');
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setStep('form');
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for new registration
  const handleNewRegistration = (skipStepSetup: boolean = false) => {
    // Reset all form data
    setFormData({
      gender: 'M',
      hasParticipatedBefore: false
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadharFile(null);
    setAadharPreview(null);
    setSavedPhotoPreview(null);
    setError(null);
    setFormErrors({});
    setRegistrationId(null);

    // Reset category and step
    if (!skipStepSetup) {
      setStep('categories');
      setFormType(null);
      setPreviousYatraMessage(null);
      setBottomText(null);
    }
    setAgreedToRules(false); // Reset checkbox

    // Scroll to top of the page
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
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

      // Build the header image file name and absolute URL
      const headerFileName = `${formType === 'SAN' ? 'Full Sangh' : formType === 'CHA' ? 'Charipalith Sangh' : 'Navanu'} Header.jpg`;
      const headerFileNameEncoded = encodeURIComponent(headerFileName);
      let headerImageUrl = `/${headerFileNameEncoded}`;
      if (typeof window !== 'undefined') {
        headerImageUrl = `${window.location.origin}/${headerFileNameEncoded}`;
      }

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
          <img src="${headerImageUrl}" alt="Form Header" crossorigin="anonymous">
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

  // Modify the handleEdit function to preserve all form state
  const handleEdit = () => {
    // Clear any existing errors when going back to edit
    setFormErrors({});
    setError(null);

    // Preserve file previews
    if (photoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(photoFile);
    }

    if (aadharFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setAadharPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(aadharFile);
    }

    // Move to form step
    setStep('form');

    // Scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Modify the handleReview function to preserve form data
  const handleReview = () => {
    // Clear any existing errors before validation
    setFormErrors({});
    setError(null);

    // Validate form before proceeding to review
    const isValid = validateForm();
    if (!isValid) {
      // Create a more descriptive error message
      const missingFields = Object.entries(formErrors)
        .filter(([, value]) => value)
        .map(([key]) => {
          switch (key) {
            case 'photo':
              return 'पासपोर्ट फोटो / Passport Photo';
            case 'aadharCard':
              return 'आधार कार्ड / Aadhar Card';
            case 'fullName':
              return 'पूरा नाम / Full Name';
            case 'age':
              return 'उम्र / Age';
            case 'guardianName':
              return 'पिता/पति का नाम / Father\'s/Husband\'s Name';
            case 'address':
              return 'पता / Address';
            case 'city':
              return 'शहर / City';
            case 'pinCode':
              return 'पिन कोड / Pin Code';
            case 'village':
              return 'गाँव / Village';
            case 'aadharNumber':
              return 'आधार नंबर / Aadhar Number';
            case 'phoneNumber':
              return 'फोन नंबर / Phone Number';
            case 'whatsappNumber':
              return 'व्हाट्सऐप नंबर / WhatsApp Number';
            case 'emergencyContact':
              return 'आपातकालीन नंबर / Emergency Number';
            default:
              return key;
          }
        });

      // Set the error message
      setError(`कृपया निम्नलिखित फ़ील्ड भरें / Please fill the following fields: ${missingFields.join(', ')}`);

      // Scroll to the top of the form
      if (typeof window !== 'undefined') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      return;
    }

    // If validation passes, proceed to review step
    setStep('review');
    setAgreedToReview(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleProceedFromRules = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    setStep('form');
  };

  const handleBackToRules = () => {
    handleNewRegistration(true);
    setStep('rules');
    setAgreedToRules(false); // Reset checkbox
  };

  // Memoize handlers that are passed as props
  const memoizedHandleCategorySelect = useCallback(handleCategorySelect, []);
  const memoizedHandleNewRegistration = useCallback(() => handleNewRegistration(), []);
  const memoizedHandleProceedFromRules = useCallback(handleProceedFromRules, [agreedToRules]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Show warning if using fallback registration date */}
      {isUsingFallbackDate && (
        <div className="bg-yellow-200 text-yellow-900 border border-yellow-400 px-4 py-2 rounded mb-4 text-center font-semibold">
          Warning: Using fallback registration start date ({REGISTRATION_DATE_FALLBACK}). Set NEXT_PUBLIC_REGISTRATION_START_DATE in your environment for production.
        </div>
      )}
      {loading && <FullScreenLoader />}
      <RegistrationNavigation />
      <main className="flex-1 bg-gradient-to-r from-primary/10 to-secondary/10 pt-20">
        <div className="container mx-auto px-4 md:px-10 py-8 md:py-12 space-y-8">
          {!hasRegistrationEnded ? (
            <>
              <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
                <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
                  <h2 className="text-3xl font-bold text-center mb-4 text-primary decorative-border">
                    पंजीकरण
                  </h2>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <CountdownTimer
                        targetDate={registrationStartDate}
                        onCountdownComplete={handleCountdownComplete}
                        showCard={false}
                      />
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              {step === 'categories' && (
                <>
                  <CategorySelection
                    categories={categories}
                    handleCategorySelect={memoizedHandleCategorySelect}
                  />
                  <div className="flex justify-center"> {/* Flex container to center the button */}
                    <Button
                      className="mt-4" // Add margin for spacing
                      onClick={() => { if (typeof window !== 'undefined') window.open('/', '_self'); }} // Redirect to home page
                    >
                      Go Back to Home
                    </Button>
                  </div>
                </>
              )}
              {step === 'rules' && formType && (
                <RulesStep
                  formType={formType}
                  bottomText={bottomText}
                  agreedToRules={agreedToRules}
                  setAgreedToRules={setAgreedToRules}
                  handleNewRegistration={memoizedHandleNewRegistration}
                  handleProceedFromRules={memoizedHandleProceedFromRules}
                />
              )}
              {step === 'form' && formType && (
                <RegistrationForm>
                  <form onSubmit={handleSubmit} className="w-full max-w-5xl space-y-8 bg-white/90 p-8 rounded-lg shadow-lg">
                    <div className="w-full max-w-6xl mb-4 flex justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToRules}
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
                            value={formData.age?.toString() || ''}
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
                        placeholder="पिता / पति का नाम"
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
                          placeholder="पिन कोड / Pin Code"
                          required
                          onChange={handleInputChange}
                          className={formErrors.pinCode ? "border-red-500" : ""}
                          value={formData.pinCode?.toString() || ''}
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
                          placeholder="राजस्थान में गाँव / Village in Rajasthan"
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
                          value={formData.aadharNumber?.toString() || ''}
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
                          value={formData.phoneNumber?.toString() || ''}
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
                          value={formData.whatsappNumber?.toString() || ''}
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
                          value={formData.emergencyContact?.toString() || ''}
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
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Label className="text-base font-medium whitespace-nowrap">
                          {previousYatraMessage}
                        </Label>
                        <RadioGroup
                          value={formData.hasParticipatedBefore ? 'yes' : 'no'}
                          className="flex space-x-4"
                          onValueChange={(value: 'yes' | 'no') => {
                            setFormData({ ...formData, hasParticipatedBefore: value === 'yes' });
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="yes" id="yes" />
                            <Label htmlFor="yes">हाँ / Yes</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="no" id="no" />
                            <Label htmlFor="no">नहीं / No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="linkedForm" className="text-base font-medium">
                        आपके परिवार से या किसी मित्र, संबधि ने फार्म भरा हो तो उनका Form Registration No./ If any
                      </Label>
                      <Input
                        id="linkedForm"
                        name="linkedForm"
                        placeholder={`Registration ID E.g. ${formType}1234`}
                        onChange={handleInputChange}
                        value={formData.linkedForm || ''}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          पासपोर्ट साइज़ फोटो / Passport Size Photo
                        </Label>
                        <div className="flex flex-col gap-4 items-start">
                          <div className="relative">
                            <div className={`flex items-center justify-center w-[140px] h-[180px] border-2 border-dashed rounded-lg transition-colors bg-white ${formErrors.photo ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-blue-500"
                              }`}>
                              {photoPreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={photoPreview}
                                    alt="Passport size photo preview"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="rounded-lg"
                                  />
                                  <button
                                    onClick={handleClearPhoto}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="photo" className="cursor-pointer text-center p-4">
                                  <div className="flex flex-col items-center">
                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs text-gray-500">Click to upload</span>
                                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP, or iPhone images (HEIC/HEIF) (max. 10mb)</span>
                                  </div>
                                </label>
                              )}
                              <Input
                                id="photo"
                                name="photo"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif"
                                onChange={handlePhotoChange}
                                className="hidden"
                                key={`photo-${photoInputKey}`}
                              />
                            </div>
                          </div>
                          {formErrors.photo && (
                            <div className="flex items-center gap-2 text-red-500 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>{formErrors.photo}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          आधार कार्ड / Aadhar Card
                        </Label>
                        <div className="flex flex-col gap-4 items-start">
                          <div className="relative">
                            <div className={`flex items-center justify-center w-[140px] h-[180px] border-2 border-dashed rounded-lg transition-colors bg-white ${formErrors.aadharCard ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-blue-500"
                              }`}>
                              {aadharPreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={aadharPreview}
                                    alt="Aadhar card preview"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="rounded-lg"
                                  />
                                  <button
                                    onClick={handleClearAadhar}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <label htmlFor="aadharCard" className="cursor-pointer text-center p-4">
                                  <div className="flex flex-col items-center">
                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs text-gray-500">Click to upload</span>
                                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP, or iPhone images (HEIC/HEIF) (max. 10mb)</span>
                                  </div>
                                </label>
                              )}
                              <Input
                                id="aadharCard"
                                name="aadharCard"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp,image/heic,image/heif"
                                onChange={handleAadharChange}
                                className="hidden"
                                key={`aadhar-${aadharInputKey}`}
                              />
                            </div>
                          </div>
                          {formErrors.aadharCard && (
                            <div className="flex items-center gap-2 text-red-500 text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>{formErrors.aadharCard}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full md:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToRules}
                        className="w-[200px]"
                      >
                        वापस / Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReview}
                        className="w-[200px]"
                      >
                        Review and Submit
                      </Button>
                    </div>
                  </form>
                </RegistrationForm>
              )}
              {step === 'review' && (
                <ReviewStep>
                  <form className="w-full max-w-5xl space-y-8 bg-white/90 p-8 rounded-lg shadow-lg">
                    <div className="w-full max-w-6xl mb-4 flex justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEdit}
                        className="flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                          <path d="m12 19-7-7 7-7" />
                          <path d="M19 12H5" />
                        </svg>
                        संपादित करें / Edit
                      </Button>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 text-lg font-semibold shadow-sm">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                        <div className="flex flex-col">
                          <span>Review your details before submitting. Please verify all information below.</span>
                          <span className="text-base font-normal text-yellow-900 mt-1">सबमिट करने से पहले कृपया अपनी जानकारी की समीक्षा करें। नीचे दी गई सभी जानकारी की पुष्टि करें।</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-base font-medium">
                          आराधक का पूरा नाम / Full Name
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.fullName}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium">
                          उम्र / Age
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.age} - {formData.gender === 'M' ? 'पुरुष' : 'स्त्री'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianName" className="text-base font-medium">
                        पिता या पति का नाम / Father&apos;s or Husband&apos;s Name
                      </Label>
                      <div className="p-3 border rounded-md bg-gray-50">{formData.guardianName}</div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-base font-medium">
                        पता / Address
                      </Label>
                      <div className="p-3 border rounded-md bg-gray-50">{formData.address}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-base font-medium">
                          शहर / City
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.city}</div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pinCode" className="text-base font-medium">
                          पिन कोड / Pin Code
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.pinCode}</div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="village" className="text-base font-medium">
                          गाँव / Village
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.village}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="aadharNumber" className="text-base font-medium">
                          आधार नंबर / Aadhar Number
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.aadharNumber}</div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-base font-medium">
                          संपर्क: मो. / Mobile No.
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.phoneNumber}</div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber" className="text-base font-medium">
                          व्हाट्सऐप नंबर / Whatsapp No.
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.whatsappNumber}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact" className="text-base font-medium">
                        आपातकालीन नंबर / Emergency No.
                      </Label>
                      <div className="p-3 border rounded-md bg-gray-50">{formData.emergencyContact}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium">
                        वर्तमान में चल रही विशिष्ट तपस्या का विवरण / Details of the special tapasya being carried out at present
                      </Label>
                      <div className="p-3 border rounded-md bg-gray-50">{formData.existingTapasya || 'N/A'}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Label className="text-base font-medium whitespace-nowrap">
                          {previousYatraMessage}
                        </Label>
                        <div className="p-3 border rounded-md bg-gray-50">{formData.hasParticipatedBefore ? 'हाँ / Yes' : 'नहीं / No'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedForm" className="text-base font-medium">
                        आपके परिवार से या किसी मित्र, संबधि ने फार्म भरा हो तो उनका Form Registration No./ If any
                      </Label>
                      <div className="p-3 border rounded-md bg-gray-50">{formData.linkedForm || 'N/A'}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          पासपोर्ट साइज़ फोटो / Passport Size Photo
                        </Label>
                        {photoPreview && (
                          <div className="relative w-[140px] h-[180px] border rounded-lg overflow-hidden">
                            <Image
                              src={photoPreview}
                              alt="Passport size photo preview"
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          आधार कार्ड / Aadhar Card
                        </Label>
                        {aadharPreview && (
                          <div className="relative w-[140px] h-[180px] border rounded-lg overflow-hidden">
                            <Image
                              src={aadharPreview}
                              alt="Aadhar card preview"
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t mt-2 pt-6">
                      <div className="flex items-start gap-3 w-full mb-4">
                        <Checkbox
                          id="agree-review"
                          checked={agreedToReview}
                          onCheckedChange={(checked) => setAgreedToReview(checked === true)}
                          className="mt-1"
                        />
                        <Label htmlFor="agree-review" className="text-base font-medium cursor-pointer select-none w-full">
                          I confirm that I have carefully reviewed all the details above / मैंने ऊपर दी गई सभी जानकारी को ध्यानपूर्वक जांच लिया है।
                        </Label>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full md:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleEdit}
                          className="w-[200px]"
                        >
                          संपादित करें / Edit
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading || !agreedToReview}
                          className="w-[200px]"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="animate-spin w-5 h-5" />
                              Submitting...
                            </span>
                          ) : 'प्रस्तुत करें / Submit'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </ReviewStep>
              )}
              {step === 'success' && (
                <SuccessStep>
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
                      <Button
                        variant="outline"
                        onClick={() => { if (typeof window !== 'undefined') window.open('/check-status', '_blank'); }}
                      >
                        स्थिति जांचें / Check Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadPDF}
                        disabled={pdfLoading}
                      >
                        {pdfLoading ? 'डाउनलोड हो रहा है... / Downloading...' : 'फॉर्म डाउनलोड करें / Download Form'}
                      </Button>
                      <Button onClick={() => handleNewRegistration()}>
                        नया पंजीकरण / New Registration
                      </Button>
                    </div>
                  </div>
                </SuccessStep>
              )}
            </>
          ) : (
            <motion.div
              key="registration-closed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mx-auto text-center space-y-6 py-8"
            >
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-400 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-orange-500 dark:text-orange-400 mb-3">
                  Registration is now closed
                </h3>
                <p className="text-orange-500 dark:text-orange-400">
                  Thank you for showing interest. We will get back to you soon with more details.
                </p>
              </div>
              <div className="flex justify-center"> {/* Flex container to center the button */}
                <Button
                  className="mt-4" // Add margin for spacing
                  onClick={() => { if (typeof window !== 'undefined') window.open('/', '_self'); }} // Redirect to home page
                >
                  Go Back to Home
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 
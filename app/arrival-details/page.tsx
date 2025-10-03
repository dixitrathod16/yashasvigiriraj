'use client';

import React, { useState, useEffect } from 'react';
import { RegistrationNavigation } from '@/components/RegistrationNavigation';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, CheckCircle2, Calendar, MapPin, AlertCircle, CheckCircle, Download, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Registration {
  id: string;
  fullName: string;
  formType: 'SAN' | 'CHA' | 'NAV';
  aadharNumber: number;
  status: string;
  arrivalDate?: string;
  arrivalPlace?: string;
  idPhotoKey?: string;
}

interface UploadUrlResponse {
  url: string;
  key: string;
  uploadType: 'idPhoto';
}

// Date configurations based on formType
const DATE_CONFIGS = {
  SAN: {
    minDate: '2025-11-23',
    maxDate: '2025-11-26',
    places: ['Sildar', 'Jirawala']
  },
  CHA: {
    minDate: '2025-11-30',
    maxDate: '2025-12-01',
    places: ['Ayodhyapuram Tirth']
  },
  NAV: {
    minDate: '2025-12-05',
    maxDate: '2025-12-08',
    places: ['Palitana (Jalori Bhavan)']
  }
};

// Full-screen loader overlay
const FullScreenLoader = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40">
    <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-xl shadow-lg">
      <Loader2 className="animate-spin w-12 h-12 text-primary" />
      <span className="text-lg font-semibold text-primary">Processing...</span>
    </div>
  </div>
);

// Image quality validation results
interface ImageQuality {
  isBlurry: boolean;
  hasFace: boolean;
  isFrontFacing: boolean;
  hasMultipleFaces: boolean;
  brightness: 'good' | 'too_dark' | 'too_bright';
  resolution: 'good' | 'low';
  score: number;
}

// Load face-api.js models (lazy loading)
let modelsLoaded = false;
async function loadFaceApiModels() {
  if (modelsLoaded) return;
  
  try {
    const faceapi = await import('face-api.js');
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face detection models loaded');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}

// Analyze image quality using face-api.js
async function analyzeImageQuality(file: File): Promise<ImageQuality> {
  return new Promise(async (resolve, reject) => {
    const img = document.createElement('img');
    
    img.onload = async () => {
      try {
        // 1. Check resolution
        const resolution = (img.width >= 600 && img.height >= 800) ? 'good' : 'low';
        
        // 2. Check brightness
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let totalBrightness = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          totalBrightness += (r + g + b) / 3;
        }
        const avgBrightness = totalBrightness / (pixels.length / 4);
        let brightness: 'good' | 'too_dark' | 'too_bright' = 'good';
        if (avgBrightness < 50) brightness = 'too_dark';
        else if (avgBrightness > 210) brightness = 'too_bright';
        
        // 3. Simple blur detection using edge detection
        const isBlurry = checkImageSharpness(ctx, canvas.width, canvas.height);
        
        // 4. Face detection and pose estimation using face-api.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let detections: any[] = [];
        try {
          await loadFaceApiModels();
          const faceapi = await import('face-api.js');
          
          // Try with lower threshold first
          detections = await faceapi
            .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.3 // Lowered from 0.5 to detect more faces
            }))
            .withFaceLandmarks();
          
          console.log(`✅ Detected ${detections.length} face(s)`);
        } catch (error) {
          console.error('Face detection failed:', error);
          // Don't reject, just continue with no face detected
        }
        
        let hasFace = false;
        let isFrontFacing = false;
        let hasMultipleFaces = false;
        
        if (detections.length > 1) {
          hasMultipleFaces = true;
          console.log(`⚠️ Multiple faces detected: ${detections.length}`);
        }
        
        if (detections.length > 0) {
          hasFace = true;
          const detection = detections[0];
          const landmarks = detection.landmarks;
          
          // Get key facial points
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const nose = landmarks.getNose();
          const jawline = landmarks.getJawOutline();
          
          // Calculate center points
          const leftEyeCenter = getCenter(leftEye);
          const rightEyeCenter = getCenter(rightEye);
          const noseCenter = getCenter(nose);
          
          // Calculate eye distance
          const eyeDistance = Math.sqrt(
            Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) +
            Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
          );
          
          // Check face symmetry (nose should be centered between eyes)
          const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
          const noseOffset = Math.abs(noseCenter.x - eyeCenterX);
          const symmetryScore = 1 - (noseOffset / (eyeDistance / 2));
          
          // Check face width vs height ratio (frontal faces are more symmetric)
          const faceBox = detection.detection.box;
          const aspectRatio = faceBox.width / faceBox.height;
          
          // Check jawline symmetry
          const leftJaw = jawline[2]; // Left side of jaw
          const rightJaw = jawline[14]; // Right side of jaw
          const jawCenterX = (leftJaw.x + rightJaw.x) / 2;
          const jawOffset = Math.abs(noseCenter.x - jawCenterX);
          const jawSymmetry = 1 - (jawOffset / (eyeDistance / 2));
          
          console.log('🔍 Face Analysis:', {
            eyeDistance: eyeDistance.toFixed(2),
            symmetryScore: symmetryScore.toFixed(2),
            aspectRatio: aspectRatio.toFixed(2),
            jawSymmetry: jawSymmetry.toFixed(2),
            noseOffset: noseOffset.toFixed(2)
          });
          
          // Front-facing criteria (balanced):
          // 1. Symmetry score > 0.55 (nose reasonably centered)
          // 2. Aspect ratio between 0.55 and 1.3 (not too narrow/wide)
          // 3. Jaw symmetry > 0.50
          const isSymmetric = symmetryScore > 0.55;
          const hasGoodAspectRatio = aspectRatio > 0.55 && aspectRatio < 1.3;
          const hasSymmetricJaw = jawSymmetry > 0.50;
          
          // Pass if at least 2 out of 3 checks pass
          const passedChecks = [isSymmetric, hasGoodAspectRatio, hasSymmetricJaw].filter(Boolean).length;
          isFrontFacing = passedChecks >= 2;
          
          console.log('✅ Front-facing checks:', {
            isSymmetric: `${isSymmetric} (${(symmetryScore * 100).toFixed(1)}%)`,
            hasGoodAspectRatio: `${hasGoodAspectRatio} (${aspectRatio.toFixed(2)})`,
            hasSymmetricJaw: `${hasSymmetricJaw} (${(jawSymmetry * 100).toFixed(1)}%)`,
            passedChecks: `${passedChecks}/3`,
            result: isFrontFacing ? '✅ PASS' : '❌ FAIL'
          });
        }
        
        // Calculate overall score
        let score = 100;
        if (isBlurry) score -= 20;
        if (!hasFace) score -= 50;
        if (hasMultipleFaces) score -= 50;
        if (hasFace && !isFrontFacing) score -= 45;
        if (brightness !== 'good') score -= 10;
        if (resolution === 'low') score -= 5;
        
        console.log('📊 Final Score:', score, {
          isBlurry,
          hasFace,
          hasMultipleFaces,
          isFrontFacing,
          brightness,
          resolution
        });
        
        resolve({
          isBlurry,
          hasFace,
          isFrontFacing,
          hasMultipleFaces,
          brightness,
          resolution,
          score
        });
      } catch (error) {
        console.error('Analysis error:', error);
        // On error, return permissive results
        resolve({
          isBlurry: false,
          hasFace: true,
          isFrontFacing: true,
          hasMultipleFaces: false,
          brightness: 'good',
          resolution: 'good',
          score: 100
        });
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Helper to get center point of facial feature
function getCenter(points: { x: number; y: number }[]): { x: number; y: number } {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

// Simple sharpness check using high-frequency content
function checkImageSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  // Sample center region for speed
  const sampleWidth = Math.min(width, 400);
  const sampleHeight = Math.min(height, 400);
  const startX = (width - sampleWidth) / 2;
  const startY = (height - sampleHeight) / 2;
  
  const imageData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);
  const pixels = imageData.data;
  
  // Calculate variance of grayscale values (high variance = sharp)
  let sum = 0;
  let sumSquares = 0;
  const totalPixels = sampleWidth * sampleHeight;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    sum += gray;
    sumSquares += gray * gray;
  }
  
  const mean = sum / totalPixels;
  const variance = (sumSquares / totalPixels) - (mean * mean);
  
  console.log('📸 Sharpness variance:', variance.toFixed(2));
  
  // Lower variance = less sharp/more blurry
  return variance < 800; // Very lenient threshold
}

// Create social media share image by merging user photo with template
async function createSocialShareImage(userPhotoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const templateImg = new window.Image();
    const userImg = new window.Image();
    
    templateImg.crossOrigin = 'anonymous';
    userImg.crossOrigin = 'anonymous';

    // Load template image
    templateImg.onload = () => {
      canvas.width = templateImg.width;
      canvas.height = templateImg.height;
      
      // Draw template background
      ctx.drawImage(templateImg, 0, 0);
      
      // Load user photo
      userImg.onload = () => {
        // Save context state
        ctx.save();
        
        // Define circular mask position and size (adjust these coordinates based on your template)
        const centerX = canvas.width / 2;
        const centerY = 480; // Adjust based on where the circle is in your template
        const radius = 200; // Adjust based on circle size
        
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Calculate dimensions to fill the circle while maintaining aspect ratio
        const scale = Math.max(
          (radius * 2) / userImg.width,
          (radius * 2) / userImg.height
        );
        
        const scaledWidth = userImg.width * scale;
        const scaledHeight = userImg.height * scale;
        const offsetX = centerX - scaledWidth / 2;
        const offsetY = centerY - scaledHeight / 2;
        
        // Draw user image in circular area
        ctx.drawImage(userImg, offsetX, offsetY, scaledWidth, scaledHeight);
        
        // Restore context
        ctx.restore();
        
        // Convert canvas to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      
      userImg.onerror = () => reject(new Error('Failed to load user image'));
      userImg.src = userPhotoUrl;
    };
    
    templateImg.onerror = () => reject(new Error('Failed to load template image'));
    templateImg.src = '/share-template.jpg';
  });
}

// Utility function for image validation, conversion, and compression
async function processImageFile({
  file,
  setPreview,
  setFile,
  setError,
  setValidating,
  setQualityResult,
}: {
  file: File | null,
  setPreview: (url: string | null) => void,
  setFile: (file: File | null) => void,
  setError: (msg: string | null) => void,
  setValidating: (val: boolean) => void,
  setQualityResult: (result: ImageQuality | null) => void,
}) {
  if (!file) {
    setPreview(null);
    setFile(null);
    setError(null);
    setQualityResult(null);
    return;
  }
  
  setValidating(true);
  setQualityResult(null);

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
      setError('Could not convert HEIC/HEIF image. Please convert your image to JPG, PNG, or WEBP and try again.');
      setPreview(null);
      setFile(null);
      return;
    }
  }

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(fileType)) {
    setError('Please upload a valid image file (JPG, PNG, WEBP)');
    setPreview(null);
    setFile(null);
    return;
  }

  // Validate file size (limit to 10mb for initial selection, compress to webp under 10mb)
  if (workingFile.size > 10 * 1024 * 1024) {
    setError('File size should be less than 10mb before compression');
    setPreview(null);
    setFile(null);
    return;
  }

  // Compress and convert the image to webp
  let compressedFile = workingFile;
  try {
    const imageCompression = (await import('browser-image-compression')).default;
    const initialQuality = workingFile.size < 2 * 1024 * 1024 ? 0.96 : 0.85;
    
    // Try with WebWorker first, fallback to main thread if it fails
    const baseOptions = {
      maxSizeMB: 4,
      maxWidthOrHeight: 1800,
      initialQuality,
      fileType: 'image/webp',
    };
    
    try {
      compressedFile = await imageCompression(workingFile, { ...baseOptions, useWebWorker: true });
      console.log('✅ Image compressed with WebWorker');
    } catch (workerError) {
      console.warn('⚠️ WebWorker compression failed, trying without WebWorker:', workerError);
      // Retry without WebWorker
      compressedFile = await imageCompression(workingFile, { ...baseOptions, useWebWorker: false });
      console.log('✅ Image compressed without WebWorker');
    }
    
    if (compressedFile.size > 6 * 1024 * 1024) {
      setError('Compressed photo is still larger than 6mb. Please choose a smaller image.');
      setPreview(null);
      setFile(null);
      setValidating(false);
      return;
    }
    setError(null);
    setFile(compressedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        setPreview(reader.result as string);
        
        // Run image quality analysis
        try {
          const quality = await analyzeImageQuality(compressedFile);
          setQualityResult(quality);
          
          // Show warnings for quality issues
          if (quality.score < 60) {
            const issues = [];
            if (quality.isBlurry) issues.push('image is blurry');
            if (!quality.hasFace) issues.push('no face detected');
            if (quality.hasMultipleFaces) issues.push('multiple faces detected - only one person allowed');
            if (quality.hasFace && !quality.isFrontFacing) issues.push('face should be front-facing (not side view)');
            if (quality.brightness !== 'good') issues.push(`image is ${quality.brightness.replace('_', ' ')}`);
            if (quality.resolution === 'low') issues.push('resolution is too low');
            
            setError(`⚠️ Image quality issues detected: ${issues.join(', ')}. Please upload a clearer photo for better ID card quality.`);
          }
        } catch (err) {
          console.error('Quality check error:', err);
          // Don't block upload if quality check fails
        } finally {
          setValidating(false);
        }
      }
    };
    reader.onerror = () => {
      setError('Error reading the file');
      setPreview(null);
      setFile(null);
      setValidating(false);
    };
    reader.readAsDataURL(compressedFile);
  } catch (err) {
    console.error('Image compression error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(`Error compressing the image: ${errorMessage}. Please try a different image or refresh the page.`);
    setPreview(null);
    setFile(null);
    setValidating(false);
  }
}

export default function ArrivalDetailsPage() {
  const [step, setStep] = useState<'lookup' | 'form' | 'success'>('lookup');
  const [registrationId, setRegistrationId] = useState('');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalPlace, setArrivalPlace] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [validatingImage, setValidatingImage] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [formErrors, setFormErrors] = useState<{
    arrivalDate?: string;
    arrivalPlace?: string;
    photo?: string;
  }>({});
  
  // Social share image state
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [generatingShareImage, setGeneratingShareImage] = useState(false);

  // Preload face detection models when form step is reached
  useEffect(() => {
    if (step === 'form') {
      // Start loading models in background
      loadFaceApiModels().catch((err) => {
        console.warn('Failed to preload face detection models:', err);
      });
    }
  }, [step]);

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

      setRegistration(data.registration);
      
      // Check if travel details already submitted
      // if (data.registration.arrivalDate && data.registration.arrivalPlace && data.registration.idPhotoKey) {
      //   setError('Arrival details have already been submitted for this registration.');
      //   return;
      // }
      
      setStep('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handler for photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await processImageFile({
      file,
      setPreview: setPhotoPreview,
      setFile: setPhotoFile,
      setError: setPhotoError,
      setValidating: setValidatingImage,
      setQualityResult: setImageQuality,
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { arrivalDate?: string; arrivalPlace?: string; photo?: string } = {};

    if (!arrivalDate) {
      errors.arrivalDate = 'Arrival date is required';
    }

    if (!arrivalPlace) {
      errors.arrivalPlace = 'Arrival place is required';
    }

    if (!photoFile) {
      errors.photo = 'Passport photo is required';
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

    // Check image quality score
    if (photoFile && imageQuality && imageQuality.score < 96) {
      setError('Image quality does not meet requirements. Please upload a better quality photo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!photoFile) {
        throw new Error('Please upload passport photo');
      }

      // Get pre-signed URL for photo upload
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            {
              fileType: photoFile.type,
              uploadType: 'idPhoto'
            }
          ]
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrls } = await uploadUrlResponse.json();
      const photoUpload = uploadUrls[0] as UploadUrlResponse;

      // Upload file to S3
      await fetch(photoUpload.url, {
        method: 'PUT',
        body: photoFile,
        headers: {
          'Content-Type': photoFile.type,
        },
      });

      // Submit travel details
      const response = await fetch('/api/update-arrival-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: registration.formType,
          aadharNumber: registration.aadharNumber,
          arrivalDate,
          arrivalPlace,
          idPhotoKey: photoUpload.key,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit travel details');
      }

      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Generate social share image
      if (photoPreview) {
        setGeneratingShareImage(true);
        try {
          const shareUrl = await createSocialShareImage(photoPreview);
          setShareImageUrl(shareUrl);
          
          // Auto-download the image
          const link = document.createElement('a');
          link.href = shareUrl;
          link.download = `yatra-registration-${registration?.id}.jpg`;
          link.click();
        } catch (err) {
          console.error('Failed to generate share image:', err);
        } finally {
          setGeneratingShareImage(false);
        }
      }
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
    setArrivalDate('');
    setArrivalPlace('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    setImageQuality(null);
    setValidatingImage(false);
    setShareImageUrl(null);
    setGeneratingShareImage(false);
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
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="text-2xl text-center">
                  आगमन विवरण प्रस्तुत करें / Submit Arrival Details
                </CardTitle>
                <CardDescription className="text-center text-base mt-2">
                  केवल स्वीकृत आवेदकों के लिए / For Approved Applicants Only
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleLookup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="regId" className="text-lg">
                      पंजीकरण आईडी / Registration ID
                    </Label>
                    <Input
                      id="regId"
                      value={registrationId}
                      onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                      placeholder="e.g., SAN1501, CHA1601, NAV1301"
                      className="text-lg"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      कृपया अपना पंजीकरण आईडी दर्ज करें जो आपको स्वीकृति के समय प्राप्त हुआ था
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        खोज रहे हैं / Searching...
                      </>
                    ) : (
                      <>आगे बढ़ें / Proceed</>
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
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-2xl">
                      आगमन विवरण / Arrival Details
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Registration ID: <span className="font-bold text-primary">{registration.id}</span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Applicant Name</p>
                    <p className="text-lg font-bold text-primary">{registration.fullName}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Arrival Date */}
                  <div className="space-y-2">
                    <Label htmlFor="arrivalDate" className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      आगमन तिथि / Arrival Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="arrivalDate"
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => {
                        setArrivalDate(e.target.value);
                        setFormErrors({ ...formErrors, arrivalDate: undefined });
                      }}
                      min={DATE_CONFIGS[registration.formType].minDate}
                      max={DATE_CONFIGS[registration.formType].maxDate}
                      className="text-lg"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      कृपया {new Date(DATE_CONFIGS[registration.formType].minDate).toLocaleDateString('en-GB')} और {new Date(DATE_CONFIGS[registration.formType].maxDate).toLocaleDateString('en-GB')} के बीच तिथि चुनें
                    </p>
                    {formErrors.arrivalDate && (
                      <p className="text-sm text-red-500">{formErrors.arrivalDate}</p>
                    )}
                  </div>

                  {/* Arrival Place */}
                  <div className="space-y-2">
                    <Label htmlFor="arrivalPlace" className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      आगमन स्थान / Arrival Place <span className="text-red-500">*</span>
                    </Label>
                    <Select value={arrivalPlace} onValueChange={(value) => {
                      setArrivalPlace(value);
                      setFormErrors({ ...formErrors, arrivalPlace: undefined });
                    }}>
                      <SelectTrigger className="text-lg">
                        <SelectValue placeholder="स्थान चुनें / Select Place" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_CONFIGS[registration.formType].places.map((place) => (
                          <SelectItem key={place} value={place} className="text-lg">
                            {place}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.arrivalPlace && (
                      <p className="text-sm text-red-500">{formErrors.arrivalPlace}</p>
                    )}
                  </div>

                  {/* ID Photo Upload */}
                  <div className="space-y-3">
                    <Label htmlFor="passportPhoto" className="text-lg">
                      ID Card Photo <span className="text-red-500">*</span>
                    </Label>
                    
                    {/* Sample Reference Image */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        📸 महत्वपूर्ण निर्देश / Important Instructions:
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>कृपया अपना स्पष्ट और साफ फोटो अपलोड करें / Please upload your best and clear photo for ID card</li>
                        <li>चेहरा स्पष्ट दिखाई दें और हाल ही में खींची गई फोटो अपलोड करें / Face should be clearly visible, recent photo preferred</li>
                      </ul>
                    </div>

                    {validatingImage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Analyzing Image Quality...</p>
                            <p className="text-xs text-blue-700">Checking clarity, face detection, and lighting</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {imageQuality && !validatingImage && (
                      <div className={`rounded-lg p-4 ${
                        imageQuality.score >= 96 ? 'bg-green-50 border border-green-200' :
                        imageQuality.score >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          {imageQuality.score >= 96 ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium mb-2 ${
                              imageQuality.score >= 96 ? 'text-green-900' :
                              imageQuality.score >= 60 ? 'text-yellow-900' :
                              'text-red-900'
                            }`}>
                              {imageQuality.score >= 96 ? 'Image Quality: Excellent ✓' : 'Image Quality: Needs Improvement'}
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                {imageQuality.isBlurry ? (
                                  <><X className="w-4 h-4 text-red-500" /><span className="text-red-700">Image appears blurry</span></>
                                ) : (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Image is sharp and clear</span></>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {imageQuality.hasFace ? (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Face detected</span></>
                                ) : (
                                  <><X className="w-4 h-4 text-red-500" /><span className="text-red-700">No face detected</span></>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!imageQuality.hasMultipleFaces ? (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Single person detected</span></>
                                ) : (
                                  <><X className="w-4 h-4 text-red-500" /><span className="text-red-700">Multiple faces detected - only one person allowed</span></>
                                )}
                              </div>
                              {imageQuality.hasFace && (
                                <div className="flex items-center gap-2">
                                  {imageQuality.isFrontFacing ? (
                                    <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Front-facing pose</span></>
                                  ) : (
                                    <><X className="w-4 h-4 text-red-500" /><span className="text-red-700">Side view detected - please face camera directly</span></>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {imageQuality.brightness === 'good' ? (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Good lighting</span></>
                                ) : (
                                  <><X className="w-4 h-4 text-orange-500" /><span className="text-orange-700">Lighting is {imageQuality.brightness.replace('_', ' ')}</span></>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {imageQuality.resolution === 'good' ? (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">Good resolution</span></>
                                ) : (
                                  <><X className="w-4 h-4 text-orange-500" /><span className="text-orange-700">Resolution could be better</span></>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!photoPreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <Input
                          id="passportPhoto"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <Label htmlFor="passportPhoto" className="cursor-pointer">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium text-gray-700">
                            फोटो अपलोड करें / Upload Photo
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            JPG, PNG, WEBP (Max 10MB)
                          </p>
                        </Label>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <div className="relative w-48 h-60 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <Image
                            src={photoPreview}
                            alt="Passport Photo Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                            setPhotoError(null);
                            setImageQuality(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {(photoError || (photoFile && imageQuality && imageQuality.score < 96)) && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {photoError || (imageQuality?.hasMultipleFaces 
                            ? 'Multiple faces detected in the image. Please upload a photo with only one person.' 
                            : 'Image quality does not meet requirements. Please upload a better quality photo to submit the form.')}
                        </AlertDescription>
                      </Alert>
                    )}
                    {formErrors.photo && (
                      <p className="text-sm text-red-500">{formErrors.photo}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1 w-full"
                      disabled={loading}
                    >
                      रद्द करें / Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 w-full"
                      disabled={loading || !photoFile || (photoFile !== null && imageQuality !== null && (imageQuality.score < 96 || imageQuality.hasMultipleFaces))}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          जमा हो रहा है / Submitting...
                        </>
                      ) : (
                        <>प्रस्तुत करें / Submit</>
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
            <Card className="shadow-xl">
              <CardContent className="p-6 md:p-10">
                {/* Success Message */}
                <div className="text-center mb-8">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    सफलतापूर्वक प्रस्तुत किया गया!
                  </h2>
                  {/* <p className="text-xl text-gray-600 mb-2">
                    Arrival Details Submitted Successfully!
                  </p>
                  <p className="text-lg text-gray-500">
                    आपके आगमन विवरण सफलतापूर्वक प्राप्त हो गए हैं।
                  </p> */}
                </div>

                {/* Social Share Section */}
                <div className="mb-8">
                  {generatingShareImage ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                      <p className="text-gray-600">Generating your share image...</p>
                    </div>
                  ) : shareImageUrl ? (
                    <div className="space-y-4">
                      {/* Share Message */}
                      <p className="text-sm text-gray-600 text-center px-4">
                        💡 Share this on WhatsApp, Facebook, or Instagram to spread the word!
                      </p>

                      {/* Share Image with Icon Overlay */}
                      <div className="relative mx-auto max-w-sm rounded-lg overflow-hidden shadow-lg">
                        <Image
                          src={shareImageUrl}
                          alt="Social Media Share Image"
                          width={600}
                          height={1024}
                          className="w-full h-auto"
                          priority
                        />
                        
                        {/* Icon Overlay - Center */}
                        <div className="absolute inset-0 flex items-center justify-center gap-6">
                          {/* Native Share Icon (Mobile) */}
                          {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                              onClick={async () => {
                                try {
                                  // Convert data URL to blob
                                  const response = await fetch(shareImageUrl);
                                  const blob = await response.blob();
                                  const file = new File([blob], `yatra-registration-${registration?.id}.jpg`, { type: 'image/jpeg' });

                                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                    await navigator.share({
                                      title: 'Yatra Registration',
                                      text: `I have registered for the Yatra! Registration ID: ${registration?.id}`,
                                      files: [file],
                                    });
                                  } else {
                                    // Fallback to text-only share
                                    await navigator.share({
                                      title: 'Yatra Registration',
                                      text: `I have registered for the Yatra! Registration ID: ${registration?.id}`,
                                    });
                                  }
                                } catch (err) {
                                  console.error('Share failed:', err);
                                }
                              }}
                              className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transition-all hover:scale-110"
                              aria-label="Share Now"
                            >
                              <Share2 className="w-8 h-8 text-gray-900" />
                            </button>
                          )}

                          {/* Download Icon */}
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = shareImageUrl;
                              link.download = `yatra-registration-${registration?.id}.jpg`;
                              link.click();
                            }}
                            className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl transition-all hover:scale-110"
                            aria-label="Download Again"
                          >
                            <Download className="w-8 h-8 text-gray-900" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Share image could not be generated.</p>
                    </div>
                  )}
                </div>

                {/* Registration Details */}
                {/* <div className="bg-primary/5 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2 text-center">Registration ID</p>
                  <p className="text-2xl font-bold text-primary text-center">{registration?.id}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                    <div>
                      <p className="text-sm text-gray-600">Arrival Date</p>
                      <p className="font-semibold">{new Date(arrivalDate).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Arrival Place</p>
                      <p className="font-semibold">{arrivalPlace}</p>
                    </div>
                  </div>
                </div> */}

                {/* Submit Another Button */}
                <div className="text-center">
                  <Button onClick={handleReset} size="lg" variant="outline" className="w-full sm:w-auto">
                    Submit Another Registration
                  </Button>
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

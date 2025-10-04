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
import { Loader2, Upload, X, CheckCircle2, Calendar, MapPin, AlertCircle, CheckCircle, Download, Share2, Hash, ArrowRight } from 'lucide-react';
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
async function createSocialShareImage(
  userPhotoUrl: string, 
  name?: string, 
  registrationId?: string
): Promise<string> {
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
        const centerY = 920; // Adjust based on where the circle is in your template
        const radius = 320; // Adjust based on circle size
        
        // Create circular clipping path
        ctx.beginPath()
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
        
        // Add text fields (Name and Registration ID)
        if (name || registrationId) {
          ctx.save();
          
          // Set text properties
          ctx.fillStyle = '#FFFFFF'; // Black color - adjust as needed
          ctx.textAlign = 'left';
          
          // Draw Name (adjust Y position based on your template)
          if (name) {
            ctx.font = 'bold 55px Arial, sans-serif'; // Adjust font size and family
            const nameY = 1310; // Adjust Y coordinate based on Name field position in template
            const nameX = 570; // Adjust X coordinate based on Name field position in template
            ctx.fillText(name.toUpperCase(), nameX, nameY);
          }
          
          // Draw Registration ID (adjust Y position based on your template)
          if (registrationId) {
            ctx.font = 'bold 55px Arial, sans-serif'; // Adjust font size and family
            const regY = 1410; // Adjust Y coordinate based on REG No. field position in template
            const regX = 630; // Adjust X coordinate based on REG No. field position in template
            ctx.fillText(registrationId, regX, regY);
          }
          
          ctx.restore();
        }
        
        // Convert canvas to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      
      userImg.onerror = () => reject(new Error('Failed to load user image'));
      userImg.src = userPhotoUrl;
    };
    
    templateImg.onerror = () => reject(new Error('Failed to load template image'));
    templateImg.src = '/share-template.jpeg';
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
  setSharePreview,
  name,
  registrationId,
}: {
  file: File | null,
  setPreview: (url: string | null) => void,
  setFile: (file: File | null) => void,
  setError: (msg: string | null) => void,
  setValidating: (val: boolean) => void,
  setQualityResult: (result: ImageQuality | null) => void,
  setSharePreview: (url: string | null) => void,
  name?: string,
  registrationId?: string,
}) {
  if (!file) {
    setPreview(null);
    setFile(null);
    setError(null);
    setQualityResult(null);
    setSharePreview(null);
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
    setSharePreview(null);
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
      setSharePreview(null);
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
          
          // Generate share preview if image quality is good
          if (quality.score >= 96 && !quality.hasMultipleFaces && reader.result) {
            try {
              const shareUrl = await createSocialShareImage(reader.result as string, name, registrationId);
              setSharePreview(shareUrl);
            } catch (err) {
              console.error('Failed to generate share preview:', err);
              setSharePreview(null);
            }
          } else {
            setSharePreview(null);
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
      setSharePreview(null);
      setValidating(false);
    };
    reader.readAsDataURL(compressedFile);
  } catch (err) {
    console.error('Image compression error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(`Error compressing the image: ${errorMessage}. Please try a different image or refresh the page.`);
    setPreview(null);
    setFile(null);
    setSharePreview(null);
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
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Preload face detection models when form step is reached
  useEffect(() => {
    if (step === 'form') {
      // Start loading models in background
      loadFaceApiModels().catch((err) => {
        console.warn('Failed to preload face detection models:', err);
      });
    }
  }, [step]);

  // Handle ESC key to close fullscreen preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreenPreview) {
        setShowFullscreenPreview(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showFullscreenPreview]);

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
      setSharePreview: setSharePreviewUrl,
      name: registration?.fullName,
      registrationId: registration?.id,
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
          const shareUrl = await createSocialShareImage(
            photoPreview, 
            registration?.fullName, 
            registration?.id
          );
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
    setSharePreviewUrl(null);
    setGeneratingShareImage(false);
    setFormErrors({});
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-secondary/5">
      {loading && <FullScreenLoader />}
      <RegistrationNavigation />

      {/* Fullscreen Preview Overlay */}
      {showFullscreenPreview && sharePreviewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFullscreenPreview(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowFullscreenPreview(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200 group"
            aria-label="Close preview"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = sharePreviewUrl;
              link.download = `yatra-preview-${registration?.id}.jpg`;
              link.click();
            }}
            className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200 flex items-center gap-2 text-white text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download Preview
          </button>

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={sharePreviewUrl}
                alt="Full Screen Preview"
                width={600}
                height={1024}
                className="w-full h-auto"
                priority
              />
            </div>
            
            {/* Image Info */}
            <div className="mt-4 text-center">
              <p className="text-white/80 text-sm">
                Click outside or press ESC to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      
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
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    आगमन विवरण प्रस्तुत करें
                  </CardTitle>
                  <CardTitle className="text-2xl font-semibold text-gray-700">
                    Submit Arrival Details
                  </CardTitle>
                  <CardDescription className="text-base mt-3 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      केवल स्वीकृत आवेदकों के लिए
                    </div>
                  </CardDescription>
                  <CardDescription className="text-sm text-gray-600">
                    For Approved Applicants Only
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
                        placeholder="e.g., SAN1501, CHA1601, NAV1301"
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
                      आगमन विवरण
                    </CardTitle>
                    <CardTitle className="text-2xl font-semibold text-gray-700">
                      Arrival Details
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
                  {/* Arrival Date */}
                  <div className="space-y-3">
                    <Label htmlFor="arrivalDate" className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
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
                      className="text-lg h-12 border-2 focus:border-primary transition-colors"
                      required
                    />
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 leading-relaxed">
                        कृपया {new Date(DATE_CONFIGS[registration.formType].minDate).toLocaleDateString('en-GB')} और {new Date(DATE_CONFIGS[registration.formType].maxDate).toLocaleDateString('en-GB')} के बीच तिथि चुनें
                      </p>
                    </div>
                    {formErrors.arrivalDate && (
                      <p className="text-sm text-red-500">{formErrors.arrivalDate}</p>
                    )}
                  </div>

                  {/* Arrival Place */}
                  <div className="space-y-3">
                    <Label htmlFor="arrivalPlace" className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      आगमन स्थान / Arrival Place <span className="text-red-500">*</span>
                    </Label>
                    <Select value={arrivalPlace} onValueChange={(value) => {
                      setArrivalPlace(value);
                      setFormErrors({ ...formErrors, arrivalPlace: undefined });
                    }}>
                      <SelectTrigger className="text-lg h-12 border-2 focus:border-primary transition-colors">
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
                    <Label htmlFor="passportPhoto" className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
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
                            setSharePreviewUrl(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Share Preview - Only shown when image quality is good */}
                    {sharePreviewUrl && photoFile && imageQuality && imageQuality.score >= 96 && !imageQuality.hasMultipleFaces && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="mt-6"
                      >
                        {/* Success Badge */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-md">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Share Preview Ready</span>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                          {/* Preview Image */}
                          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                            <div className="relative mx-auto max-w-sm">
                              {/* Decorative corner accents */}
                              <div className="absolute -top-2 -left-2 w-20 h-20 border-t-4 border-l-4 border-green-500 rounded-tl-xl opacity-50"></div>
                              <div className="absolute -bottom-2 -right-2 w-20 h-20 border-b-4 border-r-4 border-green-500 rounded-br-xl opacity-50"></div>
                              
                              <div 
                                className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-200 cursor-pointer group"
                                onClick={() => setShowFullscreenPreview(true)}
                              >
                                <Image
                                  src={sharePreviewUrl}
                                  alt="Social Media Share Preview"
                                  width={400}
                                  height={683}
                                  className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                                />
                                {/* Click to expand hint */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                  <div className="bg-white/90 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                                    <span className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                      </svg>
                                      Click to expand
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Info Section */}
                          <div className="p-6 space-y-4 bg-white">
                            {/* Title */}
                            <div className="text-center">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Your Shareable Image
                              </h3>
                              <p className="text-sm text-gray-600">
                                This is how it will appear when shared
                              </p>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200"></div>

                            {/* Quick Info Points */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <Share2 className="w-3.5 h-3.5 text-green-600" />
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  Download & share after submission on WhatsApp, Facebook, or Instagram
                                </p>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  Want to change? Upload a different photo before submitting
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
                      disabled={loading || !photoFile || (photoFile !== null && imageQuality !== null && (imageQuality.score < 96 || imageQuality.hasMultipleFaces))}
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
                {/* Simple Success Message */}
                <div className="flex items-center justify-center gap-3 mb-8 pb-6 border-b">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 250 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      सफलतापूर्वक प्रस्तुत किया गया!
                    </h2>
                    <p className="text-sm text-gray-700 mt-0.5">
                      Successfully Submitted
                    </p>
                  </div>
                </div>

                {/* Social Share Section */}
                <div className="mb-8">
                  {generatingShareImage ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                      <p className="text-gray-700">Generating your share image...</p>
                    </div>
                  ) : shareImageUrl ? (
                    <div className="space-y-6">
                      {/* Share Message */}
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Share Your Registration
                        </h3>
                        <p className="text-sm text-gray-700 px-4">
                          💡 Share this on WhatsApp, Facebook, or Instagram to spread the word!
                        </p>
                      </div>

                      {/* Share Image with Icon Overlay */}
                      <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden shadow-2xl ring-2 ring-gray-200">
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
                    <div className="text-center py-6 text-gray-700">
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
                <div className="text-center pt-6 border-t">
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
              </CardContent>
            </Card>
          </motion.section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

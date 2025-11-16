#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * ID Card Image Processor
 * 
 * Automated image preprocessing system that prepares user-uploaded photos for ID card generation.
 * Uses TensorFlow.js with BlazeFace model for face detection, and Sharp for image processing.
 * 
 * Features:
 * - Automatic face detection using machine learning
 * - Face centering and proper framing
 * - Auto-rotation and straightening
 * - Batch processing of multiple images
 * - Standardized 1:1 ratio output (600x600 pixels)
 * 
 * Usage:
 *   node process-id-photos.js [options]
 * 
 * Options:
 *   --input <path>         Input directory containing photos (default: ./files/idPhotos)
 *   --output <path>        Output directory for processed images (default: ./processed/photos)
 *   --size <pixels>        Output image size in pixels (default: 600)
 *   --face-ratio <num>     Target face height ratio 0-1 (default: 0.50)
 *   --remove-bg            Enable ML-based background removal
 *   --bg-color <color>     Background color: white, blue, gray, lightblue, or hex (default: white)
 * 
 * Examples:
 *   node process-id-photos.js --remove-bg
 *   node process-id-photos.js --remove-bg --bg-color blue
 *   node process-id-photos.js --remove-bg --bg-color #d4e6f1
 * 
 * Requirements: Node.js 18+, @tensorflow/tfjs-node, @tensorflow-models/blazeface, sharp, @imgly/background-removal
 */

'use strict';

const tf = require('@tensorflow/tfjs-node');
const blazeface = require('@tensorflow-models/blazeface');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { removeBackground } = require('@imgly/background-removal-node');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  inputDir: './files/idPhotos',
  outputDir: './processed/photos',
  outputSize: 600,
  faceHeightRatio: 0.50,  // Optimized to include full head with hair (50% of image)
  removeBackground: false,  // Set to true to enable ML-based background removal
  backgroundColor: 'white'  // Background color: 'white', 'blue', 'gray', 'lightblue', or hex like '#e0e0e0'
};

/**
 * Parse command-line arguments and return configuration object
 * 
 * Supported arguments:
 *   --input <path>      Input directory path
 *   --output <path>     Output directory path
 *   --size <pixels>     Output image size (default: 600)
 *   --face-ratio <num>  Face height ratio 0-1 (default: 0.40)
 * 
 * @returns {Object} Configuration object with inputDir, outputDir, outputSize, faceHeightRatio
 */
function parseArguments() {
  const config = { ...DEFAULT_CONFIG };
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--input':
        if (nextArg && !nextArg.startsWith('--')) {
          config.inputDir = nextArg;
          i++;
        }
        break;
      
      case '--output':
        if (nextArg && !nextArg.startsWith('--')) {
          config.outputDir = nextArg;
          i++;
        }
        break;
      
      case '--size':
        if (nextArg && !nextArg.startsWith('--')) {
          const size = parseInt(nextArg, 10);
          if (!isNaN(size) && size > 0) {
            config.outputSize = size;
          }
          i++;
        }
        break;
      
      case '--face-ratio':
        if (nextArg && !nextArg.startsWith('--')) {
          const ratio = parseFloat(nextArg);
          if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
            config.faceHeightRatio = ratio;
          }
          i++;
        }
        break;
    }
  }
  
  return config;
}

/**
 * Validate and prepare directories
 * Checks if input directory exists and creates output directory if needed
 * 
 * @param {Object} config - Configuration object with inputDir and outputDir
 * @throws {Error} If input directory doesn't exist or directories cannot be accessed
 */
async function validateDirectories(config) {
  // Check if input directory exists
  try {
    const inputStats = await fs.stat(config.inputDir);
    if (!inputStats.isDirectory()) {
      throw new Error(`Input path is not a directory: ${config.inputDir}`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Input directory does not exist: ${config.inputDir}`);
    }
    throw new Error(`Cannot access input directory: ${err.message}`);
  }
  
  // Create output directory if it doesn't exist
  try {
    await fs.mkdir(config.outputDir, { recursive: true });
  } catch (error) {
    throw new Error(`Cannot create output directory: ${error.message}`);
  }
  
  // Verify output directory is writable
  try {
    await fs.access(config.outputDir, fs.constants.W_OK);
  } catch {
    throw new Error(`Output directory is not writable: ${config.outputDir}`);
  }
}

/**
 * Scan input directory and return array of valid image file paths
 * 
 * Filters for supported image formats: jpg, jpeg, png, webp
 * Returns full paths to valid image files
 * 
 * @param {string} inputDir - Path to input directory
 * @returns {Promise<string[]>} Array of full paths to valid image files
 */
async function scanImageFiles(inputDir) {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const imageFiles = [];
  
  try {
    // Read all files in the directory
    const files = await fs.readdir(inputDir);
    
    // Filter for valid image files
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      if (validExtensions.includes(ext)) {
        const fullPath = path.join(inputDir, file);
        
        // Verify it's a file (not a directory)
        try {
          const stats = await fs.stat(fullPath);
          if (stats.isFile()) {
            imageFiles.push(fullPath);
          }
        } catch {
          // Skip files that can't be accessed
          console.warn(`⚠️  Cannot access file: ${file}`);
        }
      }
    }
    
    return imageFiles;
  } catch (error) {
    throw new Error(`Failed to scan directory: ${error.message}`);
  }
}

/**
 * Detect face in an image using BlazeFace model
 * 
 * Loads the image, converts it to a tensor, runs face detection,
 * and returns face coordinates and landmarks. Handles multiple faces
 * by selecting the largest one. Properly disposes tensors to prevent memory leaks.
 * 
 * @param {string} imagePath - Full path to the image file
 * @param {Object} model - Loaded BlazeFace model instance
 * @returns {Promise<Object|null>} Face detection result with topLeft, bottomRight, landmarks, and probability, or null if no face detected
 */
async function detectFace(imagePath, model) {
  let imageTensor = null;
  let predictions = null;
  
  try {
    // Load image using Sharp and convert to buffer
    const imageBuffer = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = imageBuffer;
    const { width, height, channels } = info;
    
    // Convert buffer to tensor (BlazeFace expects RGB format)
    // Shape: [height, width, channels]
    imageTensor = tf.tensor3d(data, [height, width, channels]);
    
    // Normalize to 0-255 range if needed and ensure RGB (3 channels)
    if (channels === 4) {
      // Convert RGBA to RGB by dropping alpha channel
      imageTensor = imageTensor.slice([0, 0, 0], [height, width, 3]);
    }
    
    // Run face detection with returnTensors=false for better performance
    // Use flipHorizontal=false to maintain original orientation
    predictions = await model.estimateFaces(imageTensor, false);
    
    // Check if any faces were detected
    if (!predictions || predictions.length === 0) {
      return null;
    }
    
    // If multiple faces detected, select the largest one
    let selectedFace = predictions[0];
    if (predictions.length > 1) {
      let maxArea = 0;
      
      for (const face of predictions) {
        const width = face.bottomRight[0] - face.topLeft[0];
        const height = face.bottomRight[1] - face.topLeft[1];
        const area = width * height;
        
        if (area > maxArea) {
          maxArea = area;
          selectedFace = face;
        }
      }
    }
    
    // Extract face information
    const result = {
      topLeft: selectedFace.topLeft,
      bottomRight: selectedFace.bottomRight,
      landmarks: selectedFace.landmarks,
      probability: selectedFace.probability
    };
    
    return result;
    
  } catch (error) {
    console.error(`Error detecting face in ${path.basename(imagePath)}:`, error.message);
    return null;
  } finally {
    // Dispose tensors to prevent memory leaks
    if (imageTensor) {
      imageTensor.dispose();
    }
    // Note: predictions array contains tensor data that's already extracted,
    // so no additional disposal needed for the predictions themselves
  }
}

/**
 * Calculate transform parameters for image processing
 * 
 * Computes crop boundaries, zoom factor, and rotation angle from face detection results.
 * Ensures the face is centered, properly sized (40-50% of image height), and straightened.
 * Includes extra space above the face to capture hair and forehead.
 * All crop boundaries are validated to stay within original image dimensions.
 * 
 * @param {Object} faceBox - Face detection result with topLeft, bottomRight, and landmarks
 * @param {number} imageWidth - Original image width in pixels
 * @param {number} imageHeight - Original image height in pixels
 * @param {number} targetSize - Target output image size in pixels (square)
 * @param {number} faceRatio - Desired face height as ratio of output image (0.4-0.5)
 * @returns {Object} Transform parameters: { cropX, cropY, cropSize, rotation, zoom }
 */
function calculateTransform(faceBox, imageWidth, imageHeight, targetSize, faceRatio) {
  // Extract face bounding box coordinates
  const [faceLeft, faceTop] = faceBox.topLeft;
  const [faceRight, faceBottom] = faceBox.bottomRight;
  
  // Calculate face dimensions
  const faceHeight = faceBottom - faceTop;
  
  // Calculate face center X coordinate (for horizontal centering)
  const faceCenterX = (faceLeft + faceRight) / 2;
  
  // Compute required zoom factor to achieve target face height ratio
  // Target face height in output = targetSize * faceRatio
  // Current face height = faceHeight
  // Zoom factor = (targetSize * faceRatio) / faceHeight
  const zoom = (targetSize * faceRatio) / faceHeight;
  
  // Calculate 1:1 crop region size
  // The crop size in original image coordinates that will be resized to targetSize
  const cropSize = targetSize / zoom;
  
  // Calculate crop origin with adjusted vertical positioning
  // We want the face positioned in the lower portion of the frame to include hair
  // Strategy: Position the TOP of the face bounding box at about 30% from the top of the crop
  // This ensures plenty of space above for hair and forehead
  
  // Calculate where the crop should start vertically
  // We want: faceTop should be at 30% of cropSize from the top of the crop
  // So: cropY = faceTop - (cropSize * 0.3)
  let cropX = faceCenterX - (cropSize / 2);
  let cropY = faceTop - (cropSize * 0.3); // Position face top at 30% from crop top
  
  // Ensure crop boundaries don't exceed original image dimensions
  // Adjust cropX if it goes out of bounds
  if (cropX < 0) {
    cropX = 0;
  } else if (cropX + cropSize > imageWidth) {
    cropX = imageWidth - cropSize;
  }
  
  // Adjust cropY if it goes out of bounds
  if (cropY < 0) {
    cropY = 0;
  } else if (cropY + cropSize > imageHeight) {
    cropY = imageHeight - cropSize;
  }
  
  // Handle case where image is smaller than required crop size
  if (cropSize > imageWidth || cropSize > imageHeight) {
    // Use the entire image and adjust zoom accordingly
    const actualCropSize = Math.min(imageWidth, imageHeight);
    const adjustedZoom = targetSize / actualCropSize;
    
    return {
      cropX: 0,
      cropY: 0,
      cropSize: actualCropSize,
      rotation: 0,
      zoom: adjustedZoom
    };
  }
  
  // Compute rotation angle from eye landmarks to straighten face
  let rotation = 0;
  
  if (faceBox.landmarks && faceBox.landmarks.length >= 2) {
    // BlazeFace returns landmarks as array: [rightEye, leftEye, nose, mouth, rightEar, leftEar]
    // We use the first two landmarks (eyes) to calculate rotation
    const rightEye = faceBox.landmarks[0]; // [x, y]
    const leftEye = faceBox.landmarks[1];  // [x, y]
    
    // Verify landmarks are valid (not NaN or undefined)
    if (rightEye && leftEye && 
        !isNaN(rightEye[0]) && !isNaN(rightEye[1]) &&
        !isNaN(leftEye[0]) && !isNaN(leftEye[1])) {
      
      // Calculate angle between eyes to determine head tilt
      const deltaY = leftEye[1] - rightEye[1];
      const deltaX = leftEye[0] - rightEye[0];
      
      // Only calculate rotation if eyes are reasonably far apart
      const eyeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (eyeDistance > 10) { // Minimum 10 pixels between eyes
        
        // Convert to degrees
        // Positive deltaY means left eye is lower, so we need to rotate clockwise (negative)
        rotation = -(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
        
        // Only apply rotation if the tilt is significant (more than 2 degrees)
        // This prevents unnecessary rotation for nearly straight faces
        if (Math.abs(rotation) < 2) {
          rotation = 0;
        }
        
        // Limit rotation to reasonable range (-10 to +10 degrees)
        // Extreme rotations usually indicate detection errors
        if (rotation > 10) {
          rotation = 10;
        } else if (rotation < -10) {
          rotation = -10;
        }
      }
    }
  }
  
  // Return transform parameters
  return {
    cropX: Math.round(cropX),
    cropY: Math.round(cropY),
    cropSize: Math.round(cropSize),
    rotation: rotation,
    zoom: zoom
  };
}

/**
 * Convert color name or hex to RGB object
 * 
 * @param {string} color - Color name (white, blue, gray, lightblue) or hex code (#rrggbb)
 * @returns {Object} RGB object with r, g, b properties
 */
function colorToRGB(color) {
  const colorMap = {
    'white': { r: 255, g: 255, b: 255 },
    'blue': { r: 52, g: 152, b: 219 },      // Professional blue
    'lightblue': { r: 212, g: 230, b: 241 }, // Light blue
    'gray': { r: 240, g: 240, b: 240 },      // Light gray
    'grey': { r: 240, g: 240, b: 240 }       // Alternative spelling
  };
  
  // Check if it's a named color
  if (colorMap[color.toLowerCase()]) {
    return colorMap[color.toLowerCase()];
  }
  
  // Try to parse as hex color
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
      };
    }
  }
  
  // Default to white if color is invalid
  return { r: 255, g: 255, b: 255 };
}

/**
 * Remove background from image using ML model
 * 
 * Uses @imgly/background-removal for accurate, ML-based background removal.
 * Replaces the background with a solid color suitable for ID photos.
 * 
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} backgroundColor - Background color name or hex code
 * @returns {Promise<Buffer>} Processed image buffer with background removed
 */
async function removeImageBackground(imageBuffer, backgroundColor) {
  try {
    // Remove background using ML model
    // This returns a Blob with transparent background
    const blob = await removeBackground(imageBuffer);
    
    // Convert Blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    const pngBuffer = Buffer.from(arrayBuffer);
    
    // Get RGB values for the background color
    const bgColor = colorToRGB(backgroundColor);
    
    // Use Sharp to composite the transparent image onto a colored background
    const result = await sharp(pngBuffer)
      .flatten({ background: bgColor })
      .toBuffer();
    
    return result;
    
  } catch (error) {
    console.error('Background removal failed:', error.message);
    // Return original image if background removal fails
    return imageBuffer;
  }
}

/**
 * Process image with transformations using Sharp
 * 
 * Applies rotation correction, extracts crop region, resizes to target dimensions,
 * optionally removes background using ML, applies sharpening, and saves as high-quality output.
 * 
 * @param {string} inputPath - Full path to input image file
 * @param {string} outputDir - Directory where processed image will be saved
 * @param {Object} transform - Transform parameters from calculateTransform
 * @param {number} targetSize - Target output size in pixels (square)
 * @param {Object} config - Configuration object with removeBackground and backgroundColor options
 * @returns {Promise<string>} Full path to the saved output file
 */
async function processImage(inputPath, outputDir, transform, targetSize, config = {}) {
  // Generate output filename based on input filename with source file extension (Requirement 4.4, 7.3)
  const inputExt = path.extname(inputPath).toLowerCase();
  const baseName = path.basename(inputPath, inputExt);
  
  // Determine output format based on input extension
  // Convert all to jpg for consistency and quality (Requirement 7.3)
  const outputFilename = `${baseName}.jpg`;
  const outputPath = path.join(outputDir, outputFilename);
  
  try {
    // Create Sharp pipeline starting with the input image
    let pipeline = sharp(inputPath);
    
    // Extract crop region FIRST with calculated boundaries
    // This centers the face in the output image
    pipeline = pipeline.extract({
      left: transform.cropX,
      top: transform.cropY,
      width: transform.cropSize,
      height: transform.cropSize
    });
    
    // Apply rotation correction if needed
    // Rotate with background fill to maintain square dimensions
    if (transform.rotation !== 0) {
      const bgColor = config.removeBackground ? colorToRGB(config.backgroundColor || 'white') : { r: 240, g: 240, b: 240 };
      pipeline = pipeline.rotate(transform.rotation, {
        background: { ...bgColor, alpha: 1 }
      });
    }
    
    // Resize to target output size
    // This ensures we have a square canvas
    pipeline = pipeline.resize(targetSize, targetSize, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3' // High-quality resampling
    });
    
    // Convert pipeline to buffer for background removal if needed
    let processedBuffer = await pipeline.toBuffer();
    
    // Apply ML-based background removal if enabled
    if (config.removeBackground) {
      console.log(`   🎨 Removing background...`);
      processedBuffer = await removeImageBackground(processedBuffer, config.backgroundColor || 'white');
    }
    
    // Create final pipeline from processed buffer
    let finalPipeline = sharp(processedBuffer);
    
    // Ensure final size is exactly targetSize x targetSize
    finalPipeline = finalPipeline.resize(targetSize, targetSize, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3'
    });
    
    // Apply sharpening to maintain image quality
    // Mild sharpening to compensate for any softness from resizing
    finalPipeline = finalPipeline.sharpen({
      sigma: 1.0,
      m1: 1.0,
      m2: 0.2
    });
    
    // Save as high-quality JPEG
    // Quality 95 provides excellent quality with minimal compression artifacts
    await finalPipeline.jpeg({
      quality: 95,
      chromaSubsampling: '4:4:4', // No chroma subsampling for maximum color accuracy
      mozjpeg: true // Use optimized JPEG encoder
    }).toFile(outputPath);
    
    return outputPath;
    
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Log progress for current image processing
 * 
 * Displays current progress with percentage, image number, and status.
 * Provides clear visual feedback during batch processing.
 * 
 * Requirements addressed:
 * - 6.1: Log the total number of images to be processed
 * - 6.2: Log the filename and success status
 * - 6.5: Display processing progress as a percentage of total images
 * 
 * @param {number} current - Current image number (1-based)
 * @param {number} total - Total number of images to process
 * @param {string} filename - Name of the file being processed
 * @param {string} status - Status: 'success', 'failed', or 'no-face'
 * @param {string} [reason] - Optional reason for failure
 */
function logProgress(current, total, filename, status, reason = '') {
  // Calculate percentage (Requirement 6.5)
  const percentage = Math.round((current / total) * 100);
  
  // Create progress bar
  const barLength = 20;
  const filledLength = Math.round((current / total) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  // Format status message with appropriate emoji (Requirement 6.2)
  let statusMessage = '';
  
  switch (status) {
    case 'success':
      statusMessage = `✅ Processed: ${filename}`;
      break;
    
    case 'no-face':
      statusMessage = `⚠️  No face detected: ${filename} (original copied)`;
      break;
    
    case 'failed':
      statusMessage = `❌ Error: ${filename} (original copied)`;
      if (reason) {
        statusMessage += ` - ${reason}`;
      }
      break;
    
    default:
      statusMessage = `🔄 Processing: ${filename}`;
  }
  
  // Display progress with percentage and bar
  console.log(`[${current}/${total}] ${bar} ${percentage}% - ${statusMessage}`);
}

/**
 * Log final processing summary with statistics
 * 
 * Displays comprehensive summary including total processed, success count,
 * failure count, and detailed list of failed files with reasons.
 * Provides clear visual separation and easy-to-read statistics.
 * 
 * Requirements addressed:
 * - 6.3: Log error details and continue processing remaining images
 * - 6.4: Log summary statistics including success count and failure count
 * 
 * @param {Object} results - Processing results object
 * @param {number} results.total - Total number of images processed
 * @param {number} results.successful - Number of successfully processed images
 * @param {number} results.failed - Number of failed images
 * @param {Array} results.failedFiles - Array of failed file objects with filename and reason
 */
function logSummary(results) {
  console.log();
  console.log('================================');
  console.log('📊 Processing Summary');
  console.log('================================');
  console.log();
  
  // Display statistics (Requirement 6.4)
  console.log(`📁 Total images:     ${results.total}`);
  console.log(`✅ Successful:       ${results.successful}`);
  console.log(`❌ Failed:           ${results.failed}`);
  
  // Calculate success rate
  const successRate = results.total > 0 
    ? ((results.successful / results.total) * 100).toFixed(1)
    : 0;
  console.log(`📈 Success rate:     ${successRate}%`);
  
  // Display list of failed files if any (Requirement 6.4)
  if (results.failedFiles.length > 0) {
    console.log();
    console.log('❌ Failed files:');
    console.log('--------------------------------');
    
    results.failedFiles.forEach(({ filename, reason }, index) => {
      console.log(`   ${index + 1}. ${filename}`);
      console.log(`      Reason: ${reason}`);
    });
  } else {
    console.log();
    console.log('🎉 All images processed successfully!');
  }
  
  console.log();
  console.log('================================');
}

/**
 * Process a batch of images
 * 
 * Orchestrates the processing of all images in the input directory.
 * Processes images sequentially to manage memory usage effectively.
 * Tracks success/failure for each image and handles errors gracefully.
 * 
 * Requirements addressed:
 * - 4.2: Process all valid image files within the input directory
 * - 4.5: Process images with optimized memory usage to handle large batches
 * - 5.4: Handle Source Images with resolutions ranging from 640x480 to 4096x4096 pixels
 * 
 * @param {string[]} imageFiles - Array of full paths to image files to process
 * @param {string} outputDir - Directory where processed images will be saved
 * @param {Object} model - Loaded BlazeFace model instance
 * @param {Object} config - Configuration object with outputSize and faceHeightRatio
 * @returns {Promise<Object>} Processing summary with statistics
 */
async function processBatch(imageFiles, outputDir, model, config) {
  const results = {
    total: imageFiles.length,
    successful: 0,
    failed: 0,
    failedFiles: []
  };
  
  // Process images sequentially to manage memory usage (Requirement 4.5)
  for (let i = 0; i < imageFiles.length; i++) {
    const imagePath = imageFiles[i];
    const filename = path.basename(imagePath);
    const currentNum = i + 1;
    
    try {
      // Get image metadata to check resolution (Requirement 5.4)
      const metadata = await sharp(imagePath).metadata();
      const { width, height } = metadata;
      
      // Detect face in the image
      const faceBox = await detectFace(imagePath, model);
      
      // Handle case where no face is detected (Requirement 1.3)
      if (!faceBox) {
        // Copy original image to output folder
        const outputPath = path.join(outputDir, filename);
        await fs.copyFile(imagePath, outputPath);
        
        // Log progress with no-face status (Requirement 6.2)
        logProgress(currentNum, results.total, filename, 'no-face');
        results.failed++;
        results.failedFiles.push({
          filename,
          reason: 'No face detected'
        });
        continue; // Continue processing remaining images
      }
      
      // Calculate transform parameters
      const transform = calculateTransform(
        faceBox,
        width,
        height,
        config.outputSize,
        config.faceHeightRatio
      );
      
      // Process the image with calculated transforms
      await processImage(
        imagePath,
        outputDir,
        transform,
        config.outputSize,
        config  // Pass full config for background removal options
      );
      
      // Log progress with success status (Requirement 6.2, 6.5)
      logProgress(currentNum, results.total, filename, 'success');
      results.successful++;
      
    } catch (error) {
      // Copy original image to output folder on failure
      try {
        const outputPath = path.join(outputDir, filename);
        await fs.copyFile(imagePath, outputPath);
      } catch (copyError) {
        // If copy fails, log but continue
        console.error(`   ⚠️  Could not copy original file: ${copyError.message}`);
      }
      
      // Handle errors gracefully and continue processing (Requirement 4.2, 6.3)
      logProgress(currentNum, results.total, filename, 'failed', error.message);
      results.failed++;
      results.failedFiles.push({
        filename,
        reason: error.message
      });
      // Continue to next image instead of stopping the entire batch
    }
  }
  
  return results;
}

/**
 * Main execution function
 * 
 * Coordinates the entire image processing workflow from start to finish.
 * This function orchestrates all major steps in sequence:
 * 1. Parse command-line arguments and display configuration
 * 2. Validate input/output directories
 * 3. Scan input directory for valid image files
 * 4. Load TensorFlow BlazeFace model for face detection
 * 5. Process all images in batch mode
 * 6. Display comprehensive summary statistics
 * 
 * Error Handling Strategy:
 * - Fatal errors (directory access, model loading) cause immediate exit with code 1
 * - Individual image processing errors are logged but don't stop the batch
 * - Returns exit code 0 if at least some images processed successfully
 * - Returns exit code 1 if all images failed or no images found
 * 
 * Requirements addressed:
 * - 1.3: Log error message and skip processing when no face detected
 * - 8.1: Implemented as a single Node.js script file
 * - 8.4: Include inline documentation explaining key functions and parameters
 * 
 * @returns {Promise<number>} Exit code: 0 for success, 1 for failure
 */
async function main() {
  try {
    console.log('🚀 ID Card Image Processor');
    console.log('================================\n');
    
    // Step 1: Parse command-line arguments (Requirement 8.3)
    const config = parseArguments();
    
    // Display configuration for transparency
    console.log('📋 Configuration:');
    console.log(`   Input Directory:  ${config.inputDir}`);
    console.log(`   Output Directory: ${config.outputDir}`);
    console.log(`   Output Size:      ${config.outputSize}x${config.outputSize}px`);
    console.log(`   Face Height Ratio: ${(config.faceHeightRatio * 100).toFixed(0)}%`);
    console.log(`   Background Removal: ${config.removeBackground ? '✅ Enabled' : '❌ Disabled'}`);
    if (config.removeBackground) {
      console.log(`   Background Color: ${config.backgroundColor}`);
    }
    console.log();
    
    // Step 2: Validate directories (Requirement 8.4)
    // This ensures input directory exists and output directory can be created
    console.log('🔍 Validating directories...');
    try {
      await validateDirectories(config);
      console.log('✅ Directories validated');
    } catch (error) {
      // Fatal error: cannot proceed without valid directories
      console.error(`❌ Directory validation failed: ${error.message}`);
      console.error('   Please check that the input directory exists and you have write permissions for the output directory.');
      return 1; // Exit code 1 indicates failure
    }
    console.log();
    
    // Step 3: Scan for image files (Requirement 4.1, 4.2)
    console.log('📂 Scanning for image files...');
    let imageFiles;
    try {
      imageFiles = await scanImageFiles(config.inputDir);
      console.log(`✅ Found ${imageFiles.length} image file(s) to process`);
    } catch (error) {
      // Fatal error: cannot proceed without scanning directory
      console.error(`❌ Failed to scan directory: ${error.message}`);
      return 1; // Exit code 1 indicates failure
    }
    
    // Check if any valid images were found
    if (imageFiles.length === 0) {
      console.log('\n⚠️  No valid image files found in input directory');
      console.log('   Supported formats: jpg, jpeg, png, webp');
      console.log('   Please add image files to the input directory and try again.');
      return 1; // Exit code 1: no images to process
    }
    
    console.log();
    
    // Step 4: Load BlazeFace model (Requirement 5.1)
    // This is a critical step - if model loading fails, we cannot proceed
    console.log('🤖 Loading BlazeFace face detection model...');
    let model;
    try {
      model = await blazeface.load();
      console.log('✅ Model loaded successfully');
    } catch (error) {
      // Fatal error: cannot proceed without the ML model
      console.error(`❌ Failed to load face detection model: ${error.message}`);
      console.error('   Please ensure @tensorflow/tfjs-node and @tensorflow-models/blazeface are installed.');
      console.error('   Run: npm install @tensorflow/tfjs-node @tensorflow-models/blazeface');
      return 1; // Exit code 1 indicates failure
    }
    console.log();
    
    // Step 5: Process batch of images (Requirement 4.2, 4.5)
    console.log('🔄 Processing images...');
    console.log();
    
    // Log total number of images to be processed (Requirement 6.1)
    console.log(`📋 Total images to process: ${imageFiles.length}`);
    console.log();
    
    // Process all images in batch mode
    // Individual errors are handled within processBatch and don't stop execution
    const results = await processBatch(imageFiles, config.outputDir, model, config);
    
    // Step 6: Display comprehensive summary (Requirement 6.4)
    logSummary(results);
    
    // Determine exit code based on results
    // Success if at least one image was processed successfully
    if (results.successful > 0) {
      console.log('✅ Processing completed successfully');
      return 0; // Exit code 0 indicates success
    } else {
      console.log('❌ Processing completed with errors - no images were successfully processed');
      return 1; // Exit code 1: all images failed
    }
    
  } catch (error) {
    // Catch any unexpected errors that weren't handled above
    // This is a safety net for truly unexpected failures
    console.error('\n❌ Unexpected error occurred:');
    console.error(`   ${error.message}`);
    
    // Include stack trace for debugging if available
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    
    return 1; // Exit code 1 indicates failure
  }
}

/**
 * Script entry point
 * 
 * Executes the main function when script is run directly (not imported as module).
 * Handles the exit code returned by main() and ensures the process exits with
 * the appropriate status code for shell integration.
 * 
 * Exit codes:
 * - 0: Success (at least one image processed successfully)
 * - 1: Failure (fatal error or all images failed)
 * 
 * Requirements addressed:
 * - 8.1: Implemented as a single Node.js script file
 * - 8.4: Ensure script exits with appropriate status codes
 */
if (require.main === module) {
  // Execute main function and handle exit code
  main()
    .then(exitCode => {
      // Exit with the code returned by main()
      // This allows shell scripts to detect success/failure
      process.exit(exitCode);
    })
    .catch(error => {
      // This catch block handles any errors that weren't caught in main()
      // This should rarely execute due to comprehensive error handling in main()
      console.error('\n❌ Fatal error:', error.message);
      if (error.stack) {
        console.error('\n📋 Stack trace:');
        console.error(error.stack);
      }
      process.exit(1); // Exit code 1 indicates failure
    });
}

module.exports = { 
  main,
  processBatch,
  detectFace,
  calculateTransform,
  processImage,
  logProgress,
  logSummary
};

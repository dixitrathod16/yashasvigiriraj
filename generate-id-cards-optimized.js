/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const QRCode = require('qrcode');

// Configuration
const FRONT_TEMPLATE = './idFrontTemplate.png';
const BACK_TEMPLATE = './idBackTemplate.png';
const DATA_FILE = './ApprovedRegistrations.json';
const FILES_DIR = './files';
const OUTPUT_DIR = './generated-id-cards';

// Performance settings
const BATCH_SIZE = 10; // Process 10 users concurrently
const ENABLE_LOGGING = true; // Set to false for faster processing

// Photo fitting modes
const PHOTO_FIT_MODE = 'cover'; // Options: 'cover', 'contain', 'fill'
// 'cover' - Fill entire area, crop if needed (no empty space, no distortion)
// 'contain' - Fit entire photo, may have empty space (no cropping, no distortion)
// 'fill' - Stretch to fill (may distort, no cropping, no empty space)

// Position configuration (matching single-id script)
const POSITIONS = {
  userPhoto: { x: 395, y: 652, width: 470, height: 560 },
  qrCode: { x: 85, y: 575, size: 200 },
  regNumber: { x: 640, y: 1330 },
  name: { x: 310, y: 1470 },
  age: { x: 1130, y: 1470 },
  gender: { x: 310, y: 1580 },
  phone: { x: 870, y: 1580 },
  busNumber: { x: 440, y: 1725 },
  tentNumber: { x: 1040, y: 1725 }
};

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load user data
const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Cache for loaded templates (load once, reuse many times)
let frontTemplateCache = null;
let backTemplateCache = null;

// Helper functions
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getUserPhotoPath(user) {
  if (user.idPhotoKey && user.idPhotoKey.trim() !== '') {
    return path.join(FILES_DIR, user.idPhotoKey);
  }
  if (user.photoKey && user.photoKey.trim() !== '') {
    return path.join(FILES_DIR, user.photoKey);
  }
  return null;
}

async function generateQRCode(text) {
  try {
    return await QRCode.toBuffer(text, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.log(err);
    return null;
  }
}

// Load templates once and cache them
async function loadTemplates() {
  if (!frontTemplateCache) {
    frontTemplateCache = await loadImage(FRONT_TEMPLATE);
  }
  if (!backTemplateCache) {
    backTemplateCache = await loadImage(BACK_TEMPLATE);
  }
}

// Generate front card (optimized)
async function generateFrontCard(user, template) {
  try {
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(template, 0, 0);
    
    // Load user photo with auto-fit
    const photoPath = getUserPhotoPath(user);
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        const userPhoto = await loadImage(photoPath);
        const { x, y, width, height } = POSITIONS.userPhoto;
        
        const imgAspect = userPhoto.width / userPhoto.height;
        const boxAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        let sourceX = 0, sourceY = 0, sourceWidth = userPhoto.width, sourceHeight = userPhoto.height;
        
        if (PHOTO_FIT_MODE === 'fill') {
          // Fill mode: Stretch to fill entire area (may distort)
          drawWidth = width;
          drawHeight = height;
          drawX = x;
          drawY = y;
          ctx.drawImage(userPhoto, drawX, drawY, drawWidth, drawHeight);
          
        } else if (PHOTO_FIT_MODE === 'contain') {
          // Contain mode: Fit entire photo, may have empty space
          if (imgAspect > boxAspect) {
            drawWidth = width;
            drawHeight = width / imgAspect;
            drawX = x;
            drawY = y + (height - drawHeight) / 2;
          } else {
            drawHeight = height;
            drawWidth = height * imgAspect;
            drawX = x + (width - drawWidth) / 2;
            drawY = y;
          }
          ctx.drawImage(userPhoto, drawX, drawY, drawWidth, drawHeight);
          
        } else {
          // Cover mode (default): Fill entire area, crop if needed
          if (imgAspect > boxAspect) {
            // Image is wider - crop sides
            sourceHeight = userPhoto.height;
            sourceWidth = sourceHeight * boxAspect;
            sourceX = (userPhoto.width - sourceWidth) / 2;
            sourceY = 0;
          } else {
            // Image is taller - crop top/bottom
            sourceWidth = userPhoto.width;
            sourceHeight = sourceWidth / boxAspect;
            sourceX = 0;
            sourceY = (userPhoto.height - sourceHeight) / 2;
          }
          // Draw cropped image to fill exact dimensions
          ctx.drawImage(
            userPhoto,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Source crop area
            x, y, width, height                            // Destination (exact fit)
          );
        }
      } catch (err) {
        // Skip photo if it fails to load
        console.log(err);
      }
    }
    
    // Generate QR code
    const qrBuffer = await generateQRCode(user.id);
    if (qrBuffer) {
      const qrImage = await loadImage(qrBuffer);
      const { x, y, size } = POSITIONS.qrCode;
      ctx.drawImage(qrImage, x, y, size, size);
    }
    
    // Draw text (matching single-id script layout)
    ctx.fillStyle = '#E91E63';
    
    // Registration Number (centered)
    ctx.textAlign = 'center';
    ctx.font = 'bold 65px Arial';
    ctx.fillText(user.id, POSITIONS.regNumber.x, POSITIONS.regNumber.y);
    
    // Name and Gender (left-aligned for consistency)
    ctx.textAlign = 'left';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(toTitleCase(user.fullName) || '', POSITIONS.name.x, POSITIONS.name.y);
    
    const genderText = user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender;
    ctx.fillText(genderText, POSITIONS.gender.x, POSITIONS.gender.y);
    
    // Age and Phone (left-aligned)
    ctx.fillText(user.age || '', POSITIONS.age.x, POSITIONS.age.y);
    ctx.fillText(user.phoneNumber || '', POSITIONS.phone.x, POSITIONS.phone.y);
    
    // Bus and Tent numbers (centered in their boxes)
    ctx.textAlign = 'center';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(user.busNumber || user.busTime || user.group || '12', POSITIONS.busNumber.x, POSITIONS.busNumber.y);
    ctx.fillText(user.tentNumber || user.group || '31', POSITIONS.tentNumber.x, POSITIONS.tentNumber.y);
    
    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error(`Error generating front card for ${user.id}:`, err.message);
    return null;
  }
}

// Generate back card (optimized)
async function generateBackCard(user, template) {
  try {
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(template, 0, 0);
    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error(`Error generating back card for ${user.id}:`, err.message);
    return null;
  }
}

// Process a single user
async function processUser(user, frontTemplate, backTemplate) {
  try {
    const userDir = path.join(OUTPUT_DIR, user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Generate both cards
    const [frontBuffer, backBuffer] = await Promise.all([
      generateFrontCard(user, frontTemplate),
      generateBackCard(user, backTemplate)
    ]);
    
    // Save both cards
    if (frontBuffer) {
      fs.writeFileSync(path.join(userDir, `${user.id}_front.png`), frontBuffer);
    }
    if (backBuffer) {
      fs.writeFileSync(path.join(userDir, `${user.id}_back.png`), backBuffer);
    }
    
    return { success: true, id: user.id };
  } catch (err) {
    return { success: false, id: user.id, error: err.message };
  }
}

// Process users in batches
async function processBatch(users, frontTemplate, backTemplate, batchNum, totalBatches) {
  const results = await Promise.all(
    users.map(user => processUser(user, frontTemplate, backTemplate))
  );
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  if (ENABLE_LOGGING) {
    console.log(`Batch ${batchNum}/${totalBatches} complete: ${successful} success, ${failed} failed`);
  }
  
  return results;
}

// Main function with batch processing
async function generateAllCards() {
  const startTime = Date.now();
  
  console.log(`\n🚀 Starting optimized ID card generation`);
  console.log(`   Total users: ${users.length}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);
  
  // Load templates once
  console.log('📦 Loading templates...');
  await loadTemplates();
  console.log('✓ Templates loaded\n');
  
  // Split users into batches
  const batches = [];
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    batches.push(users.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Processing ${batches.length} batches...\n`);
  
  // Process batches
  let allResults = [];
  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processBatch(
      batches[i],
      frontTemplateCache,
      backTemplateCache,
      i + 1,
      batches.length
    );
    allResults = allResults.concat(batchResults);
    
    // Progress indicator
    const progress = ((i + 1) / batches.length * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const estimated = (elapsed / (i + 1) * batches.length).toFixed(1);
    
    if (ENABLE_LOGGING && (i + 1) % 5 === 0) {
      console.log(`Progress: ${progress}% | Elapsed: ${elapsed}s | Est. total: ${estimated}s`);
    }
  }
  
  // Summary
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;
  const avgTime = (totalTime / users.length).toFixed(3);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Generation Complete!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total time:        ${totalTime}s`);
  console.log(`Successful:        ${successCount}`);
  console.log(`Failed:            ${failCount}`);
  console.log(`Average per card:  ${avgTime}s`);
  console.log(`Output directory:  ${OUTPUT_DIR}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Show failed users if any
  if (failCount > 0) {
    console.log('Failed users:');
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.id}: ${r.error}`);
    });
  }
}

// Run the generator
generateAllCards().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

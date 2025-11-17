/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const QRCode = require('qrcode');

// Configuration
// const FRONT_TEMPLATE = './idTemplates/fullSanghFrontTemplate.jpg';
const FRONT_TEMPLATE = './idTemplates/tag-01.jpg';
const BACK_TEMPLATE = './idTemplates/tag-02.jpg';
const DATA_FILE = './data-imports/fullSanghApprovedRegistrations.json';
const FILES_DIR = './files';
const OUTPUT_DIR = './full-sangh-id';

// Performance settings
const BATCH_SIZE = 10; // Process 10 users concurrently
const ENABLE_LOGGING = true; // Set to false for faster processing

// Photo fitting modes
const PHOTO_FIT_MODE = 'cover'; // Options: 'cover', 'contain', 'fill'
// 'cover' - Fill entire area, crop if needed (no empty space, no distortion)
// 'contain' - Fit entire photo, may have empty space (no cropping, no distortion)
// 'fill' - Stretch to fill (may distort, no cropping, no empty space)

// Position configuration (matching single-id script)
// const POSITIONS = {
//   userPhoto: { x: 293, y: 390, width: 315, height: 315 },
//   qrCode: { x: 85, y: 660, size: 130 },
//   regNumber: { 
//     x: 450, y: 770,
//   },
//   name: { 
//     x: 235, y: 850,
//   },
//   age: { 
//     x: 785, y: 850,
//   },
//   gender: { 
//     x: 235, y: 925,
//   },
//   phone: { 
//     x: 605, y: 925,
//   },
//   busNumber: { 
//     x: 320, y: 1020,
//   },
//   tentNumber: { 
//     x: 720, y: 1020,
//   },
//   backRegNumber: {
//     x: 695, y: 130,
//   },
//   nakodaBlock: {
//     x: 335, y: 360,
//   },
//   nakodaRoom: {
//     x: 585, y: 360,
//   },
//   tarangaBlock: {
//     x: 335, y: 440,
//   },
//   tarangaRoom: {
//     x: 585, y: 440,
//   },
//   sankeshwarBlock: {
//     x: 335, y: 520,
//   },
//   sankeshwarRoom: {
//     x: 585, y: 520,
//   },
//   girnarBlock: {
//     x: 335, y: 590,
//   },
//   girnarRoom: {
//     x: 585, y: 590,
//   },
//   palitanaBlock: {
//     x: 335, y: 670,
//   },
//   palitanaRoom: {
//     x: 585, y: 670,
//   }
// };

// Luggage Tags
const POSITIONS = {
  userPhoto: { x: 230, y: 403, width: 250, height: 250 },
  qrCode: { x: 68, y: 617, size: 102 },
  regNumber: { 
    x: 360, y: 705,
  },
  name: { 
    x: 180, y: 765,
  },
  age: { 
    x: 620, y: 765,
  },
  gender: { 
    x: 180, y: 825,
  },
  phone: { 
    x: 475, y: 825,
  },
  busNumber: { 
    x: 250, y: 900,
  },
  tentNumber: { 
    x: 565, y: 900,
  },
  backRegNumber: {
    x: 530, y: 235,
  },
  nakodaBlock: {
    x: 275, y: 400,
  },
  nakodaRoom: {
    x: 455, y: 400,
  },
  tarangaBlock: {
    x: 275, y: 455,
  },
  tarangaRoom: {
    x: 455, y: 455,
  },
  sankeshwarBlock: {
    x: 275, y: 505,
  },
  sankeshwarRoom: {
    x: 455, y: 505,
  },
  girnarBlock: {
    x: 275, y: 560,
  },
  girnarRoom: {
    x: 455, y: 560,
  },
  palitanaBlock: {
    x: 275, y: 615,
  },
  palitanaRoom: {
    x: 455, y: 615,
  }
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
  str = str.toString();
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function trimNameToLength(name, maxLength = 23) {
  if (!name || name.length <= maxLength) return name;
  
  const words = name.split(' ');
  let result = words[0]; // Always keep at least the first word
  
  // Add words one by one until we exceed the limit
  for (let i = 1; i < words.length; i++) {
    const testName = result + ' ' + words[i];
    if (testName.length <= maxLength) {
      result = testName;
    } else {
      break; // Stop adding words once we exceed the limit
    }
  }
  
  return result;
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
    ctx.font = 'bold 35px Arial';
    ctx.fillText(user.id, POSITIONS.regNumber.x, POSITIONS.regNumber.y);
    
    // Name and Gender (left-aligned for consistency)
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px Arial';
    const formattedName = trimNameToLength(toTitleCase(user.fullName), 23);
    ctx.fillText(formattedName || '', POSITIONS.name.x, POSITIONS.name.y);
    
    const genderText = user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender;
    ctx.fillText(genderText, POSITIONS.gender.x, POSITIONS.gender.y);
    
    // Age and Phone (left-aligned)
    ctx.fillText(user.age || '', POSITIONS.age.x, POSITIONS.age.y);
    ctx.fillText(user.phoneNumber || '', POSITIONS.phone.x, POSITIONS.phone.y);
    
    // Bus and Tent numbers (centered in their boxes)
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Arial';

    const busNo = user.busNo ? String(user.busNo).trim() : '';
    const tentNo = user.tentNo ? String(user.tentNo).trim() : '';

    if (busNo) {
      ctx.fillText(busNo, POSITIONS.busNumber.x, POSITIONS.busNumber.y);
    }

    if (tentNo) {
      ctx.fillText(tentNo, POSITIONS.tentNumber.x, POSITIONS.tentNumber.y);
    }
    
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

    ctx.fillStyle = '#E91E63';
    
    // Registration Number (centered)
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(user.id, POSITIONS.backRegNumber.x, POSITIONS.backRegNumber.y);

    // Room allotment details
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#E91E63';

    const nakodaBlock = user.nakodaBlock ? String(user.nakodaBlock).trim() : '';
    const nakodaRoom = user.nakodaRoom ? String(user.nakodaRoom).trim() : '';
    const tarangaBlock = user.tarangaBlock ? String(user.tarangaBlock).trim() : '';
    const tarangaRoom = user.tarangaRoom ? String(user.tarangaRoom).trim() : '';
    const sankeshwarBlock = user.sankeshwarBlock ? String(user.sankeshwarBlock).trim() : '';
    const sankeshwarRoom = user.sankeshwarRoom ? String(user.sankeshwarRoom).trim() : '';
    const girnarBlock = user.girnarBlock ? String(user.girnarBlock).trim() : '';
    const girnarRoom = user.girnarRoom ? String(user.girnarRoom).trim() : '';
    const palitanaBlock = user.palitanaBlock ? String(user.palitanaBlock).trim() : '';
    const palitanaRoom = user.palitanaRoom ? String(user.palitanaRoom).trim() : '';
    
    if (nakodaBlock) {
      ctx.fillText(nakodaBlock, POSITIONS.nakodaBlock.x, POSITIONS.nakodaBlock.y);
    }

    if (nakodaRoom) {
      ctx.fillText(nakodaRoom, POSITIONS.nakodaRoom.x, POSITIONS.nakodaRoom.y);
    }

    if (tarangaBlock) {
      ctx.fillText(tarangaBlock, POSITIONS.tarangaBlock.x, POSITIONS.tarangaBlock.y);
    }

    if (tarangaRoom) {
      ctx.fillText(tarangaRoom, POSITIONS.tarangaRoom.x, POSITIONS.tarangaRoom.y);
    }

    if (sankeshwarBlock) {
      ctx.fillText(sankeshwarBlock, POSITIONS.sankeshwarBlock.x, POSITIONS.sankeshwarBlock.y);
    }

    if (sankeshwarRoom) {
      ctx.fillText(sankeshwarRoom, POSITIONS.sankeshwarRoom.x, POSITIONS.sankeshwarRoom.y);
    }

    if (girnarBlock) {
      ctx.fillText(girnarBlock, POSITIONS.girnarBlock.x, POSITIONS.girnarBlock.y);
    }

    if (girnarRoom) {
      ctx.fillText(girnarRoom, POSITIONS.girnarRoom.x, POSITIONS.girnarRoom.y);
    }

    if (palitanaBlock) {
      ctx.fillText(palitanaBlock, POSITIONS.palitanaBlock.x, POSITIONS.palitanaBlock.y);
    }

    if (palitanaRoom) {
      ctx.fillText(palitanaRoom, POSITIONS.palitanaRoom.x, POSITIONS.palitanaRoom.y);
    }

    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error(`Error generating back card for ${user.id}:`, err.message);
    return null;
  }
}

// Generate front card without photo
// async function generateFrontCardNoPhoto(user, template) {
//   try {
//     const canvas = createCanvas(template.width, template.height);
//     const ctx = canvas.getContext('2d');
    
//     ctx.drawImage(template, 0, 0);
    
//     // Generate QR code
//     const qrBuffer = await generateQRCode(user.id);
//     if (qrBuffer) {
//       const qrImage = await loadImage(qrBuffer);
//       const { x, y, size } = POSITIONS.qrCode;
//       ctx.drawImage(qrImage, x, y, size, size);
//     }
    
//     // Draw text (same as regular front card)
//     ctx.fillStyle = '#E91E63';
    
//     ctx.textAlign = 'center';
//     ctx.font = 'bold 45px Arial';
//     ctx.fillText(user.id, POSITIONS.regNumber.x, POSITIONS.regNumber.y);
    
//     ctx.textAlign = 'left';
//     ctx.font = 'bold 35px Arial';
//     const formattedName = trimNameToLength(toTitleCase(user.fullName), 23);
//     ctx.fillText(formattedName || '', POSITIONS.name.x, POSITIONS.name.y);
    
//     const genderText = user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender;
//     ctx.fillText(genderText, POSITIONS.gender.x, POSITIONS.gender.y);
    
//     ctx.fillText(user.age || '', POSITIONS.age.x, POSITIONS.age.y);
//     ctx.fillText(user.phoneNumber || '', POSITIONS.phone.x, POSITIONS.phone.y);
    
//     ctx.textAlign = 'center';
//     ctx.font = 'bold 35px Arial';

//     const busNo = user.busNo ? String(user.busNo).trim() : '';
//     const tentNo = user.tentNo ? String(user.tentNo).trim() : '';

//     if (busNo) {
//       ctx.fillText(busNo, POSITIONS.busNumber.x, POSITIONS.busNumber.y);
//     }

//     if (tentNo) {
//       ctx.fillText(tentNo, POSITIONS.tentNumber.x, POSITIONS.tentNumber.y);
//     }
    
//     return canvas.toBuffer('image/png');
//   } catch (err) {
//     console.error(`Error generating front card (no photo) for ${user.id}:`, err.message);
//     return null;
//   }
// }

// Process a single user
async function processUser(user, frontTemplate, backTemplate) {
  try {
    const frontDir = `${OUTPUT_DIR}/luggagetags-front`;
    const backDir = `${OUTPUT_DIR}/luggagetags-back`;
    
    if (!fs.existsSync(frontDir)) {
      fs.mkdirSync(frontDir, { recursive: true });
    }
    if (!fs.existsSync(backDir)) {
      fs.mkdirSync(backDir, { recursive: true });
    }

    // Generate all card versions
    const [frontBuffer, backBuffer] = await Promise.all([
      generateFrontCard(user, frontTemplate),
      generateBackCard(user, backTemplate),
    ]);
    
    // Save all cards
    if (frontBuffer) {
      fs.writeFileSync(path.join(frontDir, `${user.id}_front.png`), frontBuffer);
    }
    if (backBuffer) {
      fs.writeFileSync(path.join(backDir, `${user.id}_back.png`), backBuffer);
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

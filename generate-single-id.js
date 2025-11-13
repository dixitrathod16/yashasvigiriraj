/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const QRCode = require('qrcode');

/**
 * Generate ID card for a single user (for testing)
 * Usage: node generate-single-id.js <USER_ID>
 * Example: node generate-single-id.js NAV1302
 */

// Configuration
const FRONT_TEMPLATE = './idFrontTemplate.png';
const BACK_TEMPLATE = './idBackTemplate.png';
const DATA_FILE = './ApprovedRegistrations.json';
const FILES_DIR = './files';
const OUTPUT_DIR = './test-output';

// Position configuration
const POSITIONS = {
  userPhoto: { x: 395, y: 652, width: 470, height: 560 },
  qrCode: { x: 85, y: 575, size: 200 },
  regNumber: { 
    x: 640, y: 1330,
    // box: { x: 450, y: 1280, width: 380, height: 80 } // Box around reg number
  },
  name: { 
    x: 310, y: 1470,
    // box: { x: 50, y: 1360, width: 500, height: 60 }
  },
  age: { 
    x: 1130, y: 1470,
    // box: { x: 900, y: 1360, width: 200, height: 60 }
  },
  gender: { 
    x: 310, y: 1580,
    // box: { x: 50, y: 1460, width: 300, height: 60 }
  },
  phone: { 
    x: 870, y: 1580,
    // box: { x: 700, y: 1460, width: 400, height: 60 }
  },
  busNumber: { 
    x: 440, y: 1725,
    // box: { x: 180, y: 1610, width: 200, height: 80 }
  },
  tentNumber: { 
    x: 1040, y: 1725,
    // box: { x: 900, y: 1610, width: 200, height: 80 }
  }
};

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error('Error: Please provide a user ID');
  console.error('Usage: node generate-single-id.js <USER_ID>');
  console.error('Example: node generate-single-id.js NAV1302');
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load user data
const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const user = users.find(u => u.id === userId);

if (!user) {
  console.error(`Error: User with ID "${userId}" not found`);
  console.error(`\nAvailable IDs (first 10):`);
  users.slice(0, 10).forEach(u => console.error(`  - ${u.id}: ${u.fullName}`));
  process.exit(1);
}

console.log(`\nGenerating ID card for:`);
console.log(`  ID: ${user.id}`);
console.log(`  Name: ${user.fullName}`);
console.log(`  Age: ${user.age}`);
console.log(`  Gender: ${user.gender}`);

// Helper function to convert name to title case
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get user photo path
function getUserPhotoPath(user) {
  if (user.idPhotoKey && user.idPhotoKey.trim() !== '') {
    const photoPath = path.join(FILES_DIR, user.idPhotoKey);
    console.log(`  Photo (idPhotoKey): ${photoPath}`);
    return photoPath;
  }
  if (user.photoKey && user.photoKey.trim() !== '') {
    const photoPath = path.join(FILES_DIR, user.photoKey);
    console.log(`  Photo (photoKey): ${photoPath}`);
    return photoPath;
  }
  console.log(`  Photo: Not found`);
  return null;
}

// Generate QR code
async function generateQRCode(text) {
  try {
    return await QRCode.toBuffer(text, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
}

// Generate front card
async function generateFrontCard(user, templatePath) {
  try {
    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(template, 0, 0);
    
    // Load and draw user photo (cover mode - fills entire area)
    const photoPath = getUserPhotoPath(user);
    if (photoPath && fs.existsSync(photoPath)) {
      try {
        const userPhoto = await loadImage(photoPath);
        const { x, y, width, height } = POSITIONS.userPhoto;
        
        const imgAspect = userPhoto.width / userPhoto.height;
        const boxAspect = width / height;
        
        let sourceX = 0, sourceY = 0, sourceWidth = userPhoto.width, sourceHeight = userPhoto.height;
        
        // Cover mode: Fill entire area, crop if needed
        if (imgAspect > boxAspect) {
          // Image is wider - crop sides
          sourceHeight = userPhoto.height;
          drurceWidth = sourceHeight * boxAspect;
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
        
        console.log(`  ✓ Photo loaded and positioned (cover mode)`);
      } catch (err) {
        console.log(`  ✗ Could not load photo: ${err.message}`);
      }
    }
    
    // Generate and draw QR code
    const qrBuffer = await generateQRCode(user.id);
    if (qrBuffer) {
      const qrImage = await loadImage(qrBuffer);
      const { x, y, size } = POSITIONS.qrCode;
      ctx.drawImage(qrImage, x, y, size, size);
      console.log(`  ✓ QR code generated`);
    }
    
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
    ctx.fillText(user.busNumber || '12', POSITIONS.busNumber.x, POSITIONS.busNumber.y);
    ctx.fillText(user.tentNumber || '31', POSITIONS.tentNumber.x, POSITIONS.tentNumber.y);
    
    console.log(`  ✓ Text and icons rendered`);
    
    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error(`Error generating front card:`, err);
    return null;
  }
}

// Generate back card
async function generateBackCard(user, templatePath) {
  try {
    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(template, 0, 0);
    
    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error(`Error generating back card:`, err);
    return null;
  }
}

// Main function
async function generateCard() {
  try {
    console.log(`\nGenerating cards...`);
    
    const frontBuffer = await generateFrontCard(user, FRONT_TEMPLATE);
    if (frontBuffer) {
      const frontPath = path.join(OUTPUT_DIR, `${user.id}_front.png`);
      fs.writeFileSync(frontPath, frontBuffer);
      console.log(`\n✓ Front card saved: ${frontPath}`);
    }
    
    const backBuffer = await generateBackCard(user, BACK_TEMPLATE);
    if (backBuffer) {
      const backPath = path.join(OUTPUT_DIR, `${user.id}_back.png`);
      fs.writeFileSync(backPath, backBuffer);
      console.log(`✓ Back card saved: ${backPath}`);
    }
    
    console.log(`\nDone! Check the ${OUTPUT_DIR} folder.`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

generateCard();

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

const FRONT_TEMPLATE = './idTemplates/tag-01.jpg';
const BACK_TEMPLATE = './idTemplates/tag-02.jpg';
const DATA_FILE = './data-imports/fullSanghApprovedRegistrations.json';
const FILES_DIR = './files';
const OUTPUT_DIR = './testOutput/full-sangh-id/tags';

// Position configuration
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
  str = str.toString();
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to trim name to max 23 characters by removing words from the end
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
    ctx.fillText(user.busNo || '12', POSITIONS.busNumber.x, POSITIONS.busNumber.y);
    ctx.fillText(user.tentNo || '31', POSITIONS.tentNumber.x, POSITIONS.tentNumber.y);
    
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

    ctx.fillStyle = '#E91E63';
    
    // Registration Number (centered)
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(user.id, POSITIONS.backRegNumber.x, POSITIONS.backRegNumber.y);

    // Nakoda Block
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px Arial';


    ctx.fillStyle = '#E91E63';
    ctx.fillText(String(user.nakodaBlock).trim() || '', POSITIONS.nakodaBlock.x, POSITIONS.nakodaBlock.y);
    ctx.fillText(String(user.nakodaRoom).trim() || '', POSITIONS.nakodaRoom.x, POSITIONS.nakodaRoom.y);
    ctx.fillText(String(user.tarangaBlock).trim() || '', POSITIONS.tarangaBlock.x, POSITIONS.tarangaBlock.y);
    ctx.fillText(String(user.tarangaRoom).trim() || '', POSITIONS.tarangaRoom.x, POSITIONS.tarangaRoom.y);
    ctx.fillText(String(user.sankeshwarBlock).trim() || '', POSITIONS.sankeshwarBlock.x, POSITIONS.sankeshwarBlock.y);
    ctx.fillText(String(user.sankeshwarRoom).trim() || '', POSITIONS.sankeshwarRoom.x, POSITIONS.sankeshwarRoom.y);
    ctx.fillText(String(user.girnarBlock).trim() || '', POSITIONS.girnarBlock.x, POSITIONS.girnarBlock.y);
    ctx.fillText(String(user.girnarRoom).trim() || '', POSITIONS.girnarRoom.x, POSITIONS.girnarRoom.y);
    ctx.fillText(String(user.palitanaBlock).trim() || '', POSITIONS.palitanaBlock.x, POSITIONS.palitanaBlock.y);
    ctx.fillText(String(user.palitanaRoom).trim() || '', POSITIONS.palitanaRoom.x, POSITIONS.palitanaRoom.y);
    
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

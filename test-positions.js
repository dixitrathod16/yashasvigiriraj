/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * Test script to help find correct positions for text and images on your template
 * This generates a test card with grid lines and position markers
 */

const TEMPLATE_PATH = './idTemplates/fullSanghFrontTemplate.jpg'; // Update with your template path
const OUTPUT_PATH = './test-id-card.png';

// Position configuration (must match generate-single-id.js)
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

async function generateTestCard() {
  try {
    console.log('Loading template...');
    const template = await loadImage(TEMPLATE_PATH);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    
    // Draw template
    ctx.drawImage(template, 0, 0);
    
    // Draw grid lines (every 50 pixels)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      // Label every 100 pixels
      if (x % 100 === 0) {
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';
        ctx.fillText(x.toString(), x + 2, 15);
      }
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      
      // Label every 100 pixels
      if (y % 100 === 0) {
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';
        ctx.fillText(y.toString(), 2, y + 12);
      }
    }
    
    // Draw sample rectangles for photo and QR code positions
    // Photo area
    const photoPos = POSITIONS.userPhoto;
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 5;
    ctx.strokeRect(photoPos.x, photoPos.y, photoPos.width, photoPos.height);
    ctx.fillStyle = 'blue';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('PHOTO AREA', photoPos.x + 100, photoPos.y - 20);
    ctx.fillText(`(${photoPos.x}, ${photoPos.y}, ${photoPos.width}x${photoPos.height})`, 
                 photoPos.x + 50, photoPos.y + photoPos.height + 40);
    
    // QR code area
    const qrPos = POSITIONS.qrCode;
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 5;
    ctx.strokeRect(qrPos.x, qrPos.y, qrPos.size, qrPos.size);
    ctx.fillStyle = 'green';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('QR CODE', qrPos.x + 20, qrPos.y - 20);
    ctx.fillText(`(${qrPos.x}, ${qrPos.y}, ${qrPos.size}x${qrPos.size})`, 
                 qrPos.x - 50, qrPos.y + qrPos.size + 40);
    
    // Draw sample text positions
    const textPositions = [
      { label: 'Reg No.', pos: POSITIONS.regNumber, align: 'center', color: '#E91E63' },
      { label: 'Name', pos: POSITIONS.name, align: 'left', color: '#E91E63' },
      { label: 'Age', pos: POSITIONS.age, align: 'left', color: '#E91E63' },
      { label: 'Gender', pos: POSITIONS.gender, align: 'left', color: '#E91E63' },
      { label: 'Phone', pos: POSITIONS.phone, align: 'left', color: '#E91E63' },
      { label: 'Bus No.', pos: POSITIONS.busNumber, align: 'center', color: '#E91E63' },
      { label: 'Tent No.', pos: POSITIONS.tentNumber, align: 'center', color: '#E91E63' }
    ];
    
    textPositions.forEach(item => {
      const { x, y } = item.pos;
      
      // Draw crosshair
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + 20, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
      
      // Draw label above
      ctx.fillStyle = 'orange';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.label} (${x},${y})`, x, y - 30);
      
      // Draw sample text with correct alignment
      ctx.fillStyle = item.color;
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = item.align;
      ctx.fillText(item.label, x, y);
    });
    
    // Save test card
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(OUTPUT_PATH, buffer);
    
    console.log(`\n✓ Test card generated successfully!`);
    console.log(`  Output: ${OUTPUT_PATH}`);
    console.log(`  Template size: ${template.width}x${template.height}`);
    console.log(`\nInstructions:`);
    console.log(`1. Open ${OUTPUT_PATH} in an image viewer`);
    console.log(`2. Use the grid lines and coordinates to find exact positions`);
    console.log(`3. Update the POSITIONS object in generate-id-cards.js`);
    console.log(`4. Run this test again to verify positions`);
    
  } catch (err) {
    console.error('Error generating test card:', err);
    console.error('\nMake sure:');
    console.error(`1. Template file exists at: ${TEMPLATE_PATH}`);
    console.error(`2. canvas and qrcode packages are installed`);
  }
}

generateTestCard();

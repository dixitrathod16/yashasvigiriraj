/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * Test script to help find correct positions for text and images on your template
 * This generates a test card with grid lines and position markers
 */

const TEMPLATE_PATH = './idFrontTemplate.png'; // Update with your template path
const OUTPUT_PATH = './test-id-card.png';

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
    // Photo area (adjust these coordinates)
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 320, 230, 280);
    ctx.fillStyle = 'blue';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('PHOTO AREA', 250, 310);
    ctx.fillText('(200, 320, 230x280)', 220, 615);
    
    // QR code area (adjust these coordinates)
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 290, 140, 140);
    ctx.fillStyle = 'green';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('QR CODE', 75, 280);
    ctx.fillText('(45, 290, 140x140)', 50, 445);
    
    // Draw sample text positions
    const textPositions = [
      { label: 'Reg No.', x: 315, y: 660, color: '#E91E63' },
      { label: 'Name', x: 200, y: 730, color: '#E91E63' },
      { label: 'Age', x: 570, y: 730, color: '#E91E63' },
      { label: 'Gender', x: 200, y: 785, color: '#E91E63' },
      { label: 'Phone', x: 520, y: 785, color: '#E91E63' },
      { label: 'Bus No.', x: 150, y: 855, color: '#E91E63' },
      { label: 'Tent No.', x: 480, y: 855, color: '#E91E63' }
    ];
    
    textPositions.forEach(pos => {
      // Draw crosshair
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x - 10, pos.y);
      ctx.lineTo(pos.x + 10, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 10);
      ctx.lineTo(pos.x, pos.y + 10);
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'orange';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${pos.label} (${pos.x},${pos.y})`, pos.x, pos.y - 15);
      
      // Draw sample text
      ctx.fillStyle = pos.color;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pos.label, pos.x, pos.y);
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

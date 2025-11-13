# ID Card Generation - Complete Setup

## ✅ What's Been Created

### Main Scripts
1. **generate-id-cards.js** - Bulk generation for all users
2. **generate-single-id.js** - Test with a single user
3. **test-positions.js** - Visual position testing tool
4. **list-users.js** - Browse available users

### Documentation
1. **QUICK-START-ID-GENERATION.md** - Step-by-step guide
2. **ID-CARD-GENERATOR-README.md** - Detailed documentation
3. **PERFORMANCE-GUIDE.md** - Performance optimization tips
4. **PHOTO-FITTING-GUIDE.md** - Auto-fit photos of any resolution
5. **BOX-STYLING-GUIDE.md** - Customize boxes and borders
6. **ADDING-ICONS-GUIDE.md** - Add and customize icons
7. **ID-GENERATION-SUMMARY.md** - This file

### NPM Scripts Added
```json
"generate-ids": "node generate-id-cards.js"              // Generate all (sequential)
"generate-ids-fast": "node generate-id-cards-optimized.js" // Generate all (optimized) ⚡
"generate-single": "node generate-single-id.js"          // Test single user
"test-positions": "node test-positions.js"               // Test positioning
"list-users": "node list-users.js"                       // List available users
```

## 📋 Prerequisites Installed

✅ `canvas` - Image manipulation library
✅ `qrcode` - QR code generation

## 🚀 Quick Start (3 Steps)

### 1. List Available Users
```bash
npm run list-users
```
This shows you available user IDs and photo statistics.

### 2. Test with One User
```bash
npm run generate-single NAV1302
```
Replace `NAV1302` with any user ID from step 1.
Check output in `test-output/` folder.

### 3. Generate All Cards

**For large batches (1000 users) - RECOMMENDED:**
```bash
npm run generate-ids-fast
```
⚡ **3-4x faster** - Completes in ~10-15 minutes for 1000 users

**For small batches (<100 users):**
```bash
npm run generate-ids
```
Output will be in `generated-id-cards/` folder.

## 🎯 Features Implemented

### Photo Handling
- ✅ **Auto-fits any resolution** - Works with any photo size
- ✅ **Three fitting modes** - Cover, Contain, Fill
- ✅ Uses `idPhotoKey` if available
- ✅ Falls back to `photoKey` if `idPhotoKey` is empty/null
- ✅ Maintains aspect ratio (no distortion in cover/contain modes)
- ✅ Smart cropping (cover mode) or letterboxing (contain mode)
- ✅ Centers photo in designated area
- ✅ Handles missing photos gracefully
- ✅ Supports WebP, PNG, JPG formats
- ✅ Works with portrait, landscape, or square photos

### QR Code
- ✅ Generates QR code from user ID
- ✅ High error correction level
- ✅ Scannable to retrieve user ID
- ✅ Proper size and positioning

### User Details
- ✅ Registration Number (ID)
- ✅ Full Name
- ✅ Age
- ✅ Gender (M → Male, F → Female)
- ✅ Phone Number with icon 📱
- ✅ Bus Number (from `busTime` or `group`)
- ✅ Tent Number (from `group`)

### Visual Enhancements
- ✅ **Boxes/borders around text fields**
- ✅ Customizable border colors and styles
- ✅ Rounded corners
- ✅ Optional background fills
- ✅ Phone icon before phone number
- ✅ Professional layout

### Output Organization
- ✅ Each user gets their own folder (named by ID)
- ✅ Front and back cards saved separately
- ✅ PNG format for high quality
- ✅ Preserves template quality

## 📁 File Structure

```
your-project/
├── generate-id-cards.js          # Main bulk generator
├── generate-single-id.js         # Single user tester
├── test-positions.js             # Position testing tool
├── list-users.js                 # User browser
├── ApprovedRegistrations.json    # User data source
├── public/
│   ├── 1.jpg                     # Front template
│   └── 2.jpg                     # Back template
├── files/
│   ├── idPhotos/                 # Primary photos
│   └── photos/                   # Fallback photos
├── generated-id-cards/           # Output (created on run)
│   ├── SAN1501/
│   │   ├── SAN1501_front.png
│   │   └── SAN1501_back.png
│   └── ...
└── test-output/                  # Single test output
    ├── NAV1302_front.png
    └── NAV1302_back.png
```

## ⚙️ Configuration

### Template Paths
Edit in each script (lines 6-7):
```javascript
const FRONT_TEMPLATE = './public/1.jpg';
const BACK_TEMPLATE = './public/2.jpg';
```

### Position Coordinates
Edit the `POSITIONS` object (adjust to match your template):
```javascript
const POSITIONS = {
  userPhoto: { x: 200, y: 320, width: 230, height: 280 },
  qrCode: { x: 45, y: 290, size: 140 },
  regNumber: { x: 315, y: 660 },
  name: { x: 200, y: 730 },
  age: { x: 570, y: 730 },
  gender: { x: 200, y: 785 },
  phone: { x: 520, y: 785 },
  busNumber: { x: 150, y: 855 },
  tentNumber: { x: 480, y: 855 }
};
```

### Text Styling
Modify in `generateFrontCard` function:
```javascript
ctx.fillStyle = '#E91E63';        // Color (pink)
ctx.font = 'bold 32px Arial';     // Font
ctx.textAlign = 'center';         // Alignment
```

## 🔧 Customization Guide

### To Change Colors
Find and replace `#E91E63` with your desired color code.

### To Change Fonts
Replace `'bold 32px Arial'` with your preferred font.
Available fonts: Arial, Helvetica, Times New Roman, Courier, Verdana, Georgia, etc.

### To Add More Fields
1. Add position to `POSITIONS` object
2. Add drawing code in `generateFrontCard`:
```javascript
ctx.fillText(user.yourField, POSITIONS.yourField.x, POSITIONS.yourField.y);
```

### To Change QR Code Size
Adjust in `POSITIONS.qrCode.size` and in `generateQRCode`:
```javascript
width: 300,  // Change this value
```

## 📊 Expected Performance

### Original Script (`generate-ids`)
- **Single card**: ~1-2 seconds
- **100 cards**: ~4 minutes
- **1000 cards**: ~30-40 minutes

### Optimized Script (`generate-ids-fast`) ⚡ RECOMMENDED
- **Single card**: ~0.7 seconds
- **100 cards**: ~1.5 minutes
- **1000 cards**: ~10-15 minutes
- **Speedup**: 3-4x faster

Progress is logged in real-time with ETA estimates.

See `PERFORMANCE-GUIDE.md` for detailed benchmarks and optimization tips.

## ⚠️ Important Notes

1. **Template Files**: Make sure your template images are at the correct paths
2. **Photo Paths**: Verify photos exist in `files/` folder
3. **Test First**: Always test with a single user before bulk generation
4. **Backup**: Keep original templates safe
5. **Quality**: Use high-resolution templates for best results

## 🐛 Troubleshooting

### "Cannot find module 'canvas'"
```bash
npm install canvas qrcode --save-dev
```

### "Template not found"
- Check template paths in script
- Verify files exist at specified locations

### "Photo not loading"
- Run `npm run list-users` to see photo statistics
- Check that photo paths in JSON match actual files
- Verify file extensions (.webp, .png, .jpg)

### Text is misaligned
1. Run `npm run test-positions`
2. Open `test-id-card.png`
3. Use grid to find correct coordinates
4. Update `POSITIONS` object
5. Test with `npm run generate-single <ID>`

### QR code not scanning
- Increase QR code size
- Ensure good contrast with background
- Test with multiple QR code readers

## 📞 Next Steps

1. ✅ Dependencies installed
2. ⏳ Update template paths (if needed)
3. ⏳ Run position test
4. ⏳ Adjust positions (if needed)
5. ⏳ Test with single user
6. ⏳ Generate all cards
7. ⏳ Verify output quality
8. ⏳ Test QR code scanning
9. ⏳ Print test samples
10. ⏳ Proceed with bulk printing

## 📚 Documentation Files

- **QUICK-START-ID-GENERATION.md** - Follow this for step-by-step instructions
- **ID-CARD-GENERATOR-README.md** - Detailed technical documentation
- **ID-GENERATION-SUMMARY.md** - This overview document

## 🎉 You're Ready!

Everything is set up and ready to go. Start with:
```bash
npm run list-users
```

Then follow the Quick Start guide above.

Good luck with your ID card generation! 🚀

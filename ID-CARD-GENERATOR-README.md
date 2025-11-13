# ID Card Generator

This script generates ID cards for all approved registrations from the `ApprovedRegistrations.json` file.

## Prerequisites

The required dependencies have been installed:
- `canvas` - For image manipulation
- `qrcode` - For QR code generation

## Setup

1. **Template Images**: Place your ID card template images in the `public` folder:
   - Front template: `public/1.jpg` (or update path in script)
   - Back template: `public/2.jpg` (or update path in script)

2. **User Photos**: Ensure user photos are in the `files` folder with the structure:
   - `files/idPhotos/` - Primary photo location
   - `files/photos/` - Fallback photo location

## Configuration

Edit `generate-id-cards.js` to adjust:

1. **Template paths** (lines 6-7):
   ```javascript
   const FRONT_TEMPLATE = './public/1.jpg';
   const BACK_TEMPLATE = './public/2.jpg';
   ```

2. **Position coordinates** (lines 12-22) - Adjust these to match your template layout:
   ```javascript
   const POSITIONS = {
     userPhoto: { x: 200, y: 320, width: 230, height: 280 },
     qrCode: { x: 45, y: 290, size: 140 },
     regNumber: { x: 315, y: 660 },
     // ... etc
   };
   ```

3. **Text styling** - Modify font, size, and color in the `generateFrontCard` function

## Usage

Run the script:

```bash
node generate-id-cards.js
```

Or use the npm script:

```bash
npm run generate-ids
```

## Output

Generated ID cards will be saved in the `generated-id-cards` folder with the following structure:

```
generated-id-cards/
├── SAN1501/
│   ├── SAN1501_front.png
│   └── SAN1501_back.png
├── NAV1302/
│   ├── NAV1302_front.png
│   └── NAV1302_back.png
└── ...
```

Each user gets their own folder named with their ID, containing:
- `{ID}_front.png` - Front side with photo, QR code, and details
- `{ID}_back.png` - Back side with pilgrimage information

## Features

- **QR Code**: Automatically generated from user ID, scannable to retrieve the ID
- **Photo Fallback**: Uses `idPhotoKey` if available, otherwise falls back to `photoKey`
- **Aspect Ratio Preservation**: User photos are fitted properly without distortion
- **Error Handling**: Continues processing even if individual photos are missing
- **Progress Logging**: Shows real-time progress and summary

## Troubleshooting

### Photos not appearing
- Check that the photo paths in JSON match actual files in `files` folder
- Verify file extensions (.webp, .png, .jpg) match

### QR codes not generating
- Ensure the `qrcode` package is installed
- Check that user IDs are valid strings

### Text positioning is off
- Adjust the `POSITIONS` object coordinates
- Use an image editor to find exact pixel positions on your template

### Template not loading
- Verify template file paths are correct
- Ensure template images exist in the specified location

## Customization

To customize the appearance:

1. **Colors**: Change `ctx.fillStyle` values (currently `#E91E63` for pink)
2. **Fonts**: Modify `ctx.font` values (e.g., `'bold 32px Arial'`)
3. **Text alignment**: Adjust `ctx.textAlign` (`'center'`, `'left'`, `'right'`)
4. **Additional fields**: Add more user data by following the existing pattern

## Performance

Processing time depends on:
- Number of users (~1000+ users)
- Image sizes
- System resources

Expected: ~1-2 seconds per ID card

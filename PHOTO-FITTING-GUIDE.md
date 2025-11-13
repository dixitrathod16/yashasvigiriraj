# Photo Auto-Fitting Guide

The ID card generator now includes intelligent photo fitting that automatically adjusts any photo resolution to fit perfectly in the designated area.

## ✅ Features

- **Auto-fit any resolution** - Works with any photo size (portrait, landscape, square)
- **Three fitting modes** - Choose how photos should be fitted
- **No manual resizing needed** - Photos are processed automatically
- **Maintains quality** - Smart cropping and scaling
- **Handles all formats** - WebP, PNG, JPG, JPEG

## Fitting Modes

### 1. Cover Mode (Default) ⭐ RECOMMENDED

```javascript
const PHOTO_FIT_MODE = 'cover';
```

**How it works:**
- Fills the entire photo area
- Crops excess parts if needed
- No distortion
- No empty space

**Best for:**
- Professional ID cards
- Consistent appearance
- When you want all photos to fill the frame

**Example:**
```
Original: 1200x1600 (portrait)
Box: 400x500
Result: Photo fills entire 400x500, top/bottom may be cropped
```

**Visual:**
```
┌─────────────┐
│   ┌─────┐   │  Original photo
│   │     │   │  (taller than box)
│   │     │   │
│   │ ▓▓▓ │   │  ← Visible area (fits box)
│   │ ▓▓▓ │   │
│   │ ▓▓▓ │   │
│   │     │   │
│   │     │   │  ← Cropped (not visible)
│   └─────┘   │
└─────────────┘
```

### 2. Contain Mode

```javascript
const PHOTO_FIT_MODE = 'contain';
```

**How it works:**
- Shows entire photo
- May have empty space (letterboxing)
- No distortion
- No cropping

**Best for:**
- When you must show the entire photo
- Artistic/creative layouts
- When cropping is not acceptable

**Example:**
```
Original: 1600x1200 (landscape)
Box: 400x500
Result: Photo fits width (400px), empty space top/bottom
```

**Visual:**
```
┌─────────────┐
│ ░░░░░░░░░░░ │  ← Empty space
│ ┌─────────┐ │
│ │ ▓▓▓▓▓▓▓ │ │  ← Entire photo visible
│ │ ▓▓▓▓▓▓▓ │ │
│ └─────────┘ │
│ ░░░░░░░░░░░ │  ← Empty space
└─────────────┘
```

### 3. Fill Mode

```javascript
const PHOTO_FIT_MODE = 'fill';
```

**How it works:**
- Stretches photo to fill area
- May distort the image
- No cropping
- No empty space

**Best for:**
- When exact dimensions are critical
- Testing purposes
- Special cases only

**Example:**
```
Original: 1200x1200 (square)
Box: 400x500
Result: Photo stretched to 400x500 (distorted)
```

**Visual:**
```
┌─────────────┐
│ ┌─────────┐ │
│ │ ▓▓▓▓▓▓▓ │ │  ← Photo stretched
│ │ ▓▓▓▓▓▓▓ │ │     (may look distorted)
│ │ ▓▓▓▓▓▓▓ │ │
│ └─────────┘ │
└─────────────┘
```

## Configuration

### In Single Test Script (`generate-single-id-new.js`)

```javascript
// Near the top of the file
const PHOTO_FIT_MODE = 'cover'; // Change this
```

### In Bulk Generation Script (`generate-id-cards-optimized.js`)

```javascript
// Near the top of the file
const PHOTO_FIT_MODE = 'cover'; // Change this
```

## Comparison Table

| Mode | Distortion | Cropping | Empty Space | Best Use |
|------|-----------|----------|-------------|----------|
| **cover** | ❌ No | ✅ Yes | ❌ No | Professional IDs |
| **contain** | ❌ No | ❌ No | ✅ Yes | Show full photo |
| **fill** | ⚠️ Yes | ❌ No | ❌ No | Special cases |

## Real-World Examples

### Example 1: Portrait Photo (Tall)
```
Original: 1200x1600 pixels (3:4 ratio)
Box: 400x500 pixels (4:5 ratio)

Cover:   Fills 400x500, crops top/bottom slightly
Contain: Shows full photo, empty space on sides
Fill:    Stretches to 400x500, slight distortion
```

### Example 2: Landscape Photo (Wide)
```
Original: 1600x1200 pixels (4:3 ratio)
Box: 400x500 pixels (4:5 ratio)

Cover:   Fills 400x500, crops left/right significantly
Contain: Shows full photo, empty space top/bottom
Fill:    Stretches to 400x500, significant distortion
```

### Example 3: Square Photo
```
Original: 1200x1200 pixels (1:1 ratio)
Box: 400x500 pixels (4:5 ratio)

Cover:   Fills 400x500, crops top/bottom
Contain: Shows full photo, empty space top/bottom
Fill:    Stretches to 400x500, vertical stretch
```

### Example 4: Perfect Match
```
Original: 800x1000 pixels (4:5 ratio)
Box: 400x500 pixels (4:5 ratio)

All modes: Perfect fit, just scaled down
```

## Testing Different Modes

1. **Edit the configuration:**
```javascript
const PHOTO_FIT_MODE = 'cover'; // Try: 'cover', 'contain', 'fill'
```

2. **Test with a single user:**
```bash
npm run generate-single NAV1302
```

3. **Check the output:**
```bash
open test-output/NAV1302_front.png
```

4. **Compare results:**
- Try all three modes
- See which looks best for your photos
- Choose the mode that works for most photos

## Recommendations by Photo Type

### Professional Headshots
```javascript
const PHOTO_FIT_MODE = 'cover';
```
✅ Best choice - fills frame, looks professional

### Full Body Photos
```javascript
const PHOTO_FIT_MODE = 'contain';
```
✅ Shows entire person, no cropping

### Mixed Photo Types
```javascript
const PHOTO_FIT_MODE = 'cover';
```
✅ Most consistent appearance across all cards

### Passport-Style Photos
```javascript
const PHOTO_FIT_MODE = 'cover';
```
✅ Standard for ID cards

## Handling Different Resolutions

The system automatically handles:

| Resolution | Orientation | Result |
|------------|-------------|--------|
| 640x480 | Landscape | ✅ Auto-fitted |
| 1920x1080 | Landscape | ✅ Auto-fitted |
| 1080x1920 | Portrait | ✅ Auto-fitted |
| 3024x4032 | Portrait (iPhone) | ✅ Auto-fitted |
| 4000x3000 | Landscape (DSLR) | ✅ Auto-fitted |
| 1200x1200 | Square | ✅ Auto-fitted |
| 300x400 | Small | ✅ Auto-fitted |
| 6000x4000 | Large | ✅ Auto-fitted |

## Advanced: Custom Cropping

If you need more control over cropping (e.g., focus on face), you can modify the code:

### Center-Weighted Crop (Focus on Center)
Already implemented in 'cover' mode - crops equally from all sides.

### Top-Weighted Crop (Focus on Top)
For headshots where face is at top:

```javascript
// In the 'cover' mode section, change:
sourceY = 0; // Instead of: (userPhoto.height - sourceHeight) / 2
```

### Bottom-Weighted Crop
```javascript
sourceY = userPhoto.height - sourceHeight;
```

### Left-Weighted Crop
```javascript
sourceX = 0;
```

### Right-Weighted Crop
```javascript
sourceX = userPhoto.width - sourceWidth;
```

## Troubleshooting

### Photos look stretched
- You're using 'fill' mode
- Switch to 'cover' or 'contain'

### Photos are cropped too much
- You're using 'cover' mode with very different aspect ratios
- Switch to 'contain' mode
- Or adjust the photo box size in POSITIONS

### Empty space around photos
- You're using 'contain' mode
- Switch to 'cover' mode
- Or add a background color to the photo area

### Photos look pixelated
- Original photos are too small
- Use higher resolution source photos
- Minimum recommended: 800x1000 pixels

### Photos are too large (file size)
- Compress photos before processing
- Use WebP format (smaller file size)
- Reduce resolution to 1200x1600 (sufficient for ID cards)

## Performance Impact

| Mode | Processing Speed | Quality |
|------|-----------------|---------|
| cover | Fast | Excellent |
| contain | Fast | Excellent |
| fill | Fastest | May vary |

All modes have minimal performance impact. The difference is negligible for batch processing.

## Best Practices

1. **Use 'cover' mode** for most ID cards
2. **Collect photos in portrait orientation** (3:4 or 4:5 ratio)
3. **Minimum resolution**: 800x1000 pixels
4. **Recommended resolution**: 1200x1600 pixels
5. **Maximum resolution**: 4000x5000 pixels (larger is unnecessary)
6. **File format**: WebP or JPG (PNG for transparency)
7. **File size**: Keep under 2MB per photo

## Quick Reference

```javascript
// Professional ID cards (recommended)
const PHOTO_FIT_MODE = 'cover';

// Show entire photo (may have empty space)
const PHOTO_FIT_MODE = 'contain';

// Stretch to fit (may distort)
const PHOTO_FIT_MODE = 'fill';
```

## Summary

The photo auto-fitting feature ensures that:
- ✅ Any photo resolution works
- ✅ No manual resizing needed
- ✅ Consistent appearance across all cards
- ✅ Professional results
- ✅ Easy to configure

Choose 'cover' mode for best results with ID cards! 📸

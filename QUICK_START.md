# Quick Start Guide - ID Photo Processor

## 🚀 Get Started in 30 Seconds

### 1. Basic Processing (No Background Removal)
```bash
node process-id-photos.js
```
**Result:** Optimized ID photos with face detection, cropping, and rotation correction.

### 2. With White Background (Recommended for Official IDs)
```bash
node process-id-photos.js --remove-bg
```
**Result:** Professional ID photos with white background, perfect for passports and official documents.

### 3. With Blue Background (Corporate Style)
```bash
node process-id-photos.js --remove-bg --bg-color blue
```
**Result:** Corporate-style ID photos with professional blue background.

## 📋 Common Commands

### Official Documents (Passport, Driver's License)
```bash
node process-id-photos.js --remove-bg --bg-color white
```

### Employee IDs
```bash
node process-id-photos.js --remove-bg --bg-color blue
```

### Student IDs
```bash
node process-id-photos.js --remove-bg --bg-color lightblue
```

### Custom Setup
```bash
node process-id-photos.js \
  --input ./my-photos \
  --output ./processed \
  --remove-bg \
  --bg-color "#d4e6f1" \
  --size 800
```

## 🎨 Background Colors

| Color | Command | Best For |
|-------|---------|----------|
| White | `--bg-color white` | Official documents |
| Blue | `--bg-color blue` | Corporate IDs |
| Light Blue | `--bg-color lightblue` | Modern style |
| Gray | `--bg-color gray` | Neutral professional |
| Custom | `--bg-color "#rrggbb"` | Brand colors |

## ⚙️ Options

| Option | Example | Description |
|--------|---------|-------------|
| `--input` | `--input ./photos` | Input folder |
| `--output` | `--output ./processed` | Output folder |
| `--size` | `--size 800` | Image size (pixels) |
| `--face-ratio` | `--face-ratio 0.55` | Face size (0-1) |
| `--remove-bg` | `--remove-bg` | Enable background removal |
| `--bg-color` | `--bg-color blue` | Background color |

## 📊 What You Get

- ✅ **Face Detection:** Automatic ML-based detection
- ✅ **Perfect Framing:** 50% face ratio with full head visible
- ✅ **Auto-Rotation:** Straightens tilted faces
- ✅ **Background Removal:** ML-powered (optional)
- ✅ **Custom Colors:** White, blue, or any hex color
- ✅ **High Quality:** 95% JPEG quality, 600x600px
- ✅ **Batch Processing:** Handles multiple images
- ✅ **Progress Tracking:** Real-time status updates

## 🎯 Quick Tips

1. **For best results:** Use well-lit photos with clear faces
2. **Background removal:** Adds 3-5 seconds per image (worth it!)
3. **Face ratio:** 0.50 is optimal for most ID photos
4. **Output size:** 600px is standard, use 800px for higher quality
5. **Batch processing:** The script handles errors gracefully

## 📁 Default Folders

- **Input:** `./files/idPhotos/`
- **Output:** `./processed/photos/`

## 🔍 Check Results

After processing, check:
```bash
ls -lh ./processed/photos/
```

## 📚 Need More Help?

- **Full Guide:** See `BACKGROUND_REMOVAL_GUIDE.md`
- **Technical Details:** See `FINAL_IMPLEMENTATION_SUMMARY.md`
- **Optimizations:** See `OPTIMIZATION_SUMMARY.md`

## 🎉 That's It!

You're ready to create professional ID photos. Start with:
```bash
node process-id-photos.js --remove-bg
```

Enjoy your professional-quality ID photos! 🎨✨

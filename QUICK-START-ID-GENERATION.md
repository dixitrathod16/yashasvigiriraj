# Quick Start Guide - ID Card Generation

## Step 1: Verify Template Files

Make sure you have your template images ready:
- Front template: `public/1.jpg` (or update the path in scripts)
- Back template: `public/2.jpg` (or update the path in scripts)

## Step 2: Test Position Alignment (Recommended)

Run the position test to see grid lines and current position markers:

```bash
npm run test-positions
```

This creates `test-id-card.png` with:
- Grid lines every 50 pixels
- Coordinate labels
- Boxes showing where photo and QR code will be placed
- Markers showing where text will appear

Open `test-id-card.png` and verify the positions match your template layout.

## Step 3: Adjust Positions (If Needed)

If positions don't match your template, edit the `POSITIONS` object in:
- `generate-id-cards.js` (for bulk generation)
- `generate-single-id.js` (for single test)
- `test-positions.js` (for position testing)

Example:
```javascript
const POSITIONS = {
  userPhoto: { x: 200, y: 320, width: 230, height: 280 },  // Adjust these
  qrCode: { x: 45, y: 290, size: 140 },                     // Adjust these
  regNumber: { x: 315, y: 660 },                            // Adjust these
  // ... etc
};
```

## Step 4: Test with Single User

Before generating all cards, test with one user:

```bash
npm run generate-single NAV1302
```

Replace `NAV1302` with any valid user ID from your data.

This creates test cards in `test-output/` folder:
- `NAV1302_front.png`
- `NAV1302_back.png`

Check these carefully to ensure:
- ✓ Photo is positioned correctly
- ✓ QR code is in the right place
- ✓ All text is readable and properly aligned
- ✓ Colors and fonts look good

## Step 5: Generate All ID Cards

Once you're happy with the test output, generate all cards:

```bash
npm run generate-ids
```

This will:
- Process all users from `ApprovedRegistrations.json`
- Create a folder for each user ID
- Generate front and back cards for each user
- Save everything in `generated-id-cards/` folder

## Output Structure

```
generated-id-cards/
├── SAN1501/
│   ├── SAN1501_front.png
│   └── SAN1501_back.png
├── NAV1302/
│   ├── NAV1302_front.png
│   └── NAV1302_back.png
├── NAV1303/
│   ├── NAV1303_front.png
│   └── NAV1303_back.png
└── ... (all other users)
```

## Troubleshooting

### "Template not found" error
- Check that template files exist at the specified paths
- Update paths in the script if needed

### Photos not showing
- Verify photos exist in `files/idPhotos/` or `files/photos/`
- Check that `idPhotoKey` or `photoKey` in JSON matches actual file paths

### Text is cut off or misaligned
- Run `npm run test-positions` again
- Adjust coordinates in the `POSITIONS` object
- Test with `npm run generate-single <ID>` before bulk generation

### QR code not scanning
- Make sure the QR code area is large enough (at least 100x100 pixels)
- Ensure there's enough contrast between QR code and background
- Test scanning with your phone

## Tips

1. **Start small**: Always test with a single user first
2. **Check photos**: Verify a few sample photos load correctly
3. **Scan QR codes**: Test that QR codes scan properly before printing
4. **Backup**: Keep your original template files safe
5. **Batch processing**: The script processes all users, so it may take a few minutes

## Performance

- Expected time: ~1-2 seconds per ID card
- For 1000 users: ~20-30 minutes total
- Progress is logged in real-time

## Next Steps

After generation:
1. Review a sample of generated cards
2. Test print a few cards to check quality
3. Verify QR codes scan correctly
4. Proceed with bulk printing

## Need Help?

Check the detailed documentation in `ID-CARD-GENERATOR-README.md`

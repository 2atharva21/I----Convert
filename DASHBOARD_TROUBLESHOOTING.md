# Dashboard Not Showing - Troubleshooting Guide

If the PDF options dashboard is not showing after uploading files, follow these steps:

## Quick Fix (Try First)

### 1. Hard Refresh Browser
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

This clears the browser cache and reloads all files fresh.

---

## Detailed Troubleshooting

### Step 1: Check Browser Console
1. Open your browser (Chrome, Firefox, Safari, Edge)
2. Press `F12` to open Developer Tools
3. Click on the "Console" tab
4. You should see messages like:
   ```
   ✓ DOM Elements Loaded: { optionsSection: 'Found', actionSection: 'Found', fileInput: 'Found' }
   ✓ Convertly app initialized
   ```

**If you see errors:** Take a screenshot and share them.

---

### Step 2: Test Upload
1. Open http://localhost:3000
2. Click "Select JPG File"
3. Choose a JPG image from your computer
4. **Expected Result:** 
   - ✓ Image preview appears
   - ✓ File count shows "📊 1 file(s) selected"
   - ✓ **Dashboard section appears with:**
     - 📐 Page Orientation buttons (Portrait, Landscape)
     - 📄 Page Size dropdown (A4, Letter)
     - 📏 Margin buttons (No Margin, Small, Medium)
   - ✓ "🔄 Convert to PDF" button appears

---

### Step 3: Check Console Logs During Upload
While uploading:
1. Keep Developer Tools open (F12)
2. Go to Console tab
3. Upload a file
4. **You should see:**
   ```
   updateActionButtons called, selectedFiles: 1, optionsSection: [object HTMLDivElement]
   Files detected - showing options and action sections
   ```

**If you see `optionsSection: null`:**
- The HTML element is not being found
- Server might need to restart
- Try: Close browser tab, restart server, open http://localhost:3000 again

---

### Step 4: Inspect Elements
1. Right-click on any empty area below the preview
2. Select "Inspect" or "Inspect Element"
3. Look for `<div id="optionsSection">`
4. Check if it's visible (not hidden by `display: none`)
5. The `style` attribute should show: `style="display: block;"` after files are uploaded

---

## Common Issues & Solutions

### Issue 1: Nothing shows after uploading
**Cause:** Browser cache
**Solution:** Hard refresh (Ctrl+Shift+R) and try again

### Issue 2: Error in console about "optionsSection is null"
**Cause:** Server restarted but code wasn't reloaded
**Solution:** 
- Close browser tab
- Restart server: `node server.js`
- Open `http://localhost:3000` in new tab

### Issue 3: Preview shows but no dashboard
**Cause:** CSS not loading or JavaScript error
**Solution:**
- Check console for errors (F12)
- Try hard refresh (Ctrl+Shift+R)
- Restart server and try again

### Issue 4: Dashboard shows but buttons don't work
**Cause:** Event listeners not attached
**Solution:**
- Check console for JavaScript errors
- Ensure file is uploaded (file count shows > 0)
- Try hard refresh

---

## Server Debug Mode

If issues persist, restart server with debug output:

```bash
cd "d:\I Love Convert"
node server.js
```

When you upload a file, check terminal for log messages like:
```
[SUCCESS] Processed 1 image(s) | Options: portrait A4 margin=0pt...
```

---

## Files to Check

✓ `public/index.html` - Should have `<div id="optionsSection">`
✓ `public/style.css` - Should have `.options-section`, `.option-btn` styles
✓ `public/script.js` - Should have `optionsSection` variable and event listeners

---

## Still Having Issues?

1. **Open Console** (F12) and screenshot any errors
2. **Share Console logs** - Copy text from console tab
3. **Describe what you see** - Do you see preview? Any buttons? Any colors/styling?
4. **Check file format** - Make sure uploading actual JPG files (not PNG or other)

---

## Testing Checklist

- [ ] Page loads without errors
- [ ] File upload works
- [ ] Preview appears with image
- [ ] File count displays
- [ ] Dashboard section visible with buttons
- [ ] Buttons are clickable (hover changes color)
- [ ] Convert button works
- [ ] PDF downloads

If all these work, the dashboard is functioning correctly!

---

**Status:** Troubleshooting Guide Created
**Last Updated:** 2024-04-16

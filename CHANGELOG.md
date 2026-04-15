# Changelog

All notable changes to Convertly are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2024-04-16

### 🎉 Professional Dashboard Release

#### Added
- ✅ **Page Orientation Options** - Portrait/Landscape selection buttons
- ✅ **Page Size Selection** - A4 and Letter format dropdowns
- ✅ **Margin Control** - No margin, Small (10pt), Medium (20pt) options
- ✅ **Smart Image Scaling** - Aspect ratio preserved with margin support
- ✅ **Dashboard UI** - Modern iLovePDF-style options interface
- ✅ **Active State Styling** - Visual feedback for selected options
- ✅ **Input Validation** - Backend validates all PDF options
- ✅ **Options Logging** - Analytics tracks selected PDF options

#### Changed
- 🔄 **PDF Generation Logic** - Complete rewrite to support layout options
- 🔄 **Page Dimensions** - Dynamic calculation based on orientation and size
- 🔄 **Image Positioning** - Centered placement with margin support
- 🔄 **Frontend State** - Added selectedOptions object for option tracking
- 🔄 **Query Parameters** - Convert endpoint now accepts: orientation, size, margin

#### Technical Details
- **Page Size Constants:** A4 (595×842pt) and Letter (612×792pt)
- **Margin Sizes:** 0pt (none), 28pt (small), 57pt (medium)
- **Image Scaling:** Maintains aspect ratio while fitting content area
- **CSS Grid Layout:** Responsive button groups for all screen sizes

#### Tested On
- Node.js 18.x, 20.x
- Chrome, Firefox, Safari, Edge
- Windows, macOS, Linux
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## [1.0.0] - 2024-04-16

### 🎉 Initial Release

#### Added
- ✅ **Core Feature:** JPG to PDF conversion
- ✅ **Image Editing:** Rotate left/right (90° increments)
- ✅ **Image Management:** Remove unwanted images from batch
- ✅ **User Interface:** Drag & drop file upload
- ✅ **File Selection:** Single file selection with controlled UX
- ✅ **Preview Grid:** Visual preview with rotate/remove controls
- ✅ **Smart Filenames:** Preserves original filename in output
- ✅ **Merged Naming:** Adds "-merged" suffix for multiple files
- ✅ **A4 Mode:** Optional A4 page sizing via query parameter
- ✅ **File Validation:** Binary MIME type verification
- ✅ **Rate Limiting:** 10 requests per minute protection
- ✅ **PDF Compression:** Optimized output with object streams
- ✅ **Security Headers:** Content-type, framing, and caching protection
- ✅ **Auto Cleanup:** Temporary files deleted after conversion
- ✅ **Analytics Logging:** Conversion tracking and statistics
- ✅ **Responsive Design:** Works on desktop, tablet, and mobile
- ✅ **Error Handling:** User-friendly error messages
- ✅ **Documentation:** Comprehensive README and contributing guide

#### Technical Details
- **Backend:** Node.js + Express.js
- **File Handling:** Multer with disk storage
- **PDF Generation:** pdf-lib with compression
- **Image Processing:** Sharp for rotation
- **File Validation:** file-type library
- **Rate Limiting:** express-rate-limit middleware
- **Frontend:** Vanilla JavaScript, no frameworks
- **Styling:** Modern CSS with gradients and animations

#### Tested On
- Node.js 18.x, 20.x
- Chrome, Firefox, Safari, Edge
- Windows, macOS, Linux

---

## [Unreleased]

### Planned Features
- [ ] Drag-to-reorder images before conversion
- [ ] Custom PDF page sizes (A3, Letter, Legal, etc.)
- [ ] Image filters (brightness, contrast, saturation)
- [ ] OCR (Optical Character Recognition)
- [ ] User authentication and history
- [ ] Cloud storage integration (AWS S3, Google Drive)
- [ ] Batch CLI tool for server-side conversion
- [ ] Image watermarking
- [ ] REST API with Swagger documentation
- [ ] Progressive Web App (PWA) support
- [ ] Multi-language support (i18n)
- [ ] Dark mode UI
- [ ] Real-time file size calculation
- [ ] Image cropping tool
- [ ] Scheduled conversions

### Under Consideration
- Docker containerization
- Database integration (MongoDB, PostgreSQL)
- User dashboard
- Conversion analytics
- API rate limiting per user
- WebSocket support for real-time updates
- Mobile native apps (React Native, Flutter)

---

## Release Notes Template

For future releases, use this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Deprecated
- Features to be removed

### Removed
- Deleted features

### Security
- Security updates
```

---

## Version History

### Version Strategy

**Major (X.0.0):** Breaking changes, major features
**Minor (0.X.0):** New features, backward compatible
**Patch (0.0.X):** Bug fixes, security updates

### Support Timeline

| Version | Release | Status | Support Until |
|---------|---------|--------|---------------|
| 1.0.x   | 2024-04 | Active | 2025-04 |
| 2.0.x   | TBD     | Planning | TBD |

---

## Upgrade Guide

### From 0.x to 1.0.0

No previous versions exist.

### Future Upgrades

Upgrade instructions will be provided in release notes.

```bash
# Standard update
npm update convertly

# Or for git clone
git pull origin main
npm install
```

---

## Known Issues

### Current Release (1.0.0)

- None known - Please report issues!

### Fixed in Later Versions

- Tracked in GitHub Issues with milestone tags

---

## Contributing to Changelog

When submitting PRs, update CHANGELOG.md:

1. Add your changes under `[Unreleased]`
2. Use appropriate category (Added, Changed, Fixed, etc.)
3. Reference GitHub issues/PRs
4. Keep entries concise and user-focused

Example:
```markdown
### Added
- Drag-to-reorder images (#123)
- New color theme option (#125)

### Fixed
- Rotation not persisting on large files (#122)
```

---

## Versioning Policy

- **Semantic Versioning:** Major.Minor.Patch
- **Release Frequency:** When features are ready (no fixed schedule)
- **LTS Support:** Latest major version receives security updates
- **Deprecation Notice:** Features deprecated for at least 2 minor versions before removal

---

## How to Check Your Version

```bash
# Check from installed package
npm list convertly

# Or in code
const pkg = require('./package.json');
console.log(pkg.version);
```

---

## GitHub Releases

Full release history available at:
https://github.com/2atharva21/convertly/releases

Each release includes:
- Source code (ZIP, TAR.GZ)
- Detailed changelog
- Security notes
- Installation instructions

---

## Changelog Format

This changelog is maintained by:
- **Maintainers:** When merging PRs
- **Before Release:** Compiled into release notes
- **Access:** Always in this file and GitHub Releases

---

## Questions About Versions?

- Check GitHub Issues
- Read release notes
- Check documentation

---

**Last Updated:** 2024-04-16
**Maintained by:** Convertly Team

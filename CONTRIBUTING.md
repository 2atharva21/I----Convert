# Contributing to Convertly

Thank you for your interest in contributing to Convertly! We appreciate your help in making this project better.

## 🎯 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

---

## 🚀 How to Contribute

### 1. Report Bugs

Found a bug? Please create an issue with:
- **Title:** Clear, concise description
- **Description:** What happened vs. what was expected
- **Steps to Reproduce:** How to replicate the issue
- **Environment:** OS, Node version, browser (if frontend)
- **Screenshots:** If applicable

### 2. Suggest Enhancements

Have an idea? Submit an issue with:
- **Title:** Clear feature description
- **Use Case:** Why this would be helpful
- **Proposed Solution:** How you'd implement it
- **Alternatives:** Other approaches considered

### 3. Submit Pull Requests

#### Setup Development Environment

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/convertly.git
cd convertly

# Add upstream remote
git remote add upstream https://github.com/2atharva21/convertly.git

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name
```

#### Development Workflow

```bash
# Make your changes
# Test thoroughly
node server.js

# Check your code for issues
npm run lint  # (if available)

# Commit with clear messages
git commit -m "feat: add your feature description"
git commit -m "fix: resolve issue with X"
git commit -m "docs: update README"

# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

#### Commit Message Format

Follow conventional commits:

```
feat: add image reordering feature
fix: correct rotation calculations
docs: update installation guide
style: improve CSS consistency
refactor: optimize file upload handler
test: add rotation validation tests
chore: update dependencies
```

#### Pull Request Guidelines

1. **Clear Title:** Describe what your PR does
2. **Description:** Reference related issues (#123)
3. **Testing:** Explain how you tested the changes
4. **Screenshots:** Include before/after if UI changes
5. **Dependencies:** Note any new packages added

**Example PR Description:**
```markdown
## Description
Adds ability to reorder images by dragging within the preview grid.

## Issue
Fixes #45

## Changes
- Added drag event listeners to preview items
- Implemented array reordering logic
- Updated visual feedback during drag

## Testing
- Manual testing with 5+ images
- Verified drag works on touch devices
- Tested edge cases (first/last position)

## Screenshots
[Before/After images]
```

---

## 💻 Development Guidelines

### Code Style

**JavaScript:**
```javascript
// Use descriptive names
function convertImagesToPDF(images, options) {
  // Single responsibility principle
  const validatedImages = validateImages(images);
  return generatePDF(validatedImages, options);
}

// Use const/let, avoid var
const config = { /* ... */ };
let counter = 0;

// Use arrow functions where appropriate
const processImages = (images) => images.filter(img => img.size > 0);

// Add comments for complex logic
// Normalize rotation degrees to 0-359 range
const normalizeRotation = (degrees) => ((degrees % 360) + 360) % 360;
```

**HTML:**
```html
<!-- Use semantic elements -->
<section class="upload-area">
  <header>Upload Images</header>
  <!-- Use descriptive IDs/classes -->
  <input id="file-input" type="file" accept="image/jpeg" />
  <button aria-label="Upload image" class="btn-primary">Upload</button>
</section>
```

**CSS:**
```css
/* Use BEM or similar naming convention */
.upload-area {
  display: flex;
}

.upload-area__input {
  width: 100%;
}

.upload-area--active {
  background-color: #f0f0f0;
}

/* Use CSS variables for colors */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### File Organization

```
convertly/
├── public/
│   ├── index.html          # Main HTML
│   ├── style.css           # Global styles
│   ├── script.js           # Frontend logic
│   └── assets/             # (future) Images, fonts, etc.
├── server.js               # Main server file
├── package.json            # Dependencies
└── uploads/                # Temporary storage
```

### Testing Before Submission

1. **Frontend Testing**
   - Single file upload and conversion
   - Multiple file drag & drop
   - Rotation functionality
   - PDF download and verification
   - Error handling (invalid files, oversized)
   - Mobile responsiveness

2. **Backend Testing**
   - File validation logic
   - Rate limiting
   - PDF generation
   - Error handling and cleanup
   - Security headers

3. **Cross-browser Testing**
   - Chrome/Edge
   - Firefox
   - Safari

---

## 🐛 Bug Fixes

When fixing bugs:

1. Create an issue describing the bug first
2. Reference the issue in your PR
3. Add a comment in code explaining the fix
4. Test edge cases

**Example:**
```javascript
// Fix: Handle rotation values > 360 degrees
// Issue: #42 - Rotation not working with values like 450
const normalizeRotation = (degrees) => {
  return ((degrees % 360) + 360) % 360;
};
```

---

## 🎨 Feature Development

When adding features:

1. Discuss in an issue first for larger changes
2. Keep features focused and single-purpose
3. Add comments documenting new functionality
4. Update README.md if needed
5. Test thoroughly

---

## 📚 Documentation

### README Updates

If your change affects usage, update README.md:

```markdown
### New Feature Name

Description of what it does.

**Usage:**
```bash
# Example code
```

**Example:**
```javascript
// Example implementation
```
```

### Comments in Code

Add clear comments for:
- Complex algorithms
- Why something is done (not just what)
- Edge cases handled
- Performance considerations

```javascript
// ✅ Good - Explains why
// Use finally to guarantee cleanup even if rotation fails
.finally(() => {
  fs.unlink(tempPath); // Delete temp file
});

// ❌ Avoid - Only states what
fs.unlink(tempPath);
```

---

## 🔒 Security Considerations

When contributing, keep security in mind:

- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Don't expose sensitive data in logs
- ✅ Sanitize file names before display
- ✅ Check for path traversal vulnerabilities
- ✅ Use security headers
- ✅ Keep dependencies updated

---

## 🚫 What NOT to Do

- ❌ Don't add dependencies without discussion
- ❌ Don't make large refactoring in feature PRs
- ❌ Don't change the entire codebase style
- ❌ Don't include unrelated changes
- ❌ Don't commit sensitive data (.env, keys)
- ❌ Don't force push to shared branches

---

## 📦 Adding Dependencies

Before adding a package:

1. Check if it's really needed
2. Consider alternatives
3. Check package size and security
4. Discuss in an issue first for major deps

To add a dependency:
```bash
npm install package-name
# Or for dev dependencies
npm install --save-dev package-name
```

Update package.json in your commit.

---

## 🏃 Quick Start for Contributors

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/convertly.git
cd convertly

# 2. Install dependencies
npm install

# 3. Create feature branch
git checkout -b feature/my-feature

# 4. Make changes
# ... edit files ...

# 5. Test
node server.js

# 6. Commit
git commit -m "feat: add my awesome feature"

# 7. Push and create PR
git push origin feature/my-feature
```

---

## 📖 Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 💬 Questions?

- Check existing issues and discussions
- Create a new discussion for questions
- Comment on related issues
- Reach out via email

---

## 🙏 Thank You

Your contributions make Convertly better for everyone. We appreciate your time and effort!

**Happy coding! 🚀**

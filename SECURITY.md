# Security Policy

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability in Convertly, please **do not** create a public GitHub issue. Instead:

1. **Email:** Send details to `security@example.com` with:
   - Description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact
   - Suggested fix (if you have one)

2. **Allow Time:** Give us 90 days to respond and patch before public disclosure

3. **GPG Encryption:** (Optional) You can encrypt sensitive information with our GPG key

We take security seriously and will acknowledge receipt within 48 hours.

---

## 🛡️ Security Features

### Input Validation
- ✅ **MIME Type Check** - Verify `image/jpeg` content-type
- ✅ **Binary Verification** - Use `file-type` library for real format detection
- ✅ **Extension Whitelist** - Only `.jpg` and `.jpeg` accepted
- ✅ **File Size Limits** - Max 10MB per file, 50MB per batch

### Rate Limiting
- ✅ **Endpoint Limiting** - 10 requests/minute per IP on `/convert`
- ✅ **Abuse Prevention** - Protects against DOS attacks
- ✅ **Grace Period** - Enforced across all client connections

### Data Protection
- ✅ **Temporary Files** - Deleted immediately after use
- ✅ **No Storage** - Files never persisted to database
- ✅ **Error Cleanup** - Guaranteed deletion even on failures
- ✅ **Memory Efficiency** - Stream-based processing

### HTTP Security Headers
```
X-Content-Type-Options: nosniff         # Prevent MIME sniffing
X-Frame-Options: DENY                   # Prevent clickjacking
Cache-Control: no-store                 # Prevent caching
Pragma: no-cache                        # Old browser support
```

### CORS Configuration
- ✅ **Restricted Origins** - Configure allowed domains
- ✅ **Safe Methods** - POST only for file uploads
- ✅ **Credentials** - Handled securely

---

## 🔐 Best Practices

### For Users

1. **Use HTTPS** - Always connect via HTTPS in production
2. **Update Node.js** - Keep your Node.js version current
3. **Regular Updates** - Update Convertly and dependencies regularly
4. **Monitor Logs** - Watch server logs for suspicious activity
5. **Backup Files** - Keep backups of important images before converting

### For Developers

1. **Validate Input** - Always validate user uploads
2. **Error Handling** - Don't expose system paths in errors
3. **Logging** - Log security events without sensitive data
4. **Dependencies** - Audit packages regularly:
   ```bash
   npm audit
   npm audit fix
   ```

5. **Environment Variables** - Never hardcode secrets:
   ```javascript
   // ✅ Correct
   const apiKey = process.env.API_KEY;
   
   // ❌ Wrong
   const apiKey = "sk-1234567890";
   ```

---

## 🚨 Security Checklist

Before deploying to production:

- [ ] Enable HTTPS/TLS
- [ ] Set strong CORS policies
- [ ] Configure environment variables
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review server.js for hardcoded values
- [ ] Test rate limiting
- [ ] Verify file validation
- [ ] Set up monitoring/alerting
- [ ] Configure firewall rules
- [ ] Use security headers middleware
- [ ] Enable security logging
- [ ] Test error handling (no path leaks)
- [ ] Verify temporary file cleanup
- [ ] Use non-root user for Node.js process
- [ ] Set up automated dependency updates

---

## 🔍 Vulnerability Disclosure Timeline

| Timeline | Action |
|----------|--------|
| Day 0 | Vulnerability reported |
| Day 1-2 | Acknowledge receipt, begin investigation |
| Day 7-14 | Provide timeline for fix |
| Day 30-60 | Release patch version |
| Day 90 | Disclosure deadline (if unpatched) |

---

## 📋 Known Security Considerations

### File Type Spoofing
- **Status:** Protected
- **Method:** Binary file verification via `file-type` library
- **Mitigation:** Double-check extension AND content

### Path Traversal
- **Status:** Protected
- **Method:** Multer handles path sanitization
- **Mitigation:** Never use user input in file paths directly

### DOS/Rate Limiting
- **Status:** Protected
- **Method:** express-rate-limit middleware
- **Mitigation:** 10 req/min per IP

### Image Processing Bombs
- **Status:** Partially protected
- **Method:** File size limits enforced
- **Mitigation:** Max 10MB per file

---

## 🔄 Dependency Security

### Automated Updates
Keep dependencies secure:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update to latest
npm update

# Update specific package
npm install package@latest
```

### Production Dependencies
Only essential packages to reduce attack surface:
- express
- multer
- pdf-lib
- cors
- express-rate-limit
- file-type
- sharp

### Development Dependencies
None currently (keeping it minimal)

---

## 🔐 Encryption & HTTPS

### Recommended Setup

**Local Development:**
```bash
# Self-signed cert (development only)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

**Production:**
- Use Let's Encrypt (free)
- CloudFlare (easy setup)
- AWS Certificate Manager
- Nginx/Apache reverse proxy with SSL

### HTTP → HTTPS Redirect

```javascript
// server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📊 Security Monitoring

### Logs to Monitor
- Failed file uploads
- Rate limit violations
- MIME type mismatches
- File size violations
- Conversion errors

### Example Logging
```javascript
// Log suspicious activity
if (suspiciousActivity) {
  console.warn(`[SECURITY] Suspicious upload from IP: ${ip}`);
  // Don't log sensitive data
}
```

---

## 🔗 External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [npm Security](https://docs.npmjs.com/security)

---

## 📝 Security Update Notifications

Subscribe to security updates:
- Watch this repository on GitHub
- Follow release notes
- Subscribe to npm security advisories

---

## 🤝 Security Credits

We appreciate security researchers who responsibly disclose vulnerabilities. If your report leads to a fix, we'll acknowledge you in release notes (unless you prefer anonymity).

---

**Last Updated:** 2024
**Version:** 1.0.0

For questions, contact: `security@example.com`

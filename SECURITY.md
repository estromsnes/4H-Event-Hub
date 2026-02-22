# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Considerations

### Authentication and Authorization

**⚠️ CRITICAL: This application does NOT include authentication or authorization by default.**

The admin panel (`/admin.html`) and all administrative endpoints are completely open to anyone with network access to the application. This design choice was made for simplicity in controlled, local event environments but creates significant security risks if deployed to the internet.

### Known Security Limitations

1. **No Admin Authentication**
   - Admin panel has zero password protection
   - Anyone can access `/admin.html` and perform administrative actions
   - All API endpoints under `/api/admin/` are unprotected

2. **No Rate Limiting**
   - API endpoints have no rate limiting
   - Vulnerable to abuse if exposed to internet

3. **No CSRF Protection**
   - Cross-Site Request Forgery protection not implemented
   - Can be exploited if admin is logged into other services

4. **File Upload Security**
   - File uploads limited to JPEG/PNG with 5MB max size
   - MIME type checking implemented
   - EXIF data stripped from images
   - However, no virus scanning performed

### Recommended Security Measures

#### For Local Events (Recommended Use Case)
- Run on isolated/private network only
- Do not expose to public internet
- Restrict admin panel access to organizer devices only
- Use firewall rules to limit access

#### For Internet Deployment (Advanced Users)
If you must deploy to the internet, implement these additional protections:

1. **HTTP Basic Authentication** (Quick solution):
   ```nginx
   location /admin.html {
       auth_basic "Admin Area";
       auth_basic_user_file /etc/nginx/.htpasswd;
   }

   location /api/admin/ {
       auth_basic "Admin API";
       auth_basic_user_file /etc/nginx/.htpasswd;
   }
   ```

2. **Session-Based Authentication** (Better solution):
   - Implement Express session middleware
   - Add login page with password verification
   - Protect admin routes with authentication middleware

3. **HTTPS**:
   - Use Let's Encrypt for free SSL certificates
   - Never run on plain HTTP if exposed to internet

4. **Reverse Proxy**:
   - Use nginx or Apache as reverse proxy
   - Implement additional security headers
   - Add rate limiting at proxy level

5. **Environment Variables**:
   - Move sensitive configuration to `.env` file
   - Never commit `.env` to version control

### Data Protection (GDPR Compliance)

This application stores personal information including:
- Participant names, ages, home locations
- Club affiliations
- Profile photos (selfies)
- Feedback submissions (potentially identifiable)

**Your responsibilities:**
- Obtain consent before collecting participant data
- Inform participants about data usage
- Implement data retention policies
- Securely delete data after events
- Protect database backups
- Follow local privacy regulations (GDPR, etc.)

### Database Security

- Database file: `database/data.db` (SQLite)
- All queries use parameterized statements (SQL injection protected)
- Soft deletes implemented (active flag instead of permanent deletion)
- **Important**: Back up database regularly
- **Important**: The database file is in `.gitignore` - do NOT commit it

### Secure Deployment Checklist

Before deploying to any network:

- [ ] Change default event information in dummy data
- [ ] Remove or secure admin panel access
- [ ] Enable HTTPS if internet-facing
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Implement authentication if needed
- [ ] Review and update CORS settings
- [ ] Set up automated database backups
- [ ] Document data retention policy
- [ ] Review file upload settings
- [ ] Test error handling (don't expose stack traces)

## Reporting a Vulnerability

If you discover a security vulnerability in this application:

1. **DO NOT** open a public GitHub issue
2. **DO** create a private security advisory on GitHub:
   - Go to repository → Security → Advisories → New draft security advisory
3. Or email security concerns to the repository maintainer

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We will respond within 7 days and work with you to address the issue.

## Security Updates

- Security patches will be released as soon as possible
- Critical vulnerabilities will be prioritized
- Users will be notified via GitHub releases

## Attribution

- Built with Express.js (actively maintained)
- SQLite3 (actively maintained)
- Sharp for image processing (actively maintained)
- html5-qrcode for QR scanning (community maintained)

## License

This security policy applies to the 4H Event Hub project licensed under MIT License.

---

**Remember:** This application is designed for controlled, local event use. Always assess your security requirements before deployment.

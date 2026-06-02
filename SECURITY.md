# Security Policy

## 🔒 Security Measures Implemented

### Backend Security
- ✅ **Helmet Security Headers** - CSP, XSS Protection, HSTS
- ✅ **CORS Protection** - Whitelist-based origin validation
- ✅ **CSRF Protection** - Double-submit cookie pattern
- ✅ **Rate Limiting** - API abuse prevention (100 req/15min global, 20 req/10min search)
- ✅ **Input Sanitization** - All user inputs validated and sanitized
- ✅ **Service Worker URL Validation** - Open redirect prevention

### Frontend Security
- ✅ **DOMPurify** - XSS prevention for user-generated content
- ✅ **SSRF Protection** - Domain whitelist for external API calls
- ✅ **Private IP Blocking** - Prevents internal network scanning
- ✅ **Push Notification Security** - Origin validation

### Infrastructure Security
- ✅ **Environment Variables** - Sensitive configs via .env
- ✅ **Dependency Updates** - Regular vulnerability scanning
- ✅ **Serverless Architecture** - Reduced attack surface on Vercel

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email: [your-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## ⚡ Security Response

- **Response Time**: Within 48 hours
- **Fix Timeline**: Critical issues within 7 days
- **Disclosure**: Coordinated after fix is deployed

## 🛡️ Best Practices for Users

- Keep your browser updated
- Review notification permissions
- Use strong, unique passwords (if authentication is added)
- Report suspicious activity

## 📋 Security Checklist

- [x] Helmet security headers enabled
- [x] CORS whitelist configured
- [x] CSRF protection implemented
- [x] Rate limiting active
- [x] Input validation on all endpoints
- [x] XSS protection with DOMPurify
- [x] SSRF prevention with domain whitelist
- [x] Dependency vulnerabilities fixed
- [ ] Authentication system (future)
- [ ] WAF integration (future)
- [ ] Security audit (future)

## 🔄 Updates

Last security review: 2024
Next scheduled review: Quarterly

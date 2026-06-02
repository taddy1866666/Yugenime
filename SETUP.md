# 🚀 Quick Start Guide - Yugenime

## ⚡ Fastest Way to Run (Windows)

Just double-click `start.bat` - it will start both backend and frontend automatically!

## 📋 Manual Setup

### Option 1: Run Everything at Once
```bash
npm run dev:full
```

### Option 2: Run Separately (2 terminals)

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

## 🔧 Fixing Notification Issues

### Local Development
Make sure backend server is running on `http://localhost:3000`:
```bash
cd server
npm start
```

### Production (Vercel)
1. Deploy to Vercel
2. Add environment variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Notifications will work automatically via serverless functions

## 🔔 Push Notifications Setup

### Browser Requirements
- Chrome, Edge, Firefox, Safari 16+
- Allow notification permissions when prompted
- Backend server must be running (local) or deployed (production)

### Troubleshooting

**"Backend server not running"**
- Start backend: `cd server && npm start`
- Or use `start.bat` (Windows) / `npm run dev:full`

**"Permission denied"**
- Check browser notification settings
- Clear site data and reload
- Try incognito mode first

**"CORS error"**
- Make sure FRONTEND_URL is correct in `.env`
- Check allowedOrigins in `server/index.js`

## 📦 Dependencies

Install all dependencies:
```bash
# Root (Frontend)
npm install

# Backend
cd server
npm install
```

## 🌐 Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API: `http://localhost:3000/api`

## 🎯 Testing Push Notifications

1. Start backend: `cd server && npm start`
2. Start frontend: `npm run dev`
3. Open `http://localhost:5173`
4. Allow notifications when prompted
5. Add anime to watchlist
6. Notifications will appear when new episodes release

## 🔒 Security Features

✅ CSRF Protection
✅ CORS Whitelist
✅ Helmet Security Headers
✅ Rate Limiting
✅ Input Sanitization
✅ SSRF Protection

## 📊 Performance Optimizations

✅ Lazy Loading (React.lazy)
✅ Code Splitting
✅ Memoization (useCallback, useMemo)
✅ In-memory Caching (1 hour)
✅ Write Queue (race condition prevention)

## 🚀 Deployment

### Vercel
```bash
git push origin main
```
Vercel will auto-deploy. Make sure to set environment variables.

### Environment Variables
```env
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=3000
```

## 📝 Additional Docs

- Security: `SECURITY.md`
- Performance: `PERFORMANCE.md`
- Main Readme: `README.md`

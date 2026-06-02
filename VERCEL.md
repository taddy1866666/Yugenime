# 🚀 Vercel Deployment Guide

## ✅ Current Status: DEPLOYED TO VERCEL

Your app is already deployed! No need to start local backend server.

## 🔧 Important Vercel Settings

### Environment Variables (Add in Vercel Dashboard)
```
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### How to Add Environment Variables:
1. Go to https://vercel.com/dashboard
2. Select your project (Yugenime)
3. Go to **Settings** → **Environment Variables**
4. Add the variables above
5. Redeploy

## 🔔 Push Notifications on Vercel

### How It Works:
- **Serverless Functions**: Backend runs as serverless functions
- **Cron Jobs**: Vercel Cron checks for new episodes every 15 minutes
- **VAPID Keys**: Auto-generated on first deploy, stored in `/server/vapid.json`

### Limitations (Free Plan):
- Cron jobs are **Pro feature only**
- Alternative: Use external cron service like [cron-job.org](https://cron-job.org)
- Set to call: `https://your-app.vercel.app/api/push-check-releases` every 15 mins

## ⚠️ Common Issues

### "Notifications disabled" message
**Solution**: This is normal behavior. The app works fine without notifications.
- Notifications are optional feature
- All other features work normally
- To enable: Upgrade to Vercel Pro or use external cron

### CORS Errors
**Solution**: Update `server/index.js` allowedOrigins:
```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-actual-vercel-url.vercel.app', // ← Add your real URL
    process.env.FRONTEND_URL
].filter(Boolean);
```

### Cold Starts
**Solution**: First request after inactivity is slow (5-10 seconds)
- This is normal for serverless functions
- Subsequent requests are fast
- Upgrade to Vercel Pro for faster cold starts

## 🧪 Testing on Vercel

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check browser console for errors
3. Test API endpoint: `https://your-app.vercel.app/api/push-public-key`
4. Should return: `{"publicKey":"BG..."}`

## 📊 Monitoring

Check Vercel Dashboard:
- **Functions**: See serverless function logs
- **Analytics**: Track page views and performance
- **Logs**: Real-time error tracking

## 🔄 Redeployment

Push to GitHub:
```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel auto-deploys within 1-2 minutes.

## 🎯 Pro Features (Optional)

If you upgrade to Vercel Pro ($20/month):
- ✅ Cron jobs for push notifications
- ✅ Faster cold starts
- ✅ More bandwidth
- ✅ Better analytics

## 🆓 Free Tier is Fine!

Everything works except automatic push notifications. Users still get:
- ✅ Full anime streaming
- ✅ Watchlist tracking
- ✅ Episode tracking
- ✅ Search and browse
- ✅ Mobile responsive

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Your App: https://your-app.vercel.app

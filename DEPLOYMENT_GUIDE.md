# ConnectHearts — Production Deployment Guide 🚀

ConnectHearts is fully hardened, tested, and ready for production deployment across Render (Backend + Socket.IO) and Netlify (Frontend React SPA).

---

## Architecture Overview

- **Frontend**: React 19 + Vite 8 SPA hosted on **Netlify**
- **Backend**: Node.js + Express 5 + Socket.IO engine hosted on **Render** (Web Service)
- **Database**: **MongoDB Atlas** (Cluster0, TLS connection, `connecthearts` database)
- **Media**: Firebase Cloud Storage / Local Multer fallback

---

## Step 1: Deploy Backend to Render

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your ConnectHearts GitHub / Git repository.
4. Configure the service settings:
   - **Name**: `connecthearts-api` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free or Starter
5. Under **Environment Variables**, add the following:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security mode |
| `PORT` | `10000` | (Render dynamically injects this, or set 5000/10000) |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.i6gnx1m.mongodb.net/connecthearts?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `64cd19e4a57d540e89286c68a27aec907170939f19ec29ca7ce59b51904a9dc5d451848b702355075d5e4741755ed667` | Minimum 32-character secure secret |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `CLIENT_URL` | `https://your-app.netlify.app` | Your deployed Netlify frontend URL |
| `FRONTEND_URL` | `https://your-app.netlify.app` | Secondary frontend URL reference |
| `CORS_ORIGINS` | `https://your-app.netlify.app` | Comma-separated allowed production origins |

6. Click **Create Web Service**.
7. Note your Render service URL: `https://connecthearts-api.onrender.com`.

### Verify Backend Health
Once deployed, verify the endpoint:
```bash
curl https://connecthearts-api.onrender.com/api/health
```
Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": "12s",
  "service": "ConnectHearts API"
}
```

---

## Step 2: Deploy Frontend to Netlify

1. Log into your [Netlify Dashboard](https://app.netlify.com).
2. Click **Add new site** → **Import an existing project**.
3. Select your ConnectHearts Git repository.
4. Configure the build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Under **Environment variables**, add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://connecthearts-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://connecthearts-api.onrender.com` |
| `VITE_FIREBASE_API_KEY` | *(Your Firebase Web API Key)* |
| `VITE_FIREBASE_AUTH_DOMAIN` | *(Your Firebase Auth Domain)* |
| `VITE_FIREBASE_PROJECT_ID` | *(Your Firebase Project ID)* |
| `VITE_FIREBASE_STORAGE_BUCKET` | *(Your Firebase Storage Bucket)* |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | *(Your Firebase Sender ID)* |
| `VITE_FIREBASE_APP_ID` | *(Your Firebase App ID)* |

6. Click **Deploy ConnectHearts**.
7. Netlify will build the frontend using Vite and publish the `dist` directory. The `public/_redirects` file ensures all React Router routes resolve seamlessly.

---

## Step 3: Connect Frontend & Backend CORS

Once Netlify assigns your domain (e.g., `https://connecthearts.netlify.app`):
1. Go back to Render Dashboard → Environment.
2. Ensure `CLIENT_URL` and `CORS_ORIGINS` include your exact Netlify domain:
   ```
   CLIENT_URL=https://connecthearts.netlify.app
   CORS_ORIGINS=https://connecthearts.netlify.app
   ```
3. Save changes (Render will automatically redeploy with the updated origin).

---

## Step 4: Two-Account Live Smoke Test Procedure

Verify full real-time flow with two independent devices or browser profiles:

1. **Account 1 (Device A / Chrome Normal)**:
   - Navigate to `https://connecthearts.netlify.app/register`
   - Register as **Priya Sharma**, age 24, female.
   - Fill in Mumbai city, bio, and interests (Music, Travel, Photography).
   - Upload a profile photo.

2. **Account 2 (Device B / Chrome Incognito / Mobile)**:
   - Navigate to `https://connecthearts.netlify.app/register`
   - Register as **Rahul Mehta**, age 26, male.
   - Open `/discover` — Priya Sharma should appear in the deck with dynamic compatibility score.
   - Verify Rahul does NOT see himself.
   - Click **Like ❤️** on Priya.

3. **Mutual Match Creation**:
   - On Device A (Priya), open `/discover`.
   - Rahul appears in the deck.
   - Click **Like ❤️** on Rahul.
   - **Match Celebration Modal** triggers with confetti on both screens!

4. **Real-Time Messaging & Reactions**:
   - Priya opens `/matches` and selects Rahul.
   - Priya types: *"Hey Rahul! Loved your photography photos 📸"*
   - Rahul immediately sees the message appear in real-time via Socket.IO without page reload.
   - Rahul adds a heart reaction ❤️ to the message — updates live on Priya's screen.

5. **Safety, Blocking & Account Cleanup**:
   - Test safety report submission via the shield button.
   - Test blocking/unmatching if desired.
   - Test settings update and secure account deletion.

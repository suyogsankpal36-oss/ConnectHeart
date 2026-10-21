# ConnectHearts ❤️ — Premium Dark Luxury Dating Platform

ConnectHearts is an intentional, production-ready dating platform designed with a bespoke dark-luxury aesthetic (Champagne Gold, Rich Burgundy, Deep Onyx) and modern relationship-building features:

- **Algorithmic Compatibility**: Real-time scoring based on mutual interests, dating intentions, and lifestyle habits.
- **Real-Time Messaging**: Socket.IO-powered chat with emoji reactions, instant read receipts, typing bubbles, and voice memos.
- **Simulated Virtual Dates**: Interactive rendezvous video rooms with ambient romantic filters and icebreaker question cards.
- **Safety First**: Full user blocking, categorized abuse reporting, and permanent cascading account deletion (Right to be Forgotten).

---

## 🏗️ Architecture & Technology Stack

| Tier | Technology | Description |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Single Page Application with React Router DOM v7, Axios, and React Icons. |
| **Styling** | Vanilla CSS Design Tokens | Dark luxury theme using CSS variables (`#101010`, `#171717`, `#C9A96E`, `#8F3048`). |
| **Backend** | Node.js + Express 5 | RESTful API with Helmet, rate limiting, and centralized error handling. |
| **Real-Time** | Socket.IO v4 | Low-latency duplex messaging, signaling for virtual dates, and presence tracking. |
| **Database** | MongoDB Atlas / Local | Mongoose models with compound unique indexes and cascading relationship cleanups. |
| **Cloud Storage** | Firebase / Local Multer | Direct multi-region photo uploads and avatar processing. |
| **Deployment** | Render + Vercel | Backend web service on Render; frontend edge delivery on Vercel. |

---

## 📂 Project Structure

```
ConnectHearts/
├── backend/                  # Node.js + Express REST API & Socket.IO server
│   ├── config/               # Database connection & pooling logic
│   ├── controllers/          # Business logic (Auth, Profile, Discover, Matches, etc.)
│   ├── middleware/           # JWT authentication and Multer media upload
│   ├── models/               # Mongoose database schemas (User, Match, Message, etc.)
│   ├── routes/               # Express endpoint definitions
│   ├── uploads/              # Local media storage directory
│   ├── .env.example          # Backend environment variable template
│   ├── package.json          # Backend dependencies and scripts (start, dev)
│   └── server.js             # Main server entry point
│
├── frontend/                 # React + Vite client application
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── components/       # Sticky Navbar, modals (Match, VideoDate, Safety)
│   │   ├── context/          # Authentication provider and session state
│   │   ├── pages/            # Views (Landing, Login, Register, Discover, Matches, etc.)
│   │   ├── services/         # Axios API client, Socket.IO, Firebase
│   │   ├── utils/            # Photo URL resolver
│   │   ├── App.jsx           # React Router route configuration
│   │   ├── index.css         # Complete dark luxury design system
│   │   └── main.jsx          # React DOM entry point
│   ├── .env.example          # Frontend environment variable template
│   ├── package.json          # Frontend dependencies and build scripts
│   ├── vercel.json           # Vercel SPA rewrites & security headers
│   └── vite.config.js        # Vite build configuration
│
├── render.yaml               # Infrastructure-as-Code blueprint for Render
├── .gitignore                # Root version control exclusions
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB running at `127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment variables and configure your secrets
cp .env.example .env

# Start the API server
npm start
# Server runs at http://localhost:5000
```

### 3. Frontend Setup
```bash
# In a new terminal:
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Start the Vite development server
npm run dev
# Frontend runs at http://localhost:5173
```


---

## 🌐 Production Deployment

### 1. Backend on Render
1. Connect your Git repository to **Render**.
2. Render automatically detects `render.yaml`.
3. Set your production environment variables in the Render Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string (minimum 32 characters).
   - `FRONTEND_URL`: Your deployed Vercel domain (e.g. `https://connecthearts.vercel.app`).
   - `CORS_ORIGINS`: `https://connecthearts.vercel.app`.

### 2. Frontend on Netlify (or Vercel)

#### Deploying on Netlify:
1. Log into your [Netlify Dashboard](https://app.netlify.com/) and click **Add new site > Import an existing project**.
2. Connect your GitHub repository.
3. Netlify will automatically detect [`netlify.toml`](file:///c:/xampp/htdocs/ConnectHearts/netlify.toml) with:
   - **Base directory**: `frontend` (or left blank if deploying from the root repository)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Under **Environment variables**, add:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://<your-render-service>.onrender.com`
5. Click **Deploy Site**. Netlify will build the production bundle and configure SPA rewrites (`_redirects` / `index.html`) with HTTP security headers automatically.

#### Alternative: Deploying on Vercel:
1. Import the repository into **Vercel** and select `frontend` as the **Root Directory**.
2. Set Environment Variables:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://<your-render-service>.onrender.com`
3. Click **Deploy**. Vercel will build the production bundle (`dist/`) and configure SPA rewrites via `vercel.json`.

### 3. MongoDB Atlas Network Access
In your **MongoDB Atlas Dashboard**:
- Go to **Network Access** > **Add IP Address**.
- Add `0.0.0.0/0` (Allow Access from Anywhere) to permit Render instances to connect securely over TLS.

---

## 🔒 Security & Privacy Features

- **No Plaintext Passwords**: Passwords hashed with Bcrypt (12 salt rounds).
- **Protected Verification**: Account verification (`isVerified`) is restricted from user profile update payloads.
- **Cascade Deletion**: When an account is deleted, all matches, messages, likes, blocks, and reports are permanently erased.
- **Rate Limiting**: Brute-force protection on authentication and password recovery endpoints.
- **Security Headers**: Helmet & Vercel headers configured for `nosniff`, `DENY` clickjacking, and strict referrer policies.

---

## 📄 License
Private commercial project. All rights reserved.

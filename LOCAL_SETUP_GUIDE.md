# Daily Progress Tracker - Local Setup Guide

## Prerequisites (Install These First)

### 1. Node.js (v18 or higher)
- **Mac**: `brew install node`
- **Windows**: Download from https://nodejs.org (LTS version)
- **Verify**: `node --version` (should show v18+)

### 2. Python 3.10+
- **Mac**: `brew install python`
- **Windows**: Download from https://python.org
- **Verify**: `python3 --version`

### 3. MongoDB
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Windows**: Download from https://www.mongodb.com/try/download/community → install → start as service
- **Verify**: `mongosh` (should connect to localhost:27017)

### 4. Expo Go App
- Install **Expo Go** on your phone from App Store (iOS) or Play Store (Android)

---

## Step-by-Step Setup

### Step 1: Download Your Code

Option A - From GitHub (if you've saved to GitHub):
```bash
git clone <your-github-repo-url>
cd <your-project-folder>
```

Option B - Download from Emergent:
- Click "Download Code" on Emergent platform
- Extract the zip file
- Open terminal in the extracted folder

---

### Step 2: Find Your Local IP Address

You'll need this for your phone to connect to your laptop.

**Mac:**
```bash
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter (e.g., `192.168.1.100`)

**Write this IP down** — you'll use it in Step 4.

---

### Step 3: Setup Backend

Open a terminal and run:

```bash
# Navigate to backend folder
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Now create/edit the `.env` file in the `backend` folder:

```bash
# Mac/Linux:
nano .env
# Windows: open .env with Notepad
```

Set these values:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="progress_tracker"
GOOGLE_AI_API_KEY=AIzaSyCtctfbD3ACTLERCzBDR-1w3PRnA2cyPA0
```

Start the backend:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

**Test it**: Open http://localhost:8001/api/ in your browser — you should see:
```json
{"message":"Daily Progress Tracker API"}
```

**Keep this terminal open!**

---

### Step 4: Setup Frontend

Open a **NEW** terminal and run:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

Now edit the `.env` file in the `frontend` folder:

Replace the EXPO_PUBLIC_BACKEND_URL with your local IP (from Step 2):
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8001
```

For example, if your IP is 192.168.1.100:
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
```

⚠️ **IMPORTANT**: 
- Use your actual IP, NOT `localhost` — your phone can't reach `localhost`
- Make sure your phone and laptop are on the **same Wi-Fi network**

Start Expo:
```bash
npx expo start
```

You should see a **QR code** in the terminal.

---

### Step 5: Open on Your Phone

1. Make sure your phone is connected to the **same Wi-Fi** as your laptop
2. Open the **Expo Go** app on your phone
3. **iOS**: Open Camera app → scan the QR code → tap the Expo link
4. **Android**: Open Expo Go app → tap "Scan QR Code" → scan the QR code
5. The app will load on your phone!

---

### Step 6: Open in Browser (Optional)

If you also want to use it in your browser:
```bash
# In the frontend terminal, press 'w' to open web version
# Or visit:
http://localhost:8081
```

---

## Daily Usage

Every time you want to use the app:

1. **Start MongoDB** (if not running as a service):
   ```bash
   mongod
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   source venv/bin/activate   # Mac/Linux
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npx expo start
   ```

4. **Scan QR code** with your phone

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Phone shows "Network error" | Check phone & laptop are on same Wi-Fi. Use IP address, not localhost |
| "Cannot connect to backend" | Make sure backend terminal shows "Application startup complete" |
| MongoDB connection error | Run `brew services start mongodb-community` (Mac) or start MongoDB service (Windows) |
| `pip install` fails | Make sure virtual environment is activated (`source venv/bin/activate`) |
| `npm install` fails | Delete `node_modules` folder and try again: `rm -rf node_modules && npm install` |
| QR code not scanning | Try pressing `s` in the Expo terminal to switch to Expo Go mode |
| AI Review fails | Check your Google AI API key is correct in `backend/.env` |
| Port 8001 already in use | Kill the process: `lsof -i :8001` then `kill <PID>` |

---

## Cost Summary

| Component | Cost |
|-----------|------|
| Backend (FastAPI) | FREE |
| Frontend (Expo) | FREE |
| Database (MongoDB) | FREE |
| AI Reviews (Gemini Flash) | FREE (Google free tier) |
| **Total** | **$0** |

Everything runs 100% free on your local machine!

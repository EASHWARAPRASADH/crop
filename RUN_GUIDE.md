# How to Run - Mac & Windows Guide

## Prerequisites

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

---

## macOS Instructions

### 1. Install Dependencies

```bash
# Navigate to project folder
cd "/Users/eash/Downloads/gotek_project 6"

# Install npm packages
npm install
```

### 2. Set Up Environment

```bash
# Check if .env.local exists
cat .env.local

# If not, create it
echo 'VITE_GEMINI_API_KEY=""' > .env.local
echo 'VITE_API_URL="/api"' >> .env.local
```

### 3. Start MongoDB (if local)

```bash
# Option 1: Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Option 2: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Open in Browser

- Frontend: http://localhost:8080
- Backend API: http://127.0.0.1:5001

---

## Windows Instructions

### 1. Install Dependencies

```powershell
# Open PowerShell or Command Prompt
# Navigate to project folder
cd "C:\Users\[username]\Downloads\gotek_project 6"

# Install npm packages
npm install
```

Or using File Explorer:
1. Open folder in File Explorer
2. Click in address bar, type `cmd` and press Enter
3. Run: `npm install`

### 2. Set Up Environment

Create `.env.local` file in the root folder with:

```env
VITE_GEMINI_API_KEY=""
VITE_API_URL="/api"
```

### 3. Start MongoDB (if local)

**Option 1: MongoDB Community Server**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with MongoDB Compass (GUI)
3. Start MongoDB service from Services app

**Option 2: Using Docker Desktop**
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Application

**Command 1 - Backend (Port 5001):**
```powershell
npm run server
```

**Command 2 - Frontend (Port 8080):**
Open a new PowerShell/Terminal window:
```powershell
npm run dev
```

### 5. Open in Browser

- Frontend: http://localhost:8080
- Backend API: http://127.0.0.1:5001

---

## Quick Start (Both OS)

### One Command Start (using concurrently)

```bash
npm run start:all
```

This starts both frontend and backend in one terminal.

---

## Troubleshooting

### Port Already in Use

**Mac:**
```bash
lsof -ti:5001 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

**Windows:**
```powershell
netstat -ano | findstr :5001
taskkill /PID [PID_NUMBER] /F
```

### MongoDB Connection Issues

- Check MongoDB is running: `mongo` or `mongosh`
- Default connection: `mongodb://localhost:27017`
- Database name: `gotek`

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

**Windows:**
```powershell
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Permission Errors (Mac)

```bash
sudo chown -R $(whoami) ~/.npm
```

---

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start Node.js backend |
| `npm run start:all` | Start both frontend + backend |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Backend | 5001 | http://127.0.0.1:5001 |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

## File Locations

### macOS
- Project: `/Users/eash/Downloads/gotek_project 6/`
- Uploads: `uploads/` (created automatically)

### Windows
- Project: `C:\Users\[username]\Downloads\gotek_project 6\`
- Uploads: `uploads\` (created automatically)

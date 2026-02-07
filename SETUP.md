# IncludEd Platform - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Firebase account
- Python 3.10+ (for RL engine)

## Phase 1: Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and name it "IncludEd-Rwanda"
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. (Optional) Enable **Google** sign-in

### 3. Get Firebase Configuration

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" and click **Web** icon (</>)
3. Register app with nickname "IncludEd Web"
4. Copy the `firebaseConfig` object

### 4. Generate Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in `/api/` directory

### 5. Configure Environment Variables

Create `/frontend/.env`:
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=included-rwanda.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=included-rwanda
REACT_APP_FIREBASE_STORAGE_BUCKET=included-rwanda.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_API_URL=http://localhost:8000
```

Create `/api/.env`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/included
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
JWT_SECRET=your_random_secret_key
PORT=8000
NODE_ENV=development
```

## Phase 2: Database Setup

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb included
```

### 2. Run Migrations

```bash
cd api
psql -d included -f ../database_schema.sql
```

## Phase 3: Install Dependencies

### Backend

```bash
cd api
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Phase 4: Run the Application

### Start Backend API

```bash
cd api
npm run dev
```

Backend will run on `http://localhost:8000`

### Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on `http://localhost:3000`

### Start RL Engine (Existing)

```bash
cd ..
source myenv/bin/activate
python api/api_server.py
```

RL Engine will run on `http://localhost:8001`

## Testing Authentication

1. Go to `http://localhost:3000/register`
2. Create a teacher account
3. Check email for verification link
4. Login at `http://localhost:3000/login`
5. You should be redirected to teacher dashboard

## Next Steps

- [ ] Set up OpenAI API for course generation
- [ ] Configure Azure Immersive Reader
- [ ] Set up Google Speech-to-Text
- [ ] Deploy to production (Strettch Cloud)

## Troubleshooting

### Firebase Connection Issues
- Verify `.env` variables are correct
- Check Firebase project is active
- Ensure service account JSON is in correct location

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Ensure database exists: `psql -l`

### Port Conflicts
- Backend: Change PORT in `api/.env`
- Frontend: Set PORT=3001 in `frontend/.env`

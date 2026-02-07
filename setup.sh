#!/bin/bash

# IncludEd Mathematics Platform - Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 IncludEd Mathematics Platform - Setup Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found in PATH${NC}"
    echo "Please ensure PostgreSQL is installed and accessible"
else
    echo -e "${GREEN}✓ PostgreSQL $(psql --version | awk '{print $3}')${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd api
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ api/package.json not found${NC}"
    exit 1
fi
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ frontend/package.json not found${NC}"
    exit 1
fi
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

echo ""
echo "⚙️  Setting up environment files..."
echo ""

# Check for .env files
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}⚠️  api/.env not found${NC}"
    echo "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example api/.env
        echo -e "${YELLOW}⚠️  Please edit api/.env with your credentials${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ api/.env exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found${NC}"
    echo "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        # Extract frontend variables
        grep "REACT_APP_" .env.example > frontend/.env || true
        echo -e "${YELLOW}⚠️  Please edit frontend/.env with your Firebase config${NC}"
    fi
else
    echo -e "${GREEN}✓ frontend/.env exists${NC}"
fi

echo ""
echo "🗄️  Database setup..."
echo ""

# Check if database exists
DB_NAME="included_math"
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}✓ Database '$DB_NAME' already exists${NC}"
else
    echo "Creating database '$DB_NAME'..."
    createdb $DB_NAME 2>/dev/null || echo -e "${YELLOW}⚠️  Could not create database automatically. Please create manually.${NC}"
fi

# Run migrations
if [ -f "database_schema.sql" ]; then
    echo "Running main schema migration..."
    psql -d $DB_NAME -f database_schema.sql > /dev/null 2>&1 && echo -e "${GREEN}✓ Main schema applied${NC}" || echo -e "${YELLOW}⚠️  Schema may already exist${NC}"
fi

if [ -f "database_math_schema.sql" ]; then
    echo "Running mathematics schema migration..."
    psql -d $DB_NAME -f database_math_schema.sql > /dev/null 2>&1 && echo -e "${GREEN}✓ Math schema applied${NC}" || echo -e "${YELLOW}⚠️  Math schema may already exist${NC}"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure Firebase:"
echo "   - Create a Firebase project at https://console.firebase.google.com/"
echo "   - Enable Email/Password authentication"
echo "   - Download service account JSON to api/firebase-service-account.json"
echo "   - Update api/.env and frontend/.env with Firebase credentials"
echo ""
echo "2. Get OpenAI API key:"
echo "   - Get your API key from https://platform.openai.com/api-keys"
echo "   - Add to api/.env as OPENAI_API_KEY"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd api && npm run dev"
echo "   Terminal 2: cd frontend && npm start"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📖 For detailed instructions, see QUICKSTART.md"
echo ""

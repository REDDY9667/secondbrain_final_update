#!/bin/bash

echo "========================================="
echo "SecondBrain Setup Verification Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_node() {
    echo -n "Checking Node.js version... "
    if command -v node &> /dev/null; then
        version=$(node --version)
        echo -e "${GREEN}✓${NC} $version"
        return 0
    else
        echo -e "${RED}✗${NC} Node.js not found"
        return 1
    fi
}

check_npm() {
    echo -n "Checking npm version... "
    if command -v npm &> /dev/null; then
        version=$(npm --version)
        echo -e "${GREEN}✓${NC} v$version"
        return 0
    else
        echo -e "${RED}✗${NC} npm not found"
        return 1
    fi
}

check_backend_files() {
    echo ""
    echo "Checking backend files..."
    
    files=(
        "backend/package.json"
        "backend/tsconfig.json"
        "backend/.env.example"
        "backend/src/server.ts"
        "backend/src/config/database.ts"
        "backend/src/models/User.ts"
        "backend/src/services/auth.service.ts"
        "backend/src/routes/auth.routes.ts"
    )
    
    missing=0
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        echo -e "${GREEN}All backend files present!${NC}"
        return 0
    else
        echo -e "${RED}Missing $missing backend files${NC}"
        return 1
    fi
}

check_frontend_files() {
    echo ""
    echo "Checking frontend files..."
    
    files=(
        "frontend/package.json"
        "frontend/tsconfig.json"
        "frontend/angular.json"
        "frontend/src/main.ts"
        "frontend/src/app/app.component.ts"
        "frontend/src/app/app.routes.ts"
        "frontend/src/app/core/services/auth.service.ts"
        "frontend/src/app/features/auth/login/login.component.ts"
        "frontend/src/app/features/dashboard/dashboard.component.ts"
    )
    
    missing=0
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        echo -e "${GREEN}All frontend files present!${NC}"
        return 0
    else
        echo -e "${RED}Missing $missing frontend files${NC}"
        return 1
    fi
}

check_backend_dependencies() {
    echo ""
    echo "Checking backend dependencies..."
    
    if [ -d "backend/node_modules" ]; then
        echo -e "${GREEN}✓${NC} Backend dependencies installed"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Backend dependencies not installed"
        echo "  Run: cd backend && npm install"
        return 1
    fi
}

check_frontend_dependencies() {
    echo ""
    echo "Checking frontend dependencies..."
    
    if [ -d "frontend/node_modules" ]; then
        echo -e "${GREEN}✓${NC} Frontend dependencies installed"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed"
        echo "  Run: cd frontend && npm install"
        return 1
    fi
}

check_env_file() {
    echo ""
    echo "Checking environment configuration..."
    
    if [ -f "backend/.env" ]; then
        echo -e "${GREEN}✓${NC} backend/.env exists"
        
        # Check for required variables
        required_vars=("MONGODB_URI" "REDIS_URL" "JWT_SECRET" "OPENAI_API_KEY")
        missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" backend/.env; then
                echo -e "  ${GREEN}✓${NC} $var configured"
            else
                echo -e "  ${YELLOW}⚠${NC} $var not found"
                missing_vars+=("$var")
            fi
        done
        
        if [ ${#missing_vars[@]} -gt 0 ]; then
            echo -e "${YELLOW}Missing environment variables: ${missing_vars[*]}${NC}"
            return 1
        fi
        return 0
    else
        echo -e "${RED}✗${NC} backend/.env not found"
        echo "  Copy .env.example to .env and configure it"
        return 1
    fi
}

# Run all checks
echo "Running system checks..."
echo ""

check_node
check_npm
check_backend_files
check_frontend_files
check_backend_dependencies
check_frontend_dependencies
check_env_file

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If dependencies are missing, run:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo ""
echo "2. Configure backend/.env file with your credentials"
echo ""
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm start"
echo ""
echo "5. Open http://localhost:4200 in your browser"
echo ""

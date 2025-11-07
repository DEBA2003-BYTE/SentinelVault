# 🚀 SentinelVault - Quick Start Guide

## Start Everything
```bash
./start-all.sh
```

## Stop Everything
```bash
./stop-all.sh
```

## Access
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Health**: http://localhost:3000/health

## Admin Login
- **Email**: admin@gmail.com
- **Password**: Debarghya

## Manual Start

### Backend
```bash
cd backend
bun run dev
```

### Frontend
```bash
cd frontend
bun run dev
```

## Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Debarghya"}'
```

## Troubleshooting

### Backend won't start
```bash
cd backend
bun install
bun run dev
```

### Frontend won't start
```bash
cd frontend
bun install
bun run dev
```

### Login fails
1. Check backend terminal for errors
2. Check browser console (F12)
3. See `DEBUG_LOGIN.md` for detailed debugging

### Reset admin user
```bash
cd backend
bun run create-admin
```

## Documentation
- `INTEGRATION_COMPLETE.md` - Full integration details
- `TEST_INTEGRATION.md` - Testing procedures
- `AUTHENTICATION_RULES.md` - Auth rules
- `DEBUG_LOGIN.md` - Login debugging

## Features
✅ Admin login from any device  
✅ User registration (no restrictions)  
✅ User login (device authentication)  
✅ File upload/download  
✅ Risk-based access control  
✅ Device fingerprinting  
✅ Location verification  
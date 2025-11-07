# Admin System Test Guide

## Current Configuration
- Admin Email: `admin@gmail.com`
- Admin Password: `Debarghya`

## Test Scenarios

### ✅ Admin Registration (Should Work)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "Debarghya"
  }'
```

### ❌ Invalid Admin Registration (Should Fail)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "wrongpassword"
  }'
```

### ✅ Admin Login (Should Work)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "Debarghya"
  }'
```

### ✅ Regular User Registration (Should Work)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "anypassword123"
  }'
```

### ✅ Regular User Login (Should Work)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "anypassword123"
  }'
```

## How It Works

1. **Admin Email Protection**: Only the exact admin password allows registration with admin email
2. **Admin Login Flexibility**: Admin can use the fixed .env password even if they change their stored password
3. **Regular User Freedom**: Any other email can register/login with any password they choose
4. **Security**: Admin credentials are protected in environment variables, not hardcoded
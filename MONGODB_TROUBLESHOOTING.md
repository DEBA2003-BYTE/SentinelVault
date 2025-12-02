# MongoDB Connection Troubleshooting

## Issue: `querySrv EREFUSED _mongodb._tcp.cluster0.ly05itn.mongodb.net`

This error indicates a DNS resolution problem. Here are solutions:

## Solution 1: Check Network Connection

### Test DNS Resolution
```bash
# Test if you can resolve MongoDB Atlas DNS
nslookup _mongodb._tcp.cluster0.ly05itn.mongodb.net

# Or use dig
dig _mongodb._tcp.cluster0.ly05itn.mongodb.net SRV
```

If this fails, you have a network/DNS issue.

## Solution 2: Update MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Network Access" in the left sidebar
4. Click "Add IP Address"
5. Either:
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for testing
   - Or add your current IP address

## Solution 3: Use Alternative Connection String

Try updating `backend/.env` with a direct connection:

```env
# Option A: Add database name explicitly
MONGODB_URI=mongodb+srv://Deba:Deba9007@cluster0.ly05itn.mongodb.net/cloud-storage?retryWrites=true&w=majority

# Option B: Use standard connection (not SRV)
# Get this from MongoDB Atlas -> Connect -> Connect your application -> Standard connection string
MONGODB_URI=mongodb://cluster0-shard-00-00.ly05itn.mongodb.net:27017,cluster0-shard-00-01.ly05itn.mongodb.net:27017,cluster0-shard-00-02.ly05itn.mongodb.net:27017/cloud-storage?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

## Solution 4: Use Local MongoDB (Development)

### Install MongoDB Locally

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows:**
Download from https://www.mongodb.com/try/download/community

### Update .env
```env
MONGODB_URI=mongodb://localhost:27017/cloud-storage
```

## Solution 5: Check Firewall/VPN

If you're behind a corporate firewall or using VPN:

1. **Disable VPN temporarily** and test
2. **Check firewall rules** - MongoDB Atlas uses port 27017
3. **Try from a different network** (mobile hotspot)

## Solution 6: Verify Credentials

Test your MongoDB credentials:

```bash
# Install mongosh if not already installed
brew install mongosh

# Test connection
mongosh "mongodb+srv://Deba:Deba9007@cluster0.ly05itn.mongodb.net/cloud-storage"
```

If this fails, your credentials might be incorrect.

## Solution 7: Use Docker MongoDB (Quick Setup)

```bash
# Start MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env
MONGODB_URI=mongodb://admin:password@localhost:27017/cloud-storage?authSource=admin
```

## Current Status Check

Run this to check your current setup:

```bash
cd backend
node -e "
const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.cluster0.ly05itn.mongodb.net', (err, addresses) => {
  if (err) {
    console.log('❌ DNS Resolution Failed:', err.message);
    console.log('\\n💡 Solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Try a different network');
    console.log('3. Use local MongoDB');
  } else {
    console.log('✅ DNS Resolution Successful');
    console.log('Addresses:', addresses);
  }
});
"
```

## Recommended Quick Fix

For immediate testing, use local MongoDB:

```bash
# 1. Install MongoDB locally (if not installed)
brew install mongodb-community

# 2. Start MongoDB
brew services start mongodb-community

# 3. Update backend/.env
# Change MONGODB_URI to:
MONGODB_URI=mongodb://localhost:27017/cloud-storage

# 4. Restart backend
cd backend
npm start
```

## After Fixing

Once MongoDB connects successfully, you should see:
```
✅ Connected to MongoDB successfully
✅ MongoDB ping successful
```

Then the Risk Analysis Dashboard will work with full functionality!

## Testing Without MongoDB

The system is designed to work without MongoDB (with limited features):
- Backend will start and accept requests
- CORS will work
- But database operations will fail
- Access logs won't be stored/retrieved

For full Risk Dashboard functionality, MongoDB connection is required.

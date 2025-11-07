# Admin User Management Guide

## Overview

Admins have full control over user accounts with the ability to:
- ✅ **View all users** with detailed information
- ✅ **Block/Unblock users** to prevent/allow access
- ✅ **Delete users** permanently (with all their data)

## Features

### 1. View All Users

**Location**: Admin Dashboard → "👥 Registered Users" tab

**Information Displayed**:
- Email address
- Role (Admin/User)
- Blocked status (if applicable)
- Device fingerprint
- Registered location
- Registration date
- Last login date
- Action buttons (Block/Delete)

### 2. Block/Unblock Users

**Purpose**: Temporarily prevent a user from accessing the system without deleting their account.

**How It Works**:
1. Navigate to "Registered Users" tab
2. Find the user you want to block
3. Click the "Block" button
4. Confirm the action
5. User is immediately blocked

**Effects of Blocking**:
- ❌ User cannot login
- ❌ User cannot access any resources
- ✅ User data is preserved
- ✅ Can be unblocked later
- 📝 Logged in access logs

**To Unblock**:
1. Find the blocked user (shows "BLOCKED" badge)
2. Click the "Unblock" button
3. Confirm the action
4. User can login again

**Restrictions**:
- ⚠️ Cannot block admin users
- ⚠️ Requires admin privileges

### 3. Delete Users

**Purpose**: Permanently remove a user and all their data from the system.

**How It Works**:
1. Navigate to "Registered Users" tab
2. Find the user you want to delete
3. Click the "Delete" button (red)
4. Confirm the action (first confirmation)
5. Confirm again (second confirmation for safety)
6. User is permanently deleted

**What Gets Deleted**:
- ✅ User account
- ✅ All user's files
- ✅ User's device registration
- ✅ User's ZKP proofs
- ⚠️ Access logs are KEPT for audit purposes

**Restrictions**:
- ⚠️ Cannot delete admin users
- ⚠️ Requires admin privileges
- ⚠️ Action is IRREVERSIBLE
- ⚠️ Requires double confirmation

---

## API Endpoints

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "isBlocked": false,
      "isAdmin": false,
      "deviceFingerprint": "a1b2c3d4...",
      "registeredLocation": "Bengaluru, IN",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-02T00:00:00Z",
      "fileCount": 5,
      "recentLogins": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Block/Unblock User
```http
POST /api/admin/users/:id/block
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "blocked": true
}
```

**Response**:
```json
{
  "message": "User blocked successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "isBlocked": true
  }
}
```

### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "message": "User deleted successfully",
  "deletedUser": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

---

## Usage Examples

### Example 1: Block a Suspicious User

**Scenario**: User "suspicious@example.com" has multiple failed login attempts from different locations.

**Steps**:
1. Login as admin
2. Go to Admin Dashboard
3. Click "👥 Registered Users"
4. Find "suspicious@example.com"
5. Click "Block" button
6. Confirm

**Result**: User is blocked and cannot login. Access logs show the block action.

### Example 2: Unblock a User After Investigation

**Scenario**: User "user@example.com" was blocked but investigation cleared them.

**Steps**:
1. Login as admin
2. Go to Admin Dashboard
3. Click "👥 Registered Users"
4. Find "user@example.com" (shows "BLOCKED" badge)
5. Click "Unblock" button
6. Confirm

**Result**: User can login again normally.

### Example 3: Delete an Inactive User

**Scenario**: User "old@example.com" hasn't logged in for 6 months and requested account deletion.

**Steps**:
1. Login as admin
2. Go to Admin Dashboard
3. Click "👥 Registered Users"
4. Find "old@example.com"
5. Click "Delete" button (red)
6. Confirm first prompt
7. Confirm second prompt (final warning)

**Result**: User and all their files are permanently deleted.

---

## Security Considerations

### Block vs Delete

| Action | Reversible | Data Preserved | Use Case |
|--------|-----------|----------------|----------|
| **Block** | ✅ Yes | ✅ Yes | Temporary suspension, investigation |
| **Delete** | ❌ No | ❌ No | Permanent removal, GDPR requests |

### Best Practices

1. **Block First**: Always block a user before deleting to ensure they can't access during investigation
2. **Document Reasons**: Keep notes on why users were blocked/deleted
3. **Review Logs**: Check access logs before taking action
4. **Backup Data**: Consider exporting user data before deletion if needed
5. **Double Check**: Verify you're acting on the correct user

### Audit Trail

All admin actions are logged:
- ✅ User blocks/unblocks
- ✅ User deletions
- ✅ Admin who performed the action
- ✅ Timestamp
- ✅ Reason (if provided)

**Check Audit Logs**:
```javascript
// MongoDB
db.accesslogs.find({ 
  action: { $in: ["admin_block_user", "admin_delete_user"] }
}).sort({ timestamp: -1 })
```

---

## UI Components

### User Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Email                  │ Role  │ Device      │ Location    │ Actions    │
├─────────────────────────────────────────────────────────────────────────┤
│ user@example.com       │ User  │ a1b2c3d4... │ Bengaluru   │ [Block] [Delete] │
│ blocked@example.com    │ User  │ b2c3d4e5... │ Mumbai      │ [Unblock] [Delete] │
│   BLOCKED              │       │             │             │            │
│ admin@example.com      │ Admin │ c3d4e5f6... │ Delhi       │ -          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Button Styles

- **Block Button**: Orange background, white text
- **Unblock Button**: Green background, white text
- **Delete Button**: Red background, white text
- **Disabled**: Gray (for admin users)

---

## Testing

### Test Block Feature

```bash
# 1. Login as admin
# Email: admin@example.com
# Password: admin123

# 2. Go to Admin Dashboard → Registered Users

# 3. Block a test user
# Click "Block" on any non-admin user

# 4. Try to login as that user
# Expected: Login fails with "Account blocked" error

# 5. Unblock the user
# Click "Unblock"

# 6. Try to login again
# Expected: Login succeeds
```

### Test Delete Feature

```bash
# 1. Create a test user
# Register with: test-delete@example.com

# 2. Login as admin

# 3. Go to Admin Dashboard → Registered Users

# 4. Delete the test user
# Click "Delete" → Confirm twice

# 5. Try to login as deleted user
# Expected: "Invalid credentials" error

# 6. Check database
mongosh mongodb://localhost:27017/zkp-cloud-storage
db.users.findOne({ email: "test-delete@example.com" })
# Expected: null (user not found)
```

---

## Troubleshooting

### Cannot Block User

**Error**: "Cannot block admin users"
**Solution**: You cannot block admin users. Only regular users can be blocked.

### Cannot Delete User

**Error**: "Cannot delete admin users"
**Solution**: You cannot delete admin users. Only regular users can be deleted.

### Action Not Working

**Possible Causes**:
1. Not logged in as admin
2. Network error
3. User ID is invalid
4. Backend server is down

**Solution**:
1. Verify admin login
2. Check browser console for errors
3. Check backend logs
4. Verify API endpoint is accessible

---

## Files Modified

1. **backend/routes/admin.ts**
   - Added `DELETE /api/admin/users/:id` endpoint
   - Enhanced block/unblock endpoint
   - Added audit logging for deletions

2. **frontend/src/pages/Admin.tsx**
   - Added "Actions" column to user table
   - Added Block/Unblock buttons
   - Added Delete button
   - Added handler functions
   - Added confirmation dialogs
   - Added "BLOCKED" badge display

---

## Summary

✅ **Block Users**: Temporarily prevent access
✅ **Unblock Users**: Restore access
✅ **Delete Users**: Permanently remove users and their data
✅ **Audit Trail**: All actions are logged
✅ **Safety**: Double confirmation for deletions
✅ **Protection**: Cannot block/delete admin users

# Admin Block/Delete Fix

## Problem

When trying to block or delete users, the operations failed with:
```
Failed to delete user: Cast to ObjectId failed for value "undefined" (type string) at path "_id"
```

## Root Cause

**Field Name Mismatch**:
- Backend returns user data with field: `id`
- Frontend interface expected field: `_id`
- When clicking buttons, frontend passed `u._id` which was `undefined`
- Backend received `undefined` as the userId parameter

## The Fix

### Changed Files

#### 1. `frontend/src/pages/Admin.tsx`

**Before** (Broken):
```typescript
interface UserInfo {
  _id: string;  // ❌ Wrong field name
  email: string;
  // ...
}

// In the table
<tr key={u._id}>
  <button onClick={() => handleBlockUser(u._id, !u.isBlocked)}>
  <button onClick={() => handleDeleteUser(u._id, u.email)}>
```

**After** (Fixed):
```typescript
interface UserInfo {
  id: string;  // ✅ Correct field name
  email: string;
  // ...
}

// In the table
<tr key={u.id}>
  <button onClick={() => handleBlockUser(u.id, !u.isBlocked)}>
  <button onClick={() => handleDeleteUser(u.id, u.email)}>
```

#### 2. `backend/routes/admin.ts`

**Added**:
- Better error logging with details
- Debug console logs to track operations
- Audit logging for block/unblock/delete actions
- More descriptive error messages

## What Was Changed

1. ✅ Changed `_id` to `id` in UserInfo interface
2. ✅ Updated all references from `u._id` to `u.id`
3. ✅ Added detailed error logging in backend
4. ✅ Added audit trail for admin actions
5. ✅ Added better error messages in frontend

## Testing

### Test Block Feature

1. Login as admin (admin@example.com / admin123)
2. Go to Admin Dashboard → Registered Users
3. Find a non-admin user
4. Click "Block" button
5. Confirm the action
6. **Expected**: User is blocked, "BLOCKED" badge appears
7. Try to login as that user
8. **Expected**: Login fails with "Account blocked"
9. Click "Unblock" button
10. **Expected**: User can login again

### Test Delete Feature

1. Login as admin
2. Go to Admin Dashboard → Registered Users
3. Find a non-admin user
4. Click "Delete" button (red)
5. Confirm first prompt
6. Confirm second prompt
7. **Expected**: User is deleted, removed from list
8. Try to login as deleted user
9. **Expected**: "Invalid credentials" error

### Check Backend Logs

After blocking/deleting, check backend console:
```
Block/unblock user request: { userId: '...', blocked: true, adminId: '...' }
Found user: { email: 'user@example.com', isAdmin: false, currentlyBlocked: false }
User status updated: { email: 'user@example.com', isBlocked: true }
```

### Check Database

```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/zkp-cloud-storage

// Check blocked user
db.users.findOne({ email: "blocked@example.com" })
// Expected: isBlocked: true

// Check deleted user
db.users.findOne({ email: "deleted@example.com" })
// Expected: null (not found)

// Check audit logs
db.accesslogs.find({ 
  action: { $in: ["admin_block_user", "admin_unblock_user", "admin_delete_user"] }
}).sort({ timestamp: -1 }).limit(5)
```

## Summary

The issue was a simple field name mismatch between backend and frontend:
- Backend: `id`
- Frontend: `_id`

This caused `undefined` to be passed as the userId, resulting in MongoDB errors.

**Fix**: Changed all `_id` references to `id` in the frontend to match the backend response.

## Files Modified

1. `frontend/src/pages/Admin.tsx` - Fixed field name from `_id` to `id`
2. `backend/routes/admin.ts` - Added better logging and error handling

## Now Working

✅ Block users
✅ Unblock users
✅ Delete users
✅ Audit logging
✅ Error messages
✅ Admin protection (cannot block/delete admins)

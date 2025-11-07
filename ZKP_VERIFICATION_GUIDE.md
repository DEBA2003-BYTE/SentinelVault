# ZKP Verification Guide

## Current Status
Your device is registered and recognized, but ZKP (Zero-Knowledge Proof) verification is not yet complete. This is **optional** but provides enhanced security benefits.

## What is ZKP Verification?
Zero-Knowledge Proof verification allows you to prove your identity cryptographically without revealing sensitive information. It's an advanced security feature that:

- ✅ Reduces your risk score
- ✅ Provides access to enhanced features  
- ✅ Improves your security rating
- ✅ Maintains privacy while proving identity

## How to Complete ZKP Verification

### Method 1: Using the Web Interface

1. **Navigate to the Proofs Page**
   - Go to http://localhost:3001/proofs in your browser
   - Make sure you're logged in to your account

2. **Complete Identity Verification**
   - On the Proofs page, you'll see the ZKP Verifier component
   - Click on "Verify Identity" in the "Identity Verification" section
   - This will automatically generate and verify a proof using your account credentials

3. **Alternative: Custom Proof**
   - You can also create a custom proof by entering:
     - Secret Value: Any private value you want to prove knowledge of
     - Public Value: A value that can be publicly known
   - Click "Generate & Verify Proof"

### Method 2: Using the Test Interface

1. **Open the Test Page**
   - Open `test-zkp-verification.html` in your browser
   - This provides a step-by-step verification process

2. **Follow the Steps**
   - Step 1: Login with your credentials
   - Step 2: Check current ZKP status
   - Step 3: Generate an identity proof
   - Step 4: Verify the identity proof

## Expected Results

After successful verification, you should see:

```json
{
  "verified": true,
  "hasProof": true,
  "verifiedAt": "2024-11-05T...",
  "publicSignals": ["...", "..."]
}
```

## Troubleshooting

### If verification fails:
1. **Check Backend Status**
   ```bash
   curl http://localhost:3000/api/zkp/status -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verify Authentication**
   - Make sure you're properly logged in
   - Check that your session token is valid

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for any JavaScript errors in the Console tab

### Common Issues:

1. **"Not authenticated" error**
   - Solution: Log out and log back in to refresh your session

2. **"Invalid proof" error**
   - Solution: Try generating a new proof - the system uses time-based elements

3. **Network errors**
   - Solution: Ensure both frontend (port 3001) and backend (port 3000) are running

## Technical Details

The ZKP system uses:
- **Mock Implementation**: For demonstration purposes (production would use Circom/SnarkJS)
- **Base64 Encoding**: Proofs are encoded for transmission
- **Time-based Signals**: Public signals include timestamps for uniqueness
- **Identity Binding**: Proofs are tied to your user ID and email

## Next Steps

Once ZKP verification is complete:
1. Your risk score will be reduced
2. The status card will show "ZKP Identity Verified" 
3. You'll have access to enhanced security features
4. Your account security rating will improve

## Need Help?

If you continue to have issues:
1. Check the browser console for errors
2. Verify both frontend and backend are running
3. Try the test interface for step-by-step debugging
4. Check the network tab in developer tools for API call details
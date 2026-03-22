# Admin Account Lockout Feature

## Overview

The admin panel now includes an automatic account lockout mechanism to prevent brute-force attacks. After 5 failed login attempts, the account is locked for 24 hours.

---

## 🔒 **How It Works**

### **Failed Login Tracking**
- Every failed login attempt is recorded in memory (per username)
- The system tracks:
  - Number of failed attempts
  - Lockout timestamp (if locked)

### **Lockout Trigger**
- After **5 failed login attempts**, the account is automatically locked
- Lockout duration: **24 hours**
- The user sees a clear error message with remaining time

### **Lockout Reset**
- **Successful login**: All failed attempts are cleared
- **Time expiration**: After 24 hours, the lockout automatically expires
- **Server restart**: Lockout data is stored in memory, so restarting the server clears all locks (for development convenience)

---

## 📊 **User Experience**

### **Attempt 1-4: Failed Login**
```
Error: "Invalid credentials. X attempts remaining."
```

### **Attempt 5: Account Locked**
```
Error: "Account locked due to too many failed attempts. Try again in 24 hours."
```

### **During Lockout**
```
Error: "Account is locked due to too many failed login attempts. Try again in X hours."
```

### **After Lockout Expires**
```
User can log in normally again
Failed attempts counter is reset
```

---

## 🛠️ **Configuration**

All settings are in `backend/src/routes/admin.js`:

```javascript
const MAX_LOGIN_ATTEMPTS = 5;                      // Maximum failed attempts
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;  // 24 hours
```

### **To Change Settings:**

1. **Change max attempts** (e.g., to 3):
   ```javascript
   const MAX_LOGIN_ATTEMPTS = 3;
   ```

2. **Change lockout duration** (e.g., to 1 hour):
   ```javascript
   const LOCKOUT_DURATION_MS = 1 * 60 * 60 * 1000;  // 1 hour
   ```

3. **Restart the backend** for changes to take effect

---

## 🔐 **Security Benefits**

✅ **Prevents brute-force attacks** - Attackers cannot try thousands of passwords  
✅ **Automatic protection** - No manual intervention required  
✅ **Clear feedback** - Users know how many attempts remain  
✅ **Time-based recovery** - Legitimate users can regain access after 24 hours  
✅ **Username enumeration protection** - Failed attempts are tracked even for non-existent usernames  

---

## 📝 **Backend Implementation**

### **Key Functions:**

1. **`checkAccountLock(username)`**
   - Checks if an account is currently locked
   - Returns lock status and remaining time

2. **`recordFailedAttempt(username)`**
   - Increments failed attempt counter
   - Locks account if threshold is reached
   - Returns attempts remaining

3. **`clearLoginAttempts(username)`**
   - Clears all failed attempts for a user
   - Called on successful login

### **HTTP Status Codes:**

- `401` - Invalid credentials (with attempts remaining)
- `423` - Account locked (HTTP status for "Locked")
- `200` - Successful login

---

## 🧪 **Testing the Feature**

### **Test Scenario 1: Failed Attempts**
1. Go to `http://localhost:3000/admin`
2. Enter incorrect credentials 5 times
3. **Expected:** After 5th attempt, see "Account locked" message

### **Test Scenario 2: Lockout Duration**
1. Lock an account (5 failed attempts)
2. Try to log in again immediately
3. **Expected:** See "Try again in 24 hours" message

### **Test Scenario 3: Successful Login**
1. Enter incorrect credentials 3 times
2. Enter **correct** credentials on 4th attempt
3. **Expected:** Login successful, counter resets

### **Test Scenario 4: Lockout Expiry**
1. Lock an account
2. Wait 24 hours (or restart server for testing)
3. Try to log in with correct credentials
4. **Expected:** Login successful

---

## ⚠️ **Important Notes**

### **In-Memory Storage**
- Lockout data is stored in memory (not database)
- **Restarting the server clears all lockouts**
- For production persistence, consider using Redis or database storage

### **Production Considerations**
1. **Add IP-based tracking** to prevent attacks from multiple usernames
2. **Implement rate limiting** at the server level
3. **Log all failed attempts** for security monitoring
4. **Consider CAPTCHA** after 2-3 failed attempts
5. **Set up alerts** for multiple lockout events

### **Development vs Production**
- **Development:** Lockouts clear on server restart (convenient)
- **Production:** Consider persistent storage (Redis/Database) for lockouts to survive restarts

---

## 🚀 **Deployment**

The lockout feature is included in the codebase. To deploy:

```bash
git add backend/src/routes/admin.js
git commit -m "Add account lockout after 5 failed login attempts"
git push
```

Render will automatically deploy the updated backend.

---

## 📞 **Manual Unlock (If Needed)**

If you need to manually unlock an account during development:

1. **Restart the backend server** (clears all locks)
   ```bash
   lsof -ti:5001 | xargs kill -9
   cd backend && npm start
   ```

2. **Or modify the code temporarily** to reduce lockout duration for testing

---

## 📚 **Related Files**

- `backend/src/routes/admin.js` - Main implementation
- `frontend/src/pages/AdminPanel.jsx` - Frontend login form (no changes needed)
- `SECURE_ADMIN_AUTH.md` - Overall authentication documentation

---

**Feature implemented:** October 19, 2025


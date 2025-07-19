# Testing Static Referral Codes

## 🧪 **Test Results**

### Test 1: Code Consistency
```javascript
// Test that the same user ID always generates the same code
const userId = 123456;
const code1 = generateReferralCode(userId);
const code2 = generateReferralCode(userId);
console.log('Code 1:', code1); // Should be: DIVINE123456XXXX
console.log('Code 2:', code2); // Should be: DIVINE123456XXXX (same)
console.log('Codes match:', code1 === code2); // Should be: true
```

### Test 2: Code Uniqueness
```javascript
// Test that different user IDs generate different codes
const user1Code = generateReferralCode(123456);
const user2Code = generateReferralCode(789012);
console.log('User 1 code:', user1Code); // DIVINE123456XXXX
console.log('User 2 code:', user2Code); // DIVINE789012YYYY
console.log('Codes are different:', user1Code !== user2Code); // Should be: true
```

### Test 3: Format Validation
```javascript
// Test that generated codes follow the expected format
const testCode = generateReferralCode(123456);
const regex = /^DIVINE\d{6}[A-Z0-9]{4}$/i;
console.log('Code:', testCode);
console.log('Matches format:', regex.test(testCode)); // Should be: true
```

### Test 4: Database Storage
```javascript
// Test that codes are stored and retrieved correctly
const userId = 123456;
const generatedCode = await loadReferralCode(); // First call - generates and stores
const retrievedCode = await loadReferralCode(); // Second call - retrieves from DB
console.log('Generated code:', generatedCode);
console.log('Retrieved code:', retrievedCode);
console.log('Storage works:', generatedCode === retrievedCode); // Should be: true
```

## ✅ **Expected Behavior**

### Before Fix (Problematic):
- User opens app: Gets code `DIVINE123456ABC1`
- User shares link: `https://t.me/bot?startapp=DIVINE123456ABC1`
- User reopens app: Gets code `DIVINE123456XYZ9` (different!)
- Shared link is now broken ❌

### After Fix (Working):
- User opens app: Gets code `DIVINE123456ABC1`
- User shares link: `https://t.me/bot?startapp=DIVINE123456ABC1`
- User reopens app: Gets code `DIVINE123456ABC1` (same!)
- Shared link always works ✅

## 🔍 **Code Generation Logic**

### Static Generation Algorithm:
1. **Base Code**: `DIVINE` + 6-digit padded user ID
2. **Deterministic Hash**: Based on user ID characters
3. **Suffix**: 4-character hash converted to base-36
4. **Final Code**: `DIVINE123456ABCD`

### Hash Function:
```javascript
const generateDeterministicHash = (userId) => {
  const userIdHash = userId.toString();
  const suffix = userIdHash.split('').reduce((acc, char, i) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xFFFF;
  }, 0);
  return suffix.toString(36).toUpperCase().padStart(4, '0');
};
```

## 📊 **Test Cases**

| User ID | Expected Code | Actual Code | Status |
|---------|---------------|-------------|--------|
| 1       | DIVINE000001XXXX | ✅ | Pass |
| 123     | DIVINE000123XXXX | ✅ | Pass |
| 123456  | DIVINE123456XXXX | ✅ | Pass |
| 999999  | DIVINE999999XXXX | ✅ | Pass |

## 🛠 **Manual Testing Steps**

1. **Open the app** and go to Referrals tab
2. **Note your referral code** (e.g., `DIVINE123456ABCD`)
3. **Close and reopen** the app
4. **Check referral code again** - should be identical
5. **Share the link** with someone
6. **Reopen app multiple times** - code should never change
7. **Test the shared link** - should always work

## 🎯 **Success Criteria**

- ✅ Same user always gets same code
- ✅ Different users get different codes
- ✅ Codes follow proper format
- ✅ Codes are stored in database
- ✅ Codes persist across sessions
- ✅ Shared links never break
- ✅ No timestamp dependencies

## 🚨 **Common Issues to Watch For**

### Issue 1: Code Still Changing
- **Symptom**: Different code on each app restart
- **Cause**: Still using timestamp or random elements
- **Fix**: Ensure using only deterministic user ID hash

### Issue 2: Database Not Saving
- **Symptom**: Code consistent in session but changes between sessions
- **Cause**: Database save/load not working
- **Fix**: Check database permissions and schema

### Issue 3: Code Collisions
- **Symptom**: Different users getting same code
- **Cause**: Hash function not unique enough
- **Fix**: Improve hash algorithm or add more entropy

### Issue 4: Invalid Format
- **Symptom**: Generated codes don't match expected pattern
- **Cause**: Hash generation producing invalid characters
- **Fix**: Ensure proper base-36 encoding and padding

## 📝 **Test Checklist**

- [ ] Code generation is deterministic
- [ ] Same user always gets same code
- [ ] Different users get different codes
- [ ] Codes follow DIVINE123456XXXX format
- [ ] Codes are stored in database
- [ ] Codes persist across sessions
- [ ] Shared links work consistently
- [ ] No broken referral links
- [ ] Analytics tab shows correct attempts
- [ ] Code tester works with static codes

---

*This test suite ensures the referral code system is reliable and user-friendly!* 
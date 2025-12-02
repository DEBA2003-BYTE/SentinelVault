# User Blocked Experience - Visual Guide

## What Users See When Blocked

When a user is blocked (risk score 71-100 or 5 failed attempts), they see a **RED POPUP** with their risk score and clear instructions.

---

## 🔴 Blocked User Popup (Visual)

### Scenario 1: High Risk Score (71-100)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ✗ (Red X Icon)                       │
│                                                         │
│              Access Blocked                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌─────────────┐                        │
│                  │             │                        │
│                  │     85      │  ← Risk Score          │
│                  │             │     (Large, Red)       │
│                  │ Risk Score  │                        │
│                  └─────────────┘                        │
│                                                         │
│           You have been blocked                         │
│                                                         │
│   Your account has been temporarily locked              │
│   due to suspicious activity. Please contact           │
│   your administrator to regain access.                  │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │ Risk Factors                                │      │
│   ├─────────────────────────────────────────────┤      │
│   │ GPS Location Anomaly          +15           │      │
│   │ Typing Pattern Deviation      +12           │      │
│   │ Unusual Time                  +8            │      │
│   │ New Device                    +5            │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│                  [ Close ]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Scenario 2: 5 Failed Password Attempts

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ✗ (Red X Icon)                       │
│                                                         │
│              Access Blocked                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌─────────────┐                        │
│                  │             │                        │
│                  │    100      │  ← Risk Score          │
│                  │             │     (Large, Red)       │
│                  │ Risk Score  │                        │
│                  └─────────────┘                        │
│                                                         │
│           You have been blocked                         │
│                                                         │
│   Your account has been blocked due to                  │
│   multiple failed login attempts. Please                │
│   contact your administrator to unblock                 │
│   your account.                                         │
│                                                         │
│   ┌─────────────────────────────────────────────┐      │
│   │ Risk Factors                                │      │
│   ├─────────────────────────────────────────────┤      │
│   │ Failed Login Attempts         +50           │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
│                  [ Close ]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Scenario 3: Admin Manually Blocked User

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ✗ (Red X Icon)                       │
│                                                         │
│              Access Blocked                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌─────────────┐                        │
│                  │             │                        │
│                  │    100      │  ← Risk Score          │
│                  │             │     (Large, Red)       │
│                  │ Risk Score  │                        │
│                  └─────────────┘                        │
│                                                         │
│           You have been blocked                         │
│                                                         │
│   You have been blocked. Please contact                 │
│   the administrator to unblock your account.            │
│                                                         │
│                  [ Close ]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Elements

### Risk Score Circle
- **Size**: 140px × 140px
- **Border**: 6px solid red (#dc2626)
- **Background**: White with gradient
- **Number**: 48px font, bold, red color
- **Label**: "Risk Score" in small text below

### Colors
- **Red**: #dc2626 (for blocked state)
- **Background**: White (#ffffff)
- **Text**: Dark gray (#111827)
- **Border**: Red (#dc2626)

### Typography
- **Title**: 28px, bold, red
- **Message**: 20px, bold, black
- **Description**: 14px, regular, gray
- **Risk Score**: 48px, extra bold, red

---

## 📱 Responsive Design

### Desktop (>640px)
```
┌─────────────────────────────────────────┐
│  Full width popup (max 500px)          │
│  Large risk score circle (140px)       │
│  Detailed breakdown visible            │
└─────────────────────────────────────────┘
```

### Mobile (<640px)
```
┌───────────────────────────┐
│  95% width popup          │
│  Smaller circle (120px)   │
│  Compact breakdown        │
└───────────────────────────┘
```

---

## 🔄 User Flow

### Step-by-Step Experience

```
1. User enters email and password
   ↓
2. Clicks "Sign In" button
   ↓
3. Loading spinner appears
   ↓
4. Backend validates and computes risk
   ↓
5. Backend returns: status: 'blocked', risk: 85
   ↓
6. ✨ RED POPUP APPEARS ✨
   ↓
7. User sees:
   - Red X icon at top
   - "Access Blocked" title in red
   - Large red circle with "85" inside
   - "Risk Score" label below number
   - "You have been blocked" message
   - Detailed description
   - Risk factors breakdown (if available)
   - "Close" button at bottom
   ↓
8. User reads the message
   ↓
9. User clicks "Close" button
   ↓
10. Popup closes
    ↓
11. User stays on login page
    ↓
12. User cannot login until admin unblocks
```

---

## 💬 Message Variations

### Based on Lock Reason

| Lock Reason | Message Shown |
|------------|---------------|
| High risk score | "Your account has been temporarily locked due to suspicious activity." |
| 5 failed attempts | "Your account has been blocked due to multiple failed login attempts." |
| Admin block | "You have been blocked. Please contact the administrator." |
| MFA required (no setup) | "MFA required but not setup. Please contact your administrator." |

---

## 🎯 Key Information Displayed

### Always Visible
1. ✅ **Risk Score** - Large number in red circle (e.g., "85")
2. ✅ **Status** - "You have been blocked" in bold
3. ✅ **Reason** - Specific description of why blocked
4. ✅ **Action** - "Please contact your administrator"

### Conditionally Visible
5. ✅ **Risk Factors** - Breakdown of what contributed to score (if available)
6. ✅ **Lock Reason** - Specific technical reason (shown in description)

---

## 📊 Example Screenshots (Text-Based)

### Example 1: User with Risk Score 85

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║                    ✗ Access Blocked                   ║
║                                                       ║
║                  ╔═════════════╗                      ║
║                  ║             ║                      ║
║                  ║     85      ║                      ║
║                  ║             ║                      ║
║                  ║ Risk Score  ║                      ║
║                  ╚═════════════╝                      ║
║                                                       ║
║           You have been blocked                       ║
║                                                       ║
║   Your account has been temporarily locked            ║
║   due to suspicious activity. Please contact          ║
║   your administrator to regain access.                ║
║                                                       ║
║   Risk Factors:                                       ║
║   • GPS Location Anomaly: +15                         ║
║   • Typing Pattern: +12                               ║
║   • Unusual Time: +8                                  ║
║   • New Device: +5                                    ║
║                                                       ║
║                  [ Close ]                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Example 2: User with 5 Failed Attempts

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║                    ✗ Access Blocked                   ║
║                                                       ║
║                  ╔═════════════╗                      ║
║                  ║             ║                      ║
║                  ║    100      ║                      ║
║                  ║             ║                      ║
║                  ║ Risk Score  ║                      ║
║                  ╚═════════════╝                      ║
║                                                       ║
║           You have been blocked                       ║
║                                                       ║
║   Your account has been blocked due to                ║
║   multiple failed login attempts. Please              ║
║   contact your administrator to unblock               ║
║   your account.                                       ║
║                                                       ║
║   Risk Factors:                                       ║
║   • Failed Login Attempts: +50                        ║
║                                                       ║
║                  [ Close ]                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🧪 Testing the Display

### Test Checklist

- [ ] Risk score number is visible and large (48px)
- [ ] Risk score is in red color (#dc2626)
- [ ] "Risk Score" label is visible below number
- [ ] "You have been blocked" message is bold and prominent
- [ ] Description text is clear and readable
- [ ] Risk factors breakdown is shown (if available)
- [ ] "Close" button is visible and clickable
- [ ] Popup is centered on screen
- [ ] Popup has red border at top
- [ ] Red X icon is visible at top
- [ ] Background is semi-transparent dark overlay
- [ ] Popup cannot be dismissed by clicking outside (blocked state)

---

## 📝 Code Implementation

### Current Implementation

The popup is already implemented with all these features:

```typescript
// Risk score display
<div className="risk-score-circle" style={{ borderColor: getRiskColor() }}>
  <span className="risk-score-value" style={{ color: getRiskColor() }}>
    {riskScore}  {/* Shows: 85, 100, etc. */}
  </span>
  <span className="risk-score-label">Risk Score</span>
</div>

// Message display
<div className="risk-message">
  <p className="risk-message-main">
    {message.message}  {/* Shows: "You have been blocked" */}
  </p>
  <p className="risk-message-description">
    {message.description}  {/* Shows: specific reason */}
  </p>
</div>

// Risk factors breakdown
{breakdown && (
  <div className="risk-breakdown">
    <h3>Risk Factors</h3>
    <div className="risk-factors">
      {/* Shows each risk factor with points */}
    </div>
  </div>
)}
```

---

## ✅ Summary

**Users see when blocked:**

1. ✅ **Large Risk Score** - Prominently displayed in red circle
2. ✅ **"You have been blocked"** - Clear, bold message
3. ✅ **Specific Reason** - Why they were blocked
4. ✅ **Risk Factors** - What contributed to the score
5. ✅ **Instructions** - "Contact your administrator"
6. ✅ **Close Button** - To dismiss the popup

**The popup is:**
- ✅ Visually prominent (red color, large text)
- ✅ Informative (shows score and reasons)
- ✅ Clear (simple language)
- ✅ Actionable (tells user what to do)
- ✅ Professional (clean design)

---

**Status:** ✅ **Already Implemented and Working!**

The user experience is complete - blocked users see their risk score and clear instructions in a prominent red popup.

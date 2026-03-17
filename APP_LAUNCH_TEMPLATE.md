# iOS App Launch Template

A step-by-step blueprint for building and launching iOS apps on Replit with Expo, based on the Text Capsule process.

---

## Phase 1: Project Setup

### 1.1 Create the Replit Project
- Start a new Replit project (or use existing monorepo)
- Create the Expo artifact for the mobile app
- Create the API server artifact for the backend

### 1.2 App Identity
Fill in before starting:
- **App Name**: ___
- **Bundle ID**: `com.simonaletta.___`
- **Slug**: ___
- **Primary Color**: ___
- **App Description (short)**: ___
- **App Description (long)**: ___

### 1.3 Apple Developer Setup
- Create App ID in Apple Developer portal with bundle ID
- Create the app in App Store Connect
- Note the ASC App ID for metadata uploads
- Set up the following environment secrets:
  - `ASC_KEY_ID` (reuse existing)
  - `ASC_ISSUER_ID` (reuse existing)
  - `ASC_PRIVATE_KEY` (reuse existing)
  - `EXPO_TOKEN` (reuse existing)
  - `GITHUB_TOKEN` (reuse existing)

### 1.4 EAS Configuration
Create `eas.json` in the app artifact directory:
```json
{
  "cli": { "version": ">= 16.3.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "93995SP4T4"
      }
    }
  }
}
```

### 1.5 app.json Configuration
```json
{
  "expo": {
    "name": "APP_NAME",
    "slug": "APP_SLUG",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "APP_SLUG",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.simonaletta.APP_SLUG",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_EXPO_PROJECT_ID"
      }
    },
    "owner": "simonaletta",
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

---

## Phase 2: Backend (API Server)

### 2.1 Database Schema
Standard tables needed for most apps:
- **users**: id, email, password_hash, phone_number, created_at
- **App-specific tables**: varies per app

### 2.2 Authentication
Standard email/password auth with bcryptjs:
- POST `/api/auth/register` — create account
- POST `/api/auth/login` — returns Bearer token
- Middleware to verify token on protected routes

### 2.3 Twilio SMS Integration
- Environment secret: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Use existing Twilio integration (already installed on Replit)
- Phone number format: always E.164 (e.g., +447852103212, no double country code)

### 2.4 App Review Account
Create a test account for Apple reviewers:
- Email: `appreview@APPNAME.app`
- Password: `ReviewPass123!`
- Pre-configure with test phone number
- Document in App Store Connect review notes

---

## Phase 3: Mobile App (Expo)

### 3.1 Standard Dependencies
```
expo, expo-router, expo-secure-store, expo-haptics,
expo-status-bar, expo-splash-screen, expo-font,
@tanstack/react-query, react-native-safe-area-context,
react-native-screens, react-native-reanimated,
@expo-google-fonts/inter, react-native-purchases
```

### 3.2 Design System
Standard theme (customise primary color per app):
- Font: Inter (400, 500, 600, 700)
- Primary: app-specific color
- Background: #F8F9FA
- Text: #1A1A1A
- Text Secondary: #6B7280
- Border Radius: 16px cards, 24px buttons
- Safe area insets on all screens

### 3.3 Standard Screens
Most apps need:
- `_layout.tsx` — Root layout with auth provider, query provider, subscription provider
- `index.tsx` — Main/home screen
- `login.tsx` — Login screen
- `register.tsx` — Registration screen
- `settings.tsx` — Settings with account info, support, logout
- `phone-setup.tsx` — Phone number collection (if SMS features)
- `paywall.tsx` — Subscription upgrade screen
- App-specific screens

### 3.4 Auth Flow
- Secure token storage with expo-secure-store
- Auth context provider wrapping the app
- Auto-redirect to login if not authenticated
- Phone setup redirect after first login (if needed)

---

## Phase 4: Monetisation (RevenueCat)

### 4.1 App Store Connect Subscriptions
Create via ASC API or manually:
- Subscription Group: "APP_NAME Pro"
- Monthly plan: product ID `app_slug_pro_monthly`
- Yearly plan: product ID `app_slug_pro_yearly`
- Set pricing (e.g., $1.99/mo, $12.99/yr)

### 4.2 RevenueCat Setup
- Create app in RevenueCat dashboard
- Add iOS API key as `REVENUECAT_API_KEY` secret
- Set `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` environment variable
- Create entitlement: "pro"
- Map subscription products to entitlement

### 4.3 In-App Integration
- `lib/revenuecat.tsx` — SubscriptionProvider, useSubscription hook
- `app/paywall.tsx` — Paywall screen with plan selection
- Free tier limit check before premium actions
- "Upgrade" banner on home screen for free users
- Restore Purchases button in settings and paywall

---

## Phase 5: App Store Assets

### 5.1 Screenshots Required
Generate for these device sizes:
- **iPhone 6.7"**: 1290 x 2796px (required)
- **iPad Pro 12.9" 2nd gen**: 2048 x 2732px
- **iPad Pro 13" M4**: 2064 x 2752px
- **iPad 11"**: 1668 x 2388px

Upload to locales: en-US and en-GB

### 5.2 App Icon
- 1024 x 1024px, no transparency, no rounded corners (Apple adds them)
- Place at `assets/images/icon.png`

### 5.3 Metadata Upload Script
Use the ASC API script pattern from Text Capsule:
- Upload screenshots programmatically
- Set description, keywords, support URL, marketing URL
- Set age rating, category, copyright

### 5.4 App Store Listing Checklist
- [ ] App name and subtitle
- [ ] Description (features, no prices — those show automatically)
- [ ] Keywords (100 char limit, comma-separated)
- [ ] Screenshots for all required sizes
- [ ] App icon
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Category selection
- [ ] Age rating questionnaire
- [ ] Review notes with test account credentials
- [ ] Contact info for App Review team

---

## Phase 6: Build & Submit

### 6.1 Pre-Build Checklist
- [ ] All features working and tested
- [ ] App review account created and functional
- [ ] Phone number format correct (E.164)
- [ ] Subscriptions created in ASC
- [ ] RevenueCat configured with correct product IDs
- [ ] Screenshots uploaded for all sizes
- [ ] Privacy policy published
- [ ] `ITSAppUsesNonExemptEncryption: false` in app.json
- [ ] Version and build number set

### 6.2 GitHub Push
Push all code to GitHub repo using the Node.js GitHub API pattern (git CLI blocked on Replit):
```
Repository: simonaletta-afk/REPO_NAME
Branch: main
```

### 6.3 EAS Build
Run from local terminal or Expo dashboard:
```bash
cd artifacts/APP_NAME
eas build --platform ios --profile production
```
Base directory: `artifacts/APP_NAME`

### 6.4 Submit to App Store
After build completes:
```bash
eas submit --platform ios --latest
```
Or select the build manually in App Store Connect.

### 6.5 App Review Submission
In App Store Connect:
- Select the build
- Encryption: "No" (no custom encryption)
- Add review notes with test account
- Submit for Review

---

## Phase 7: Post-Launch

### 7.1 Monitoring
- Check Twilio logs for SMS delivery
- Monitor RevenueCat dashboard for subscriptions
- Check App Store Connect for crash reports

### 7.2 Marketing
- Import app data to central management platform
- Generate landing page
- Create social media campaign content

---

## Quick Reference

| Item | Convention |
|------|-----------|
| Bundle ID | `com.simonaletta.appslug` |
| Apple Team ID | `93995SP4T4` |
| Expo Owner | `simonaletta` |
| GitHub Org | `simonaletta-afk` |
| Font | Inter |
| Auth | Email/password + Bearer token |
| SMS | Twilio |
| Payments | RevenueCat |
| DB | PostgreSQL on Replit |
| Framework | Expo + Express |
| Review Email | `appreview@appname.app` |
| Review Password | `ReviewPass123!` |

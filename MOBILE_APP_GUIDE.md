# uPYCK Mobile App - App Store Submission Guide

This guide explains how to build and submit your uPYCK app to the Apple App Store and Google Play Store.

## Prerequisites

### For iOS (Mac Required)
- macOS computer with Xcode installed (v14+)
- Apple Developer Account ($99/year)
- Valid signing certificates

### For Android
- Android Studio installed
- Google Play Developer Account ($25 one-time fee)
- Java JDK 17+

## Initial Setup

### Step 1: Build the Web App First

The native platforms require the built web assets to exist before adding platforms.

```bash
npm run build
```

This creates the `dist/public` directory with your compiled web app.

### Step 2: Add Native Platforms

Run these commands ONE TIME to create the native projects:

```bash
# Add iOS platform (creates ios/ directory)
npx cap add ios

# Add Android platform (creates android/ directory)
npx cap add android
```

### Step 3: Configure iOS Permissions

After adding iOS, edit `ios/App/App/Info.plist` to add required permissions:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>uPYCK needs your location to show nearby PYCKERs and estimate distances.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>uPYCK uses your location to track jobs and provide real-time updates.</string>

<key>NSCameraUsageDescription</key>
<string>uPYCK needs camera access to take photos for quotes.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>uPYCK needs photo access to upload images for quotes.</string>

<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>remote-notification</string>
</array>
```

### Step 4: Configure Android Permissions

After adding Android, edit `android/app/src/main/AndroidManifest.xml` to add:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## Push Notifications Setup

Push notifications require platform-specific configuration to send job alerts, booking confirmations, and PYCKER updates.

### iOS Push Notifications (APNs)

#### Step 1: Create APNs Key in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click the + button to create a new key
3. Name it "uPYCK Push Key" and check "Apple Push Notifications service (APNs)"
4. Download the .p8 file (save securely - you can only download once)
5. Note the Key ID shown after creation
6. Note your Team ID from the top right of the developer portal

#### Step 2: Enable Push Notifications in Xcode

1. Open the project in Xcode: `npx cap open ios`
2. Select your app target > Signing & Capabilities
3. Click "+ Capability" and add "Push Notifications"
4. Also add "Background Modes" and check "Remote notifications"

#### Step 3: Configure Your Server

Store these values as environment variables on your server:
- `APNS_KEY_ID`: The Key ID from step 1
- `APNS_TEAM_ID`: Your Apple Team ID
- `APNS_KEY_FILE`: Path to the .p8 file or its contents

Example server code to send iOS push notifications:
```javascript
const apn = require('apn');

const apnProvider = new apn.Provider({
  token: {
    key: process.env.APNS_KEY_FILE,
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
  },
  production: true // false for development
});

async function sendIOSPush(deviceToken, title, body, data) {
  const notification = new apn.Notification();
  notification.alert = { title, body };
  notification.payload = data;
  notification.topic = 'com.upyck.app';
  
  return apnProvider.send(notification, deviceToken);
}
```

### Android Push Notifications (Firebase Cloud Messaging)

#### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" and name it "uPYCK"
3. Follow the setup wizard (you can disable Google Analytics)

#### Step 2: Add Android App to Firebase

1. In Firebase console, click the Android icon to add an Android app
2. Enter package name: `com.upyck.app`
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

#### Step 3: Configure Android Project

Edit `android/app/build.gradle` to add at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

Edit `android/build.gradle` to add in dependencies:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

#### Step 4: Get Server Key for Backend

1. In Firebase console, go to Project Settings > Cloud Messaging
2. Under "Cloud Messaging API (Legacy)", enable it if needed
3. Copy the Server Key

Store as environment variable:
- `FCM_SERVER_KEY`: The server key from Firebase

Example server code to send Android push notifications:
```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

async function sendAndroidPush(deviceToken, title, body, data) {
  return admin.messaging().send({
    token: deviceToken,
    notification: { title, body },
    data: data,
  });
}
```

### Handling Device Tokens

When the app registers for push notifications, it receives a device token. Your app already captures this in `capacitor.ts`:

```javascript
PushNotifications.addListener('registration', (token) => {
  // Send this token to your server
  fetch('/api/users/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() })
  });
});
```

Store the token in your database associated with the user, then use it to send targeted notifications.

## Building for App Stores

### Every Time You Update the App

```bash
# Build web app and sync to native platforms
npm run build
npx cap sync

# Open in IDE for final build
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

## iOS App Store Submission

### In Xcode:

1. Set Bundle ID: `com.upyck.app`
2. Set Version: Update version in Xcode project settings
3. Add Icons: 
   - Use the app icons from `ios/App/App/Assets.xcassets/AppIcon.appiconset`
   - Required sizes: 20, 29, 40, 60, 76, 83.5, 1024 (all @1x, @2x, @3x)
4. Configure Capabilities:
   - Push Notifications (for job alerts)
   - Location Services (Background Modes > Location updates)
5. Archive and Upload:
   - Product > Archive
   - Distribute App > App Store Connect

### App Store Connect:

1. Create new app with Bundle ID `com.upyck.app`
2. Fill in app information:
   - Name: uPYCK - You Pick. We Haul.
   - Category: Lifestyle or Utilities
   - Description: See below
3. Upload screenshots (required sizes):
   - 6.7 inch iPhone (1290 x 2796)
   - 6.5 inch iPhone (1242 x 2688)
   - 5.5 inch iPhone (1242 x 2208)
   - 12.9 inch iPad Pro (2048 x 2732)
4. Submit for review

## Android Play Store Submission

### In Android Studio:

1. Set Package Name: `com.upyck.app` (in capacitor.config.ts)
2. Generate Signed APK/Bundle:
   - Build > Generate Signed Bundle/APK
   - Create new keystore (save securely - you need this for all future updates)
   - Build release bundle (.aab)

### Google Play Console:

1. Create new app
2. Fill in store listing:
   - Name: uPYCK - You Pick. We Haul.
   - Category: Lifestyle
   - Description: See below
3. Upload app bundle (.aab)
4. Complete content rating questionnaire
5. Set up pricing (Free)
6. Submit for review

## App Store Description

### Short Description (80 chars)
```
Book same-day junk removal and moving. You pick the service, time, and price.
```

### Full Description
```
uPYCK connects you with verified PYCKERS for instant, same-day hauling services.

SERVICES
- Junk Removal: Clear unwanted items fast
- Furniture Moving: Professional movers on-demand
- Garage Cleanout: Complete garage clearing service
- U-Haul Unloading: Help unloading your rental truck

KEY FEATURES
- Real-Time GPS Tracking: Watch your PYCKER arrive
- Transparent Pricing: Know the price before you book
- AI Photo Quotes: Snap a photo, get instant pricing
- Same-Day Service: Book now, get help today
- Verified Professionals: Background-checked PYCKERs
- Secure Payments: Pay safely through the app

GREEN GUARANTEE
We ensure responsible disposal with verified recycling partners.

Download uPYCK and get your space cleared today!
```

### Keywords
```
junk removal, hauling, moving, furniture, disposal, trash removal, cleanout, same day service
```

## App Icons

Generate icons in all required sizes from the main logo (`/client/public/app-icon.png`):

iOS sizes: 1024x1024 (App Store), 180x180, 167x167, 152x152, 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20

Android sizes: 512x512 (Play Store), 192x192, 144x144, 96x96, 72x72, 48x48, 36x36

## Splash Screens

### iOS
The splash screen is configured in capacitor.config.ts with Deep Purple (#3B1D5A) background.

### Android
Create a splash drawable at `android/app/src/main/res/drawable/splash.xml` with uPYCK branding.

## Testing Before Submission

1. Test on real devices (not just simulators)
2. Test GPS tracking with actual movement
3. Test push notifications 
4. Test payment flow with Stripe test cards
5. Test offline behavior

## Version Updates

For future updates:
1. Update version in capacitor.config.ts
2. Update version in Xcode (iOS) or build.gradle (Android)
3. Run `npm run build && npx cap sync`
4. Archive and submit new version

## Troubleshooting

### Build fails with "webDir does not exist"
Run `npm run build` first to create the dist/public directory.

### iOS build fails with signing errors
Ensure you have a valid Apple Developer certificate and provisioning profile.

### Android build fails with SDK errors
Update Android Studio and SDK tools to the latest version.

## Support

For app store rejection issues, review the guidelines:
- Apple: https://developer.apple.com/app-store/review/guidelines/
- Google: https://play.google.com/about/developer-content-policy/

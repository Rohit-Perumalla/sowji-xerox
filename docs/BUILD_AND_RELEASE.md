# Sowji Xerox – Build & GitHub Release Guide

This document provides complete instructions for publishing and releasing **Sowji Xerox** Android APKs using GitHub Actions and GitHub Releases.

---

## 1. Automated Release Workflow Overview

When you push a git tag (e.g. `v2.4.0`) or publish a new release in GitHub:

```
[Git Push Tag / Release Published]
                │
                ▼
  [GitHub Actions Runner: ubuntu-latest]
                │
                ├─► Checkout source code
                ├─► Set up Node.js 20 & build web frontend (`npm run build`)
                ├─► Sync web dist/ into `app/src/main/assets/web/`
                ├─► Set up JDK 17 & Android SDK (API 35/36)
                ├─► Run unit tests (`./gradlew test`)
                ├─► Build Debug APK (`./gradlew assembleDebug`)
                ├─► Check for Keystore Secrets:
                │     ├─► If Present: Decode keystore & build signed `Sowji-Xerox.apk`
                │     └─► If Absent: Output preview APK and issue signing warning
                ├─► Generate SHA-256 checksums (`checksums.txt`)
                ├─► Upload artifacts to GitHub Actions
                └─► Attach `Sowji-Xerox.apk` to the published GitHub Release
```

---

## 2. GitHub Secrets Setup

Navigate to your repository:
**Settings > Secrets and variables > Actions > New repository secret**

Add these 4 secrets:

1. `ANDROID_KEYSTORE_BASE64`
   - Base64 string of your `.keystore` or `.jks` file.
   - Command: `base64 -w 0 release.keystore`

2. `ANDROID_KEYSTORE_PASSWORD`
   - Password protecting the keystore file.

3. `ANDROID_KEY_ALIAS`
   - Key alias name (e.g., `sowji-key`).

4. `ANDROID_KEY_PASSWORD`
   - Password for the specific key alias.

---

## 3. How to Publish a New Release

### Method 1: Using the GitHub Web Interface
1. Go to your repository on GitHub (`https://github.com/rohitperumalla898/rohit-universal-print` or `sowji-xerox`).
2. On the right sidebar, click **Releases > Draft a new release**.
3. Click **Choose a tag**, enter a semantic tag name like `v2.4.1`, and click **Create new tag on publish**.
4. Set the **Release title**: `Sowji Xerox v2.4.1 – Smart Printing Studio`.
5. Paste your release notes (see template below).
6. Click **Publish release**.
7. The GitHub Actions workflow `.github/workflows/android-build.yml` will trigger automatically, compile the Android APK, and upload `Sowji-Xerox.apk` directly to this release!

### Method 2: Using Git CLI
```bash
# Ensure working tree is clean
git status

# Create a signed or annotated tag
git tag -a v2.4.1 -m "Release v2.4.1 - Sowji Xerox"

# Push tag to GitHub
git push origin v2.4.1
```

---

## 4. Release Template

When drafting a new release, use the following markdown template:

```markdown
# Sowji Xerox v2.4.0

### Highlights & New Features
- **Canon PIXMA G3010**: Enhanced BJNP UDP packet discovery on port 8611.
- **HP LaserJet M1005**: High-speed ZjStream binary spooling via USB OTG.
- **In-App Updater**: Automated GitHub Releases checker with SHA-256 verification.
- **OpenPage Dark Theme**: High-contrast OLED dark styling (#101114, #191A1F).

### Compatibility
- Android 13, 14, 15, and 16 (API Levels 33 to 36).
- Minimum SDK: API 33.

### Download & Verification
- Asset: `Sowji-Xerox.apk`
- Checksum: Verify with `sha256sum Sowji-Xerox.apk` against `checksums.txt`.
```

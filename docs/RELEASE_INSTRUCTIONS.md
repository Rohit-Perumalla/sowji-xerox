# Sowji Xerox – Release Instructions

This guide provides end-to-end instructions for creating, signing, and publishing production and testing releases of **Sowji Xerox** using GitHub Actions and GitHub Releases.

---

## 1. Release Architecture & CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/android-build.yml`) automates the entire lifecycle:

```
[Git Tag vX.Y.Z or GitHub Release Published]
                    │
                    ▼
  [Runner: Ubuntu Latest]
  ├── 1. Check out Source Code (actions/checkout@v4)
  ├── 2. Setup Node.js 20 & JDK 17
  ├── 3. Install Node Dependencies (`npm ci` / `npm install`)
  ├── 4. Verify Web Assets & Lints (`npm run lint`, `npm run build`)
  ├── 5. Sync Web Dist into `app/src/main/assets/web/`
  ├── 6. Run Android Unit & Driver Tests (`./gradlew test`)
  ├── 7. Assemble Debug APK (`./gradlew assembleDebug`)
  │      └── Verifies `app-debug.apk` exists -> Copies to `Sowji-Xerox-Debug.apk`
  ├── 8. Check Signing Secrets:
  │      ├── If secrets present: Decodes keystore -> `./gradlew assembleRelease`
  │      │   ├── Verifies `app-release.apk` exists
  │      │   ├── Shreds temporary keystore file
  │      │   └── Copies to `Sowji-Xerox-Release.apk` and `Sowji-Xerox.apk`
  │      └── If secrets absent: Warns & falls back to unsigned/preview build
  ├── 9. Verify APK file existence (`test -f`) & Compute SHA-256 Checksums
  ├── 10. Upload Artifacts to GitHub Actions (Debug, Release, Checksums)
  └── 11. Attach APKs and `checksums.txt` to GitHub Release (action-gh-release@v2)
```

---

## 2. Setting Up GitHub Signing Secrets

To enable automatic release signing without ever exposing credentials in git, add the following secrets in GitHub:
**Repository Settings > Secrets and variables > Actions > New repository secret**

| Secret Name | Description | Example / Generation Command |
|---|---|---|
| `SIGNING_KEY_BASE64` (or `ANDROID_KEYSTORE_BASE64`) | Base64-encoded string of your Android release keystore | `base64 -w 0 release.keystore` |
| `KEY_STORE_PASSWORD` (or `ANDROID_KEYSTORE_PASSWORD`) | Password protecting the keystore file | `YourStrongKeystorePassword` |
| `KEY_ALIAS` (or `ANDROID_KEY_ALIAS`) | Key alias name created inside the keystore | `sowji-release-key` |
| `KEY_PASSWORD` (or `ANDROID_KEY_PASSWORD`) | Password protecting the specific key alias | `YourStrongKeyPassword` |

### One-Time Keystore Generation:
Run this on your local machine:
```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias sowji-release-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Sowji Xerox, OU=Mobile, O=Sowji Xerox, L=Hyderabad, ST=Telangana, C=IN"

# Generate Base64 string for the GitHub Secret
base64 -w 0 release.keystore > keystore_base64.txt
```
Copy the contents of `keystore_base64.txt` into the `SIGNING_KEY_BASE64` secret. Keep `release.keystore` in a secure offline backup; never commit it to git.

---

## 3. Creating a Release

### Method A: Publishing via GitHub Web UI (Recommended)
1. Go to your GitHub repository and click **Releases** (on the right sidebar).
2. Click **Draft a new release**.
3. Click **Choose a tag**, enter a semantic tag version matching `app/build.gradle.kts` (e.g., `v2.4.0`), and select **Create new tag on publish**.
4. Set the **Target** to `main` (or `master`).
5. Set the **Release title**: `Sowji Xerox v2.4.0 – Production Release`.
6. Add your release notes (use the template in Section 4).
7. Click **Publish release**.
8. The `android-build.yml` workflow will automatically run, build both Debug and signed Release APKs, verify their existence, compute SHA-256 hashes, and upload `Sowji-Xerox.apk`, `Sowji-Xerox-Debug.apk`, and `checksums.txt` directly to the release page.

### Method B: Publishing via Git CLI
```bash
# 1. Ensure you are on main and up to date
git checkout main
git pull origin main

# 2. Tag the release
git tag -a v2.4.0 -m "Release v2.4.0: Sowji Xerox"

# 3. Push the tag to GitHub
git push origin v2.4.0
```

---

## 4. Release Notes Template

Use this format when publishing releases:

```markdown
# Sowji Xerox v2.4.0

### Highlights
- **Canon PIXMA G3010**: Direct Wi-Fi BJNP UDP discovery (port 8611), USB bidirectional status, and CMYK ink telemetry.
- **HP LaserJet M1005 MFP**: Real Zenographics ZjStream (`0x5A5A5A5A`) binary rasterizer via USB OTG Host mode.
- **Passport Photo Studio**: Indian (35×45mm), US (2×2"), and ID photo generator with background replacement and formal attire overlays.
- **Document & Scanner**: Multi-format document parser (PDF, DOCX, XLSX, PPTX, TXT) and camera/scanner perspective crop with PDF export.
- **In-App Updater**: Automated GitHub Releases update checker with cryptographic SHA-256 verification.

### System Requirements
- Android 13 to Android 16 (API Level 33 to API Level 36).
- USB OTG adapter for HP LaserJet M1005.
- Wi-Fi network or USB connection for Canon PIXMA G3010.

### Checksums & Integrity
Download `Sowji-Xerox.apk` and verify with:
```bash
sha256sum -c checksums.txt
```
```

---

## 5. Verifying Release Builds Locally

Before releasing, you can verify builds on your local workstation:

```bash
# 1. Run web tests & lint
npm run lint
npm run build

# 2. Run Android unit tests
./gradlew test

# 3. Build debug APK
./gradlew assembleDebug

# 4. Verify APK exists
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

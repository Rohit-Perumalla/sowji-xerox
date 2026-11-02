# Sowji Xerox – Your Smart Printing Studio

[![Android APK Build & Release](https://github.com/rohitperumalla898/rohit-universal-print/actions/workflows/android-build.yml/badge.svg)](https://github.com/rohitperumalla898/rohit-universal-print/actions)
[![Android](https://img.shields.io/badge/Android-13%20to%2016%20(API%2033--36)-green.svg)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v2.4.0-indigo.svg)](https://github.com/rohitperumalla898/rohit-universal-print/releases)

**Sowji Xerox** is a professional, high-performance Android and cross-platform printing studio engineered specifically for direct hardware communication with the **Canon PIXMA G3010** MegaTank and **HP LaserJet M1005 MFP**.

---

## 🖨️ Hardware Integrations & Real Device Drivers

### 1. HP LaserJet M1005 MFP (USB OTG Host)
- **Protocol**: Real **Zenographics ZjStream** (`0x5A5A5A5A` magic header) binary stream encoder.
- **Connection**: Native Android USB Host API (`android.hardware.usb.UsbManager`) via bulk OUT endpoint (`0x01`).
- **Rasterization**: 600×600 DPI bi-level monochrome Floyd–Steinberg dithering with JBIG-compatible byte streaming.
- **Hardware IDs**: Vendor ID `0x03F0` (1008), Product ID `0x3B17` (15127).
- **Integrity Guarantee**: Never marks a job as physically printed without live hardware transmission and status checks.

### 2. Canon PIXMA G3010 (Wi-Fi & USB)
- **Protocol**: Canon **BJNP protocol** over UDP port `8611` for broadcast discovery and live ink telemetry, paired with IPP raster streaming on TCP port `631` / `9100`.
- **Features**: Dual-tank continuous ink monitoring (Black + CMY), borderless 4×6 photo rasterization, A4 multi-page document spooling.
- **Connection**: Automatic Wi-Fi network probing and USB OTG bidirectional communication.

---

## 📄 Document Printing & Scanning

- **Format Support**: Genuine offline parsing for **PDF**, **JPG**, **JPEG**, **PNG**, **WEBP**, **DOC**, **DOCX** (via OfficeOpenXML document parser), **XLS**, **XLSX** (workbook sheets), **PPT**, **PPTX** (slide preview), **TXT**, **CSV**, and **RTF**.
- **Print Controls**: Page range selection, copies, paper sizes (A4, A5, Letter), orientation (Portrait/Landscape), color/monochrome, margins, scaling, and draft/normal/best print quality.
- **Scanning Engine**: Camera document capture with quad-corner perspective correction, flatbed CIS scanner integration (150/300/600 DPI), auto-contrast, grayscale, black-and-white thresholding, and PDF/JPG export.
- **Scan History**: Searchable local scan archive with timestamps, previews, and one-tap reprinting.

---

## 📷 Passport Photo Studio

- **Standard Sizes**: Indian Passport (35 × 45 mm), US Passport (2 × 2 inches), ID Photos (25 × 35 mm & 30 × 40 mm), and custom dimensions.
- **Editing Tools**: Background removal and color replacement (White, Light Blue, Grey, custom), formal suit & shirt overlays with dress color tinting, face positioning, crop, rotate, resize, and undo/reset.
- **Print Sheets**: 4, 8, 12, 16, or custom copies arranged on 4 × 6", 5 × 7", A4, and A5 photo paper.
- **Capacity Safety Alert**: Warns users immediately whenever requested photo quantity physically exceeds available paper area.

---

## 🚀 GitHub Actions CI/CD Pipeline

The automated workflow located at [`.github/workflows/android-build.yml`](.github/workflows/android-build.yml) handles:

1. **Dependency Installation**: Sets up Node.js 20, runs `npm ci`, and configures JDK 17 with Android SDK.
2. **Testing & Validation**: Executes `npm run lint` (TypeScript compilation), builds web assets, and runs Android unit tests (`./gradlew test`).
3. **Debug APK Build**: Compiles `app-debug.apk` and verifies file existence before renaming to `Sowji-Xerox-Debug.apk`.
4. **Signed Release APK Build**: When GitHub Actions secrets are present, securely decodes the base64 keystore, compiles the Proguard/R8-optimized `app-release.apk`, verifies output existence, and securely deletes the temporary keystore.
5. **Integrity Checksums**: Generates SHA-256 hashes (`checksums.txt`) for all compiled APKs.
6. **Artifact Storage**: Uploads Debug and Release APKs and checksums to GitHub Actions artifacts.
7. **Automated GitHub Releases**: Publishes APK files directly to GitHub Releases whenever a release is published or tag is pushed.

---

## 🔐 GitHub Secrets Configuration

To enable signed production APK generation, configure the following secrets in GitHub under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Value Example |
|---|---|---|
| `SIGNING_KEY_BASE64` | Base64-encoded release keystore | `cat release.keystore \| base64 -w 0` |
| `KEY_STORE_PASSWORD` | Password protecting the keystore file | `YourKeystorePassword` |
| `KEY_ALIAS` | Key alias name within the keystore | `sowji-release-key` |
| `KEY_PASSWORD` | Password protecting the specific key alias | `YourKeyPassword` |

> **Security Guarantee**: Private keystores and passwords are never stored in source code. If secrets are not configured, the workflow safely generates unsigned or preview APKs for testing without failing the build.

---

## 📚 Documentation

- [Release Instructions](docs/RELEASE_INSTRUCTIONS.md): Step-by-step guide on publishing releases and tagging.
- [APK Installation Guide](docs/APK_INSTALLATION.md): Installing APKs on Android devices, ADB commands, and USB OTG permissions.
- [Version Management](docs/VERSION_MANAGEMENT.md): Semantic versioning scheme and Android `versionCode` computation.
- [Build & Release Guide](docs/BUILD_AND_RELEASE.md): General overview of Android builds.

---

## 💻 Local Building

```bash
# 1. Install dependencies
npm install

# 2. Build web assets
npm run build

# 3. Grant execute permissions
chmod +x gradlew

# 4. Build Debug APK
./gradlew assembleDebug

# Output APK: app/build/outputs/apk/debug/app-debug.apk
```

---

## 📄 License

Copyright © 2026 Sowji Xerox. Licensed under the [Apache License, Version 2.0](LICENSE).

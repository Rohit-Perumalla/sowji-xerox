# Sowji Xerox – APK Installation Guide

This guide walks you through installing **Sowji Xerox** on Android smartphones, tablets, or POS terminals, along with configuring USB OTG and network permissions for the **Canon PIXMA G3010** and **HP LaserJet M1005 MFP**.

---

## 1. System Requirements & Compatibility

| Item | Requirement |
|---|---|
| **Supported OS** | Android 13, 14, 15, and 16 (API 33 – 36) |
| **Minimum SDK** | API Level 33 (Android 13) |
| **Architecture** | `arm64-v8a`, `armeabi-v7a`, `x86_64` |
| **USB Support** | USB Host mode (OTG) enabled on device |
| **Network** | Wi-Fi 802.11 b/g/n (for Canon PIXMA G3010 network discovery) |

---

## 2. Downloading the APK

### From GitHub Releases (Recommended)
1. Open the repository's **Releases** page:
   `https://github.com/rohitperumalla898/rohit-universal-print/releases`
2. Download the latest release asset:
   - `Sowji-Xerox.apk` (Signed Release APK) or `Sowji-Xerox-Debug.apk` (Testing build).
   - `checksums.txt` (Integrity verification).
3. Optional hash check:
   ```bash
   sha256sum Sowji-Xerox.apk
   ```
   Compare output against `checksums.txt`.

### From GitHub Actions Artifacts
1. Go to the **Actions** tab in the repository.
2. Click on the latest workflow run on `main` or your branch.
3. Scroll down to the **Artifacts** section at the bottom.
4. Download `Sowji-Xerox-Release-APK` or `Sowji-Xerox-Debug-APK`.

---

## 3. Installation Methods

### Method A: Direct Sideloading on Android Device
1. Transfer `Sowji-Xerox.apk` to your Android device (via USB cable, Google Drive, or browser download).
2. Open your device's **Files** or **Downloads** app.
3. Tap `Sowji-Xerox.apk`.
4. If this is your first time installing an APK from your file manager, Android will display:
   > *"For your security, your phone is not allowed to install unknown apps from this source."*
5. Tap **Settings** on the prompt, toggle **Allow from this source** to **ON**, then press the back button.
6. Tap **Install**. Once installation completes, tap **Open**.

### Method B: Installing via ADB (Android Debug Bridge)
If you are an engineer or technician installing via USB cable from your computer:

```bash
# 1. Verify device is detected in developer mode
adb devices

# 2. Install APK (use -r to reinstall/preserve app data)
adb install -r Sowji-Xerox.apk

# 3. For debug builds:
adb install -r Sowji-Xerox-Debug.apk
```

---

## 4. Hardware Connection & Permission Setup

### A. HP LaserJet M1005 MFP (USB OTG Setup)
1. Power ON the HP LaserJet M1005.
2. Connect a standard USB Type-B cable to the back of the printer.
3. Connect the other end into a **USB-C to USB-A OTG adapter**, and plug it into your Android device.
4. Android will display an OS-level permission dialog:
   > *"Open Sowji Xerox when this USB device is connected? (HP LaserJet M1005 MFP)"*
5. Check the box **"Always allow Sowji Xerox access to this device"** and tap **OK**.
6. In Sowji Xerox, tap **Printers**. The HP LaserJet M1005 status chip will switch to **Connected (Ready)**.

### B. Canon PIXMA G3010 (Wi-Fi or USB Setup)
- **Wi-Fi Mode**:
  1. Ensure your Android device and Canon PIXMA G3010 are connected to the same 2.4 GHz Wi-Fi network (or Wireless Direct).
  2. Open Sowji Xerox, go to **Printers**, and tap **Refresh / Discover**.
  3. The app will broadcast Canon BJNP UDP discovery packets on port `8611` and connect to IPP on port `631` / `9100`.
- **USB Mode**:
  1. Connect via USB OTG adapter.
  2. Accept the USB permission dialog.
  3. Status will update to **Connected (Ready)** with live ink levels.

---

## 5. In-App Updates

Sowji Xerox includes an integrated update client:
1. Open the app and navigate to **Settings > In-App APK Updates**.
2. Tap **Check Updates** to query the latest release from GitHub.
3. When a new version is detected, tap **Download Update**.
4. Once downloaded and validated against its SHA-256 hash, tap **Install Update**.
5. Grant the package installer confirmation to complete the update without losing any scan or document history.

---

## 6. Troubleshooting

- **"App not installed" Error**:
  - If upgrading from a debug build to a release build, uninstall the previous debug version first because Android enforces signature matching across package upgrades (`com.sowjixerox.app`).
- **USB Device Not Detected**:
  - Verify your phone supports USB OTG. On some devices (e.g., OnePlus, Oppo, Vivo), you must enable **OTG Connection** under **System Settings > Additional Settings**.
  - Test the OTG adapter with a USB flash drive to verify the adapter is operational.
- **Canon Printer Not Found on Wi-Fi**:
  - Check whether your Wi-Fi router has "AP Isolation" or "Client Isolation" enabled. If enabled, devices on the same Wi-Fi network cannot communicate directly.

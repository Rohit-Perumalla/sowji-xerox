# Sowji Xerox – Version Management Guide

This document defines the versioning scheme, version synchronization process, and release tagging conventions for **Sowji Xerox**.

---

## 1. Versioning Scheme

Sowji Xerox follows [Semantic Versioning (SemVer 2.0.0)](https://semver.org/):

$$\text{Format: } \mathbf{MAJOR.MINOR.PATCH}$$

- **MAJOR**: Breaking protocol alterations, fundamental hardware driver changes, or major UI overhauls (e.g., adding a brand-new printer architecture).
- **MINOR**: Backward-compatible new features (e.g., new passport photo templates, additional document formats like RTF, improved scanner filters).
- **PATCH**: Backward-compatible bug fixes, UI polish, driver telemetry adjustments, or performance enhancements.

---

## 2. Android `versionCode` vs. `versionName`

Android requires two distinct version identifiers inside `app/build.gradle.kts`:

```kotlin
defaultConfig {
    applicationId = "com.sowjixerox.app"
    minSdk = 33
    targetSdk = 35
    versionCode = 20400  // Monotonically increasing positive integer
    versionName = "2.4.0" // User-facing semantic version string
}
```

### Computation Formula
To guarantee that every release has a strictly higher `versionCode` required by the Android package manager for in-place upgrades:

$$\text{versionCode} = (\text{MAJOR} \times 10000) + (\text{MINOR} \times 100) + \text{PATCH}$$

| Version Name | Major | Minor | Patch | Version Code |
|---|---|---|---|---|
| `2.4.0` | 2 | 4 | 0 | `20400` (or `240`) |
| `2.4.1` | 2 | 4 | 1 | `20401` |
| `2.5.0` | 2 | 5 | 0 | `20500` |
| `3.0.0` | 3 | 0 | 0 | `30000` |

---

## 3. Files Requiring Version Synchronization

When preparing a new release, ensure version numbers are updated across the following files:

1. **`app/build.gradle.kts`**:
   - `versionCode = <computed_integer>`
   - `versionName = "<MAJOR.MINOR.PATCH>"`
2. **`package.json`**:
   - `"version": "<MAJOR.MINOR.PATCH>"`
3. **`src/services/updateManager.ts`**:
   - `CURRENT_APP_VERSION = "<MAJOR.MINOR.PATCH>"`
4. **`app/src/test/java/com/sowjixerox/app/PrinterDriverTest.kt`**:
   - Verify unit test assertions reflect the new version prefix if tested.
5. **`README.md`**:
   - Update badge version string `Release-vX.Y.Z`.

---

## 4. Release Tagging Workflow

Always tag releases on the `main` branch:

```bash
# 1. Update version numbers in source code
# 2. Run local verification
npm run lint
npm run build
./gradlew test

# 3. Commit version bump
git commit -am "chore: bump version to v2.4.0"

# 4. Create annotated tag
git tag -a v2.4.0 -m "Release v2.4.0 - Sowji Xerox"

# 5. Push commit and tag
git push origin main
git push origin v2.4.0
```

Pushing the `v*` tag triggers the automated `.github/workflows/android-build.yml` pipeline to compile, sign, verify, and publish the release.

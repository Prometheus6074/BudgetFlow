# BudgetFlow — APK Release Build

## Repo Structure After Adding These Files

```
your-repo/
├── .github/
│   └── workflows/
│       └── build-apk.yml       ← GitHub Actions pipeline
├── android/                    ← Android WebView wrapper (new)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/budgetflow/app/
│   │   │   │   └── MainActivity.java
│   │   │   └── res/values/
│   │   │       ├── strings.xml
│   │   │       └── themes.xml
│   │   └── build.gradle
│   ├── gradle/wrapper/
│   │   └── gradle-wrapper.properties
│   ├── build.gradle
│   └── settings.gradle
├── index.html                  ← existing web files (unchanged)
├── styles.css
├── app.js
├── chart.umd.min.js
└── lucide.min.js
```

---

## One-Time Setup Steps

### 1. Generate the Gradle Wrapper (required once, locally)

The `gradle-wrapper.jar` binary must be committed. Run this once locally
(requires Gradle 8+ installed on your machine):

```bash
cd android
gradle wrapper --gradle-version 8.6
git add gradle/wrapper/gradle-wrapper.jar gradle/wrapper/gradle-wrapper.properties gradlew gradlew.bat
git commit -m "chore: add gradle wrapper"
```

If you don't have Gradle locally, you can download the wrapper jar from:
https://github.com/gradle/gradle/raw/v8.6.0/gradle/wrapper/gradle-wrapper.jar
and place it at `android/gradle/wrapper/gradle-wrapper.jar`.

### 2. Confirm GitHub Secrets Are Set

Go to your repo: Settings → Secrets and variables → Actions → New repository secret.

| Secret name        | Value                              |
|--------------------|------------------------------------|
| `KEYSTORE_BASE64`  | The base64 string (already set)    |
| `KEYSTORE_PASSWORD`| `49224597` (already set)           |
| `KEY_ALIAS`        | `budgeyflowkey` (already set)      |
| `KEY_PASSWORD`     | `49224597` (already set)           |

### 3. Commit chart.umd.min.js and lucide.min.js

The workflow auto-downloads them if missing, but committing them is faster
and avoids CDN dependency:

```bash
# Download locally
curl -L https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js -o chart.umd.min.js
curl -L https://unpkg.com/lucide@latest/dist/umd/lucide.min.js -o lucide.min.js
git add chart.umd.min.js lucide.min.js
git commit -m "chore: add bundled JS dependencies"
```

---

## Triggering a Build

**Automatic:** Push any commit to `main` or `master`.

**Manual:** Go to Actions tab → "Build Release APK" → Run workflow.

**Tagged release:** Push a tag — the workflow will also create a GitHub Release
with the APK attached:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Downloading the APK

After the workflow completes:

1. Go to your repo on GitHub.
2. Click **Actions** → select the latest run.
3. Scroll to **Artifacts** at the bottom.
4. Download **BudgetFlow-release-apk**.

The APK inside is signed with your keystore and ready to install on any Android
device (minSdk 23 / Android 6+). Enable "Install from unknown sources" on the
device if sideloading outside the Play Store.

---

## Installing on a Device

```bash
# Via ADB (USB debugging enabled on device)
adb install BudgetFlow-release.apk
```

Or transfer the APK file to the device and open it in the file manager.

# pocket — Semester Budget Planner

pocket is a mobile-first budgeting companion that helps students turn semester funds into a weekly spending plan, record purchases, and understand their spending patterns.

## What it does

- Builds a weekly plan from a semester budget and date range.
- Lets students allocate each week's budget to custom categories.
- Tracks spending by day and category, with an at-a-glance weekly balance.
- Warns when a week reaches its budget and provides a weekly transaction review.
- Summarizes monthly spending and estimates how long the remaining semester balance may last.

The app does not connect to a bank. Budgets and expenses are stored locally on the device/browser and are not synced to an account.
Use **Export backup** on the Home screen before switching devices or reinstalling. The resulting JSON file can be restored with **Import backup**.

## Run locally

The web app is plain HTML, CSS, and JavaScript. Serve the `www` directory with a local static server, for example:

```powershell
python -m http.server 8000 --directory www
```

Then open `http://localhost:8000` in a browser.

## Run tests

```powershell
npm test
```

## Android

The Android project uses Capacitor. After changing the web app, copy the updated `www` assets into the native project and open `android` in Android Studio:

```powershell
npx cap sync android
```

Build and install the app from Android Studio on a device or emulator. Test the first-run setup, expense entry, overspending alert, week review, and Insights before distributing an APK.

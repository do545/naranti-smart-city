# Firebase Setup and Management Guide

This document outlines the essential steps and best practices for setting up and managing Firebase for the SmartCity Interactive Kiosk project.

## 1. Firebase Project Creation and Setup

1.  **Create a New Firebase Project**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the on-screen instructions.
    *   Enable Google Analytics if desired (recommended for insights).

2.  **Add a Web App to Your Project**:
    *   In the Firebase Console, navigate to "Project settings" -> "General".
    *   Scroll down to "Your apps" and click the web icon (`</>`).
    *   Register your app and copy the Firebase configuration object. The real config lives in `src/firebase/config.js` (NOT `src/config/firebase.js`, which is a legacy mock placeholder pending deletion).

3.  **Authentication Setup**:
    *   In the Firebase Console, go to "Authentication" -> "Sign-in method".
    *   Enable "Email/Password" provider. This is essential for admin user login.

4.  **Firestore Database Setup**:
    *   In the Firebase Console, go to "Firestore Database".
    *   Click "Create database".
    *   Choose "Start in production mode" (rules will be defined later).
    *   Select a Cloud Firestore location (e.g., `nam5 (us-central)`).

5.  **Storage Setup**:
    *   In the Firebase Console, go to "Storage".
    *   Click "Get started".
    *   Choose "Start in production mode" (rules will be defined later).
    *   Select a Cloud Storage location (e.g., `us-central`).

## 2. Firestore Production Rules

It is critical to secure your Firestore database. The production rules are now **version-controlled in this repo** (no longer edited by hand in the console):

- `firestore.rules` — Firestore access rules.
- `storage.rules` — Cloud Storage access rules.
- `firebase.json` / `.firebaserc` — Firebase CLI config (project: `naranti-smartcity`).
- `firestore.indexes.json` — composite indexes (currently none required).

### Role model

Roles live in the `users` collection (doc id = email in lowercase):

| Role | Use |
|------|-----|
| `admin` | Operations panel. Central administration (sees everything). |
| `kiosk` | Urban interactive kiosk (Naranti Smart City). |
| `screen` | Urban passive screen (Novastar / TV). |
| `mall` | **Commercial-plaza kiosk mode (new). Reserved** — the security rules already allow it; the app code (KNOWN_ROLES + route) is wired when that module is built. |

### How the rules protect each collection

- `users` — only `admin` manages accounts; a user may update only their own `lastAccess`. **The first admin must be created manually in the console** (client-side bootstrap no longer works — by design).
- `kiosks` (devices) — admin manages the whole fleet and sends commands; a device may write **only its own** doc (heartbeat, screenshot, location) and **cannot** touch admin-only control fields (`lastCommand`, `brightnessSchedule`).
- `campaigns` / `settings` — read by any authenticated device/admin; written by `admin` only.
- `analytics` — devices record interactions; only `admin` reads reports.
- `spotlight` — reserved for future moderated UGC.

> **Multi-tenant note:** administration is currently central. The rules contain `[TENANT]` markers showing exactly where to add per-plaza isolation (`plazaId`) when each commercial plaza gets its own administrator — without rewriting them.

### Deploy

> ⚠️ This changes **production** security. Review the rules first, and test in the Firebase console **Rules Playground** before deploying.

```bash
firebase login                                      # one-time
firebase deploy --only firestore:rules,storage      # deploy both rule sets
```

**Before deploying, confirm every active device account already has a `users/{email}` doc with the right role** — the rules require it (this already matches how the app authorizes today, so working devices are fine).
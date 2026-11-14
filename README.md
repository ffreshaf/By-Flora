# By Flora

By Flora is a mobile-first household care app for managing the daily routines, reminders, and check-ins for a beloved pet. It is built with React, Vite, and Capacitor, and it supports household sharing, reminder scheduling, activity history, and Firebase-powered authentication.

This project is designed to help one or more family members stay aligned on the care needs of a dog or other pet without missing important routines.

## Why this app exists

Pet care often involves multiple people, recurring reminders, and a history of what was done. By Flora brings those pieces together in a single place so households can:

- Track care routines for each pet
- Set custom reminder schedules
- View activity history
- Invite household members
- Receive local notifications and reminders
- Check in on care tasks from a simple mobile interface

## Features

- Household setup and join flow with invite codes
- Multiple pet profiles and per-pet care management
- Custom reminders for care tasks
- Care confirmation flow for completed tasks
- Notification scheduling with local mobile reminders
- Activity/history tracking
- Firebase authentication and Firestore-backed data model
- Responsive design for mobile use and browser testing
- Capacitor support for Android app packaging

## Tech stack

- React 19
- Vite
- React Router
- Firebase Auth + Firestore
- Capacitor
- Dexie (local IndexedDB data layer)
- Express + SQLite in the server folder (currently a lightweight backend scaffold)

## Project structure

```text
By-Flora/
├── .firebaserc
├── .gitignore
├── firebase.json
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── capacitor.config.json
├── vite.config.js
├── public/
├── server/
│   ├── database/
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── firebase.js
│   ├── db.js
│   ├── main.jsx
│   ├── auth/
│   ├── components/
│   ├── contexts/
│   ├── css/
│   ├── db/
│   ├── pages/
│   └── utils/
├── assets/
├── android/
└── supabase/
```

## Main app flow

The app uses route-based screens for:

- Home dashboard
- Log care activity
- Profile
- Settings
- Household setup / invite management
- Dog setup and care target configuration
- Reminder scheduling
- Notification confirmation
- History review

## Getting started

### Prerequisites

- Node.js 18+ recommended
- npm or another package manager
- Firebase project configured for authentication and Firestore

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

This starts the Vite development server for local UI development.

### Production build

```bash
npm run build
```

The production bundle is written to the `dist` folder, which is also the configured Firebase Hosting public directory.

## Firebase setup

The app currently uses Firebase configuration in `src/firebase.js` and a default project alias in `.firebaserc`:

```json
{
  "projects": {
    "default": "by-flora"
  }
}
```

If you are setting this up for another Firebase project, update:

- `src/firebase.js` with your Firebase web config
- `.firebaserc` with the correct project name
- Firebase hosting and security rules as needed

## Notifications

The app includes scheduled reminder logic and local notification support for mobile and browser use. This is handled through the app's notification utilities and the Capacitor local notification plugin. If you are testing reminders, make sure notifications are enabled in the environment where the app is running.

## Capacitor / Android

This project is set up for native packaging via Capacitor. Relevant files include:

- `capacitor.config.json`
- `android/`

Common native commands:

```bash
npx cap sync
npx cap open android
```

## Server folder

There is an optional Express server under `server/` using SQLite and CORS. It is currently a lightweight scaffold and does not yet appear to be the primary application backend. It can be extended for API endpoints or additional persistence if needed.

## Deployment

Firebase Hosting is configured in `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

To deploy:

```bash
firebase deploy
```

## Notes

- The repository is still under active development.
- The existing README was the default Vite template and has been replaced with a project-specific overview.
- Some backend and data storage pieces are still evolving, especially around the server and reminder infrastructure.

## Contributing

Contributions are welcome. If you would like to improve the app, please open a pull request with a clear description of your changes and test notes.

## License

No explicit license has been defined in the repository yet. If you plan to distribute this project publicly, consider adding an appropriate open-source license.

---

By Flora is a practical, family-friendly care-tracking app built to make routine care easier, more visible, and harder to forget.

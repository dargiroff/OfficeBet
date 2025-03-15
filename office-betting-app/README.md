# Office Betting App

A web application for managing office bets and tracking user performance.

## Setup

1. Clone the repository
2. Create Firebase configuration file:
   - Copy `scripts/firebaseConfig.template.js` to `scripts/firebaseConfig.js`
   - Replace the placeholder values with your actual Firebase configuration
   
```javascript
// Example firebaseConfig.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

3. Update Firestore rules:
   - Go to your Firebase Console
   - Navigate to Firestore Database > Rules
   - Paste the rules from `firestore.rules`

## Development

To run the app locally, simply open `index.html` in your browser.

## Deployment

This project is set up for Firebase Hosting. To deploy:

```bash
firebase deploy --only hosting
```

## Security Notes

- Never commit your Firebase configuration with API keys to the repository
- The `firebaseConfig.js` file is excluded from version control in `.gitignore`
- Use environment variables for production deployments

## Features

- User authentication
- Create and participate in bets
- Track tokens and balances
- Leaderboard to see who's winning
- Admin controls for managing users and bets

## Deployment Instructions

### Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)

### Steps to Deploy

1. Log in to Firebase:
   ```
   firebase login
   ```

2. Initialize Firebase in the project directory (if not already done):
   ```
   firebase init
   ```
   - Select Hosting and Firestore
   - Select your Firebase project
   - Use existing configuration files when prompted

3. Deploy to Firebase:
   ```
   firebase deploy
   ```

4. Your app will be available at the URL shown in the deployment output (typically `https://your-project-id.web.app`).

## Local Development

To run the app locally:

1. Install Firebase CLI if not already installed:
   ```
   npm install -g firebase-tools
   ```

2. Start the local server:
   ```
   firebase serve
   ```

3. Open your browser to `http://localhost:5000`

## Firebase Configuration

The app uses Firebase for:
- Authentication
- Firestore Database
- Hosting

Make sure your Firebase project has these services enabled in the Firebase Console.

## Security

The app uses Firebase Authentication and Firestore Security Rules to protect data. Only authenticated users can access the app, and users can only modify their own data. 
// Firebase configuration template
// Replace these with your actual Firebase configuration or environment variables
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Add diagnostic console logs specifically for user access
console.log("Firebase initialized with the following project ID:", firebaseConfig.projectId);
console.log("Current Firebase version:", firebase.SDK_VERSION);

// UNIVERSAL ACCESS SETTINGS - UPDATED WITH MUCH LONGER TIMEOUTS
console.log("Setting up universal data access for all users");

// Create a system-wide admin token that will be used for all users
window.UNIVERSAL_ACCESS_TOKEN = "admin-access-" + Date.now();
console.log("Created universal access token for all data operations");

// Extend the timeout for Firestore operations (in milliseconds)
window.FIRESTORE_TIMEOUT = 30000; // 30 seconds timeout (increased from 15)
console.log(`Setting Firestore timeout to ${window.FIRESTORE_TIMEOUT}ms`);

// Cache-busting parameter to force fresh data
window.CACHE_BUST = Date.now();
console.log("Created cache-busting parameter:", window.CACHE_BUST);

// Rest of your Firebase configuration code... 
// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { getDatabase } from "firebase/database";
// ADDED: App Check for security (stops bot scripts)
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-EoWqmrW3P9iPJ24Pbq8-s5qk7DdckIc",
  authDomain: "simplewuxia.firebaseapp.com",
  projectId: "simplewuxia",
  storageBucket: "simplewuxia.firebasestorage.app",
  messagingSenderId: "21724550784",
  appId: "1:21724550784:web:34ae7f5b02113bbe6ff865",
  measurementId: "G-HYDX88WYC5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ADDED: Initialize App Check
// This ensures requests only come from your real website.
// You MUST get a key from Firebase Console -> App Check -> Register (reCAPTCHA v3)
if (typeof window !== 'undefined') {
  try {
    // REPLACE 'YOUR_RECAPTCHA_SITE_KEY_HERE' WITH YOUR ACTUAL KEY
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LfpyEMsAAAAAOLEEmAl58trXEwEJ2x7MFUuUYsu'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) {
    console.log("App Check not initialized (Missing Key?)");
  }
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);
export const rtdb = getDatabase(app);
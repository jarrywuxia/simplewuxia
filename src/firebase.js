// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
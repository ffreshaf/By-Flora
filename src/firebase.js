// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrcIY_XTT9eyLreW72f1IHb3iIHKeZqmI",
  authDomain: "by-flora.firebaseapp.com",
  projectId: "by-flora",
  storageBucket: "by-flora.firebasestorage.app",
  messagingSenderId: "185062875197",
  appId: "1:185062875197:web:8b53a5dc47e037903a4a54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
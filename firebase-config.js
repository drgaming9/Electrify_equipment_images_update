// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlnEdxmIEaM0gru_vGtJ6vEW5fqRWOEFQ",
  authDomain: "electrify-b8863.firebaseapp.com",
  projectId: "electrify-b8863",
  storageBucket: "electrify-b8863.firebasestorage.app",
  messagingSenderId: "209412376212",
  appId: "1:209412376212:web:115f45afc7c1a766065681",
  measurementId: "G-M2TEYGLHYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
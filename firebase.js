// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPmhpagRLcULRp_SegjPrdzLNfyF9pi8M",
  authDomain: "incident-reporting-e6177.firebaseapp.com",
  projectId: "incident-reporting-e6177",
  storageBucket: "incident-reporting-e6177.firebasestorage.app",
  messagingSenderId: "1091165680335",
  appId: "1:1091165680335:web:828f4beca80df52593fdba",
  measurementId: "G-GMCTZVMKZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
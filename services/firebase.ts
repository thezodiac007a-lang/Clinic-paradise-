
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDLdamqVTkWJIum4uj7bdM9zMPsr84bdwo",
    authDomain: "paradise-864e5.firebaseapp.com",
    projectId: "paradise-864e5",
    storageBucket: "paradise-864e5.firebasestorage.app",
    messagingSenderId: "240271904686",
    appId: "1:240271904686:web:cd2615695781c83ad4423f",
    measurementId: "G-0MTPNSRMVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;

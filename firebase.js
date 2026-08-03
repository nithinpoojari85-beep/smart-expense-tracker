import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "smart-expense-tracker-70bfc.firebaseapp.com",
    projectId: "smart-expense-tracker-70bfc",
    storageBucket: "smart-expense-tracker-70bfc.firebasestorage.app",
    messagingSenderId: "62976484701",
    appId: "1:62976484701:web:562fe19d19f71981d734b4"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
    db,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
};

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBF_0aWw-ACJPgraKpG5QZilzhYLH8EsDE",
  authDomain: "dressme-3szxx.firebaseapp.com",
  projectId: "dressme-3szxx",
  storageBucket: "dressme-3szxx.appspot.com",
  messagingSenderId: "344619024276",
  appId: "1:344619024276:web:dfc6b5f60096dfc733d981",
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);

export { db };

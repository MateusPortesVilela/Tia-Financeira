import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqDzTonoylazrY1VwrLSa1rSwW7_xhE5w",
  authDomain: "tiafinanceira.firebaseapp.com",
  projectId: "tiafinanceira",
  storageBucket: "tiafinanceira.firebasestorage.app",
  messagingSenderId: "589471962373",
  appId: "1:589471962373:web:b68ef1a9b92f646b1a936c",
  measurementId: "G-HLN1D6X3CP",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export { db };

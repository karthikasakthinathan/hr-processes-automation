// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM2rWW24QWpPFRKfP8_YuydIQOOdeqCEE",
  authDomain: "hr-processes-automation-ed382.firebaseapp.com",
  projectId: "hr-processes-automation-ed382",
  storageBucket: "hr-processes-automation-ed382.appspot.com",
  messagingSenderId: "875866475767",
  appId: "1:875866475767:web:77835a582362e8b4c917f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth
export const auth = getAuth(app);

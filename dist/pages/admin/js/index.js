import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { onAuthStateChanged , signOut} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
const firebaseConfig = {
    apiKey: "AIzaSyAp7lw1A3TnfQCd_7Tu9p7c1DD-DWmUxts",
    authDomain: "eKwento.com",
    databaseURL: "https://maharlika-6ded8-default-rtdb.firebaseio.com",
    projectId: "maharlika-6ded8",
    storageBucket: "maharlika-6ded8.appspot.com",
    messagingSenderId: "11720673855",
    appId: "1:11720673855:web:b2bb5f86928b6cb397468a",
    measurementId: "G-6TR74JCT83"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };


onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log('User has signed out');
    } else {
        console.log('User is still signed in');
    }
});
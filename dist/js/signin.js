import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { auth, db } from './index.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Listen to authentication state changes
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log('User has signed out');
    } else {
        console.log('User is still signed in');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Check if email or password is empty
        if (!email || !password) {
            Swal.fire({
                icon: 'error',
                title: 'Input Error',
                text: 'Please enter both email and password!',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Logging you in...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Retrieve user data from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userType = userData.userType;
                const userStatus = userData.status;  // Check the user's status

                // Check if the user's account is approved
                if (userStatus !== 'Approved') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Account Not Approved',
                        text: 'Your account is still under review by the admin. Please wait until it is approved.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                // If the account is approved, proceed to check the userType
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: 'Welcome back, ' + (user.displayName || 'User'),
                    confirmButtonText: 'OK'
                }).then(() => {
                    if (userType === 'member') {
                        window.location.href = "../pages/dashboard.html"; // Redirect to member dashboard
                    } else if (userType === 'admin') {
                        window.location.href = "../pages/admin/admin_db.html"; // Redirect to admin dashboard
                    } else {
                        console.log("Unknown userType, defaulting to member dashboard");
                        window.location.href = "..pages/dashboard.html"; // Default to member dashboard
                    }
                });
            } else {
                throw new Error('User data not found in Firestore');
            }

        } catch (error) {
            console.error("Firebase Auth Error:", error.code, error.message);

            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: `Error: ${error.message}`,
                confirmButtonText: 'OK'
            });
        }
    });
});

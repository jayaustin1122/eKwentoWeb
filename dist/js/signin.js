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
                title: 'Error sa Input',
                text: 'Paki-punan ang email at password!',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Naglo-login...',
            text: 'Paki-hintay...',
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
                if (userStatus !== 'Approved' && userStatus !== 'Naaprubahan') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Account Hindi Pa-Naaprubahan',
                        text: 'Ang iyong account ay kasalukuyang sinusuri ng admin. Mangyaring maghintay hanggang ito ay maaprubahan.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }
                
                // If the account is approved, proceed to check the userType
                Swal.fire({
                    icon: 'success',
                    title: 'Matagumpay na Login!',
                    text: 'Maligayang pagbabalik, ' + (user.displayName || 'Gumagamit'),
                    confirmButtonText: 'OK'
                }).then(() => {
                    if (userType === 'member') {
                        window.location.href = "../pages/dashboard.html"; // Redirect to member dashboard
                    } else if (userType === 'admin') {
                        window.location.href = "../pages/admin/admin_books.html"; // Redirect to admin dashboard
                    } else {
                        console.log("Hindi kilalang userType, defaulting to member dashboard");
                        window.location.href = "..pages/dashboard.html"; // Default to member dashboard
                    }
                });
            } else {
                throw new Error('Hindi nahanap ang data ng user sa Firestore');
            }

        } catch (error) {
            console.error("Firebase Auth Error:", error.code, error.message);

            Swal.fire({
                icon: 'error',
                title: 'Nabigo ang Login',
                text: `Error: ${error.message}`,
                confirmButtonText: 'OK'
            });
        }
    });
});

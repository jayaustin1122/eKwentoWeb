import { auth, db } from './index.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { setDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector("form");

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = signupForm.querySelector("input[placeholder='Pangalan']").value;
        const lastName = signupForm.querySelector("input[placeholder='Apelyido']").value;
        const email = signupForm.querySelector("input[placeholder='Email']").value;
        const password = signupForm.querySelector("input[placeholder='Password']").value;
        const confirmPassword = signupForm.querySelector("input[placeholder='Confirm Password']").value;

 
        const genresCheckboxes = document.querySelectorAll("#genres input[type='checkbox']:checked");
        const selectedGenres = Array.from(genresCheckboxes).map(checkbox => checkbox.value);

   
        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords do not match!',
                confirmButtonText: 'OK'
            });
            return;
        }
        if (selectedGenres.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Genre Required',
                text: 'Please select at least one genre.',
                confirmButtonText: 'OK'
            });
            return;
        }
        try {

            Swal.fire({
                title: 'Creating your account...',
                text: 'Please wait while we create your account.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email,
                genre: selectedGenres,
                createdAt: serverTimestamp(),
                userType : 'member',
                status : 'Pending'
            });

      
            Swal.fire({
                icon: 'success',
                title: 'Account Created!',
                text: 'Your account has been successfully created.',
                confirmButtonText: 'OK'
            }).then(() => {
    
                window.location.href = "/dist/index.html";
            });

        } catch (error) {
   
            Swal.fire({
                icon: 'error',
                title: 'Sign-up Failed',
                text: `Error: ${error.message}`,
                confirmButtonText: 'OK'
            });
        }
    });
});

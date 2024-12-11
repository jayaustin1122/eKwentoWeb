import { auth, db } from './index.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { setDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector("form");

    // Custom validation messages in Tagalog
    const firstNameInput = signupForm.querySelector("input[placeholder='Pangalan']");
    const lastNameInput = signupForm.querySelector("input[placeholder='Apelyido']");
    const emailInput = signupForm.querySelector("input[placeholder='Email']");
    const passwordInput = signupForm.querySelector("input[placeholder='Password']");
    const confirmPasswordInput = signupForm.querySelector("input[placeholder='Confirm Password']");

    // Add validation message in Tagalog
    firstNameInput.addEventListener("invalid", () => {
        firstNameInput.setCustomValidity("Paki-punan ang pangalan.");
    });
    firstNameInput.addEventListener("input", () => {
        firstNameInput.setCustomValidity(""); // Reset message on valid input
    });

    lastNameInput.addEventListener("invalid", () => {
        lastNameInput.setCustomValidity("Paki-punan ang apelyido.");
    });
    lastNameInput.addEventListener("input", () => {
        lastNameInput.setCustomValidity(""); // Reset message on valid input
    });

    emailInput.addEventListener("invalid", () => {
        emailInput.setCustomValidity("Paki-punan ang tamang email.");
    });
    emailInput.addEventListener("input", () => {
        emailInput.setCustomValidity(""); // Reset message on valid input
    });

    passwordInput.addEventListener("invalid", () => {
        passwordInput.setCustomValidity("Paki-punan ang password.");
    });
    passwordInput.addEventListener("input", () => {
        passwordInput.setCustomValidity(""); // Reset message on valid input
    });

    confirmPasswordInput.addEventListener("invalid", () => {
        confirmPasswordInput.setCustomValidity("Paki-ulit ang password.");
    });
    confirmPasswordInput.addEventListener("input", () => {
        confirmPasswordInput.setCustomValidity(""); // Reset message on valid input
    });

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = firstNameInput.value;
        const lastName = lastNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const genresCheckboxes = document.querySelectorAll("#genres input[type='checkbox']:checked");
        const selectedGenres = Array.from(genresCheckboxes).map(checkbox => checkbox.value);

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords hindi parehas!',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (selectedGenres.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Genre ay Kailangan',
                text: 'Pumili ng ibang Genre.',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Nagloload...',
                text: '.......',
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
                title: 'Account Nalikha!',
                text: 'Matagumpay na nalikha ang iyong account.',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = "../index.html";
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lagyan lahat ng Iyong Detalye',
                text: `Para makagawa ng Account`,
                confirmButtonText: 'OK'
            });
        }
    });
});

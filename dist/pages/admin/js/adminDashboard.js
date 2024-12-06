import { auth, db } from './index.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { onAuthStateChanged , signOut} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
function formatDate(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Converts to 12-hour format
    const formattedTime = `${hour12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${formattedTime}`;
    return formattedDate;
}

function updateDateTime() {
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = formatDate(currentDate);
}

updateDateTime();
setInterval(updateDateTime, 1000);

function attachLogoutEventListener() {
    const logoutButton = document.getElementById('logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            // Ask the user if they are sure about logging out
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you really want to log out?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes',
                cancelButtonText: 'Cancel'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Show loading indicator
                    Swal.fire({
                        title: 'Logging out...',
                        text: 'Please wait...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading(); // Show loading
                        }
                    });

                    try {
                        // Attempt to sign out
                        await signOut(auth);
                        console.log('Successfully signed out');

                        // Show success message
                        Swal.fire({
                            title: 'Logged Out!',
                            text: 'You have been successfully logged out.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Redirect to homepage after logout
                            window.location.href = '../../index.html';
                        });

                    } catch (error) {
                        console.error('Logout failed:', error.message);
                        Swal.fire({
                            title: 'Logout Failed',
                            text: 'An error occurred while logging out. Please try again.',
                            icon: 'error',
                            confirmButtonText: 'Okay'
                        });
                    }
                }
            });
        });
    } else {
        console.error("Logout button not found!");
    }
}

window.addEventListener('load', attachLogoutEventListener);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        Swal.fire({
            title: 'Loading...',
            text: 'Please wait...',
            allowOutsideClick: false, 
            didOpen: () => {
                Swal.showLoading(); 
            }
        });

        console.log('Fetching data from Firestore...');

        // 1. Count Authors
        const authorsQuery = query(collection(db, 'users'), where('userType', '==', 'member'));
        const authorsSnapshot = await getDocs(authorsQuery);
        const authorsCount = authorsSnapshot.size;
        console.log(`Number of authors: ${authorsCount}`);

        // 2. Count Books Across All Users
        let booksCount = 0;
        const usersSnapshot = await getDocs(collection(db, 'users')); // Get all users

        // Loop through all users to count books
        for (const userDoc of usersSnapshot.docs) {
            const booksCollectionRef = collection(db, `users/${userDoc.id}/books`);
            const booksSnapshot = await getDocs(booksCollectionRef);
            booksCount += booksSnapshot.size; // Add the count of books for this user
        }
        console.log(`Total number of books across all users: ${booksCount}`);

        // 3. Count Pending Books Across All Users
        let pendingBooksCount = 0;
        // Loop through all users again to count pending books
        for (const userDoc of usersSnapshot.docs) {
            const pendingBooksQuery = query(
                collection(db, `users/${userDoc.id}/books`),
                where('bookStatus', '==', 'Pending')
            );
            const pendingBooksSnapshot = await getDocs(pendingBooksQuery);
            pendingBooksCount += pendingBooksSnapshot.size; // Add the count of pending books for this user
        }
        console.log(`Number of pending books across all users: ${pendingBooksCount}`);

        // 4. Count Proofreaders
        const proofreadersQuery = query(collection(db, 'users'), where('userType', '==', 'proofreader'));
        const proofreadersSnapshot = await getDocs(proofreadersQuery);
        const proofreadersCount = proofreadersSnapshot.size;
        console.log(`Number of proofreaders: ${proofreadersCount}`);

        // Update the dashboard stats
        document.getElementById('totalBooks').textContent = booksCount;
        document.getElementById('authors').textContent = authorsCount;
        document.getElementById('proofreaders').textContent = proofreadersCount;
        document.getElementById('pendingBooks').textContent = pendingBooksCount;

        // Close the loading SweetAlert after data is loaded
        Swal.close();

    } catch (error) {
        // Close the loading SweetAlert in case of an error
        Swal.close();
        console.error('Error retrieving data from Firestore:', error);

        // Show error alert
        Swal.fire({
            title: 'Error!',
            text: 'Something went wrong while fetching the data.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
});
let selectedGenre = '';

document.querySelectorAll('.genre-btn').forEach(button => {
    button.addEventListener('click', function () {
    
        document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));

        this.classList.add('active');
        selectedGenre = this.getAttribute('data-genre');
        console.log("Selected Genre:", selectedGenre); // For debugging
    });
});

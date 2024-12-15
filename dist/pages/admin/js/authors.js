
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { auth, db } from './index.js';
import { getStorage} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { onAuthStateChanged , signOut} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

function attachLogoutEventListener() {
    const logoutButton = document.getElementById('logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            // Ask the user if they are sure about logging out
            Swal.fire({
                title: 'Sigurado ka ba?',
                text: 'Gusto mo ba talagang mag log out?',
                icon: 'warning', // Ensure 'icon' is set to a valid value like 'warning'
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Oo',
                cancelButtonText: 'Kanselahin',
                buttonsStyling: false,  // Disable SweetAlert2 default styling
                customClass: {
                    confirmButton: 'btn btn-primary',   // Bootstrap button style
                    cancelButton: 'btn btn-danger',     // Apply Bootstrap styling or add your custom classes
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Show loading indicator
                    Swal.fire({
                        title: 'Nagla-log out...',
                        text: 'Mangyaring maghintay...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading(); // Show loading
                        }
                    });

                    try {
                        // Attempt to sign out
                        await signOut(auth);
                        console.log('Matagumpay na naka-sign out');

                        // Show success message
                        Swal.fire({
                            title: 'Logged Out!',
                            text: 'Matagumpay kang na-log out.',
                            icon: 'tagumpay',
                            confirmButtonText: 'OK',
                            buttonsStyling: true 
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
const storage = getStorage();
onAuthStateChanged(auth, (user) => {
   if (user) {
       console.log("User is logged in:", user);
     
   } else {
       console.log("No user is authenticated, redirecting to login.");

   }
});
// Select the table body and search input
const usersTableBody = document.querySelector('tbody');
const usersCollectionRef = collection(db, 'users');  // Path to 'users' collection
const searchInput = document.getElementById('searchInput');

// Array to hold rows for search functionality
let rows = [];

// Fetch user data from Firestore
async function fetchUsersData() {
    try {
        const querySnapshot = await getDocs(usersCollectionRef);
        if (querySnapshot.empty) {
            console.log("Walang nakitang mga user.");
            return;
        }

        // Clear existing table rows before adding new ones
        usersTableBody.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const createdAt = userData.createdAt ? userData.createdAt.toDate().toLocaleString() : "NA";
            const email = userData.email || "NA";
            const firstName = userData.firstName || "NA";
            const lastName = userData.lastName || "NA";
            const genre = userData.genre && userData.genre.length > 0 ? userData.genre.join(', ') : "NA";
            const userType = userData.userType || "NA";
            const status = userData.status || "NA";
            const proofs = userData.proofs || "NA";
            const experience = userData.experience || "NA";
            const certificates = userData.certificates || "NA";

            // Create a row and append it to the table body
            const row = document.createElement('tr');
            let statusInTagalog;
            if (status === "Pending") {
                statusInTagalog = "Naghihintay";
            } else if (status === "Approved") {
                statusInTagalog = "Naaprubahan";
            } else if (status === "Rejected") {
                statusInTagalog = "Tinanggihan";
            } else {
                statusInTagalog = status; // Keep original status for other cases
            }
            
            row.innerHTML = `
                <td>${firstName} ${lastName}</td>
                <td>${email}</td>
                <td>${createdAt}</td>
                <td><a href="#" class="status-link" data-id="${doc.id}">${statusInTagalog}</a></td>
            `;
            
            usersTableBody.appendChild(row);

            // Store row and user data for later use in search
            rows.push({
                row,
                firstName,
                lastName,
                email,
                status
            });
        });

        // Attach event listener to all status links after rows are populated
        document.querySelectorAll('.status-link').forEach(link => {
            link.addEventListener('click', handleStatusClick);
        });

        // Bind the search input event
        searchInput.addEventListener('input', () => filterTable());

    } catch (error) {
        console.error("Error fetching user data: ", error);
    }
}

// Filter the rows based on the search term
function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();

    rows.forEach(item => {
        const { row, firstName, lastName, email, status } = item;
        const rowText = `${firstName} ${lastName} ${email} ${status}`.toLowerCase();

        // Toggle row visibility based on whether the search term matches
        if (rowText.includes(searchTerm)) {
            row.style.display = '';  // Show row
        } else {
            row.style.display = 'none';  // Hide row
        }
    });
}

// Handle the status link click event (Approve/Reject)
async function handleStatusClick(event) {
    const userId = event.target.dataset.id;  // Get the user ID from the data-id attribute
    const currentStatus = event.target.innerText;

    // Determine the action based on the current status
    const action = currentStatus === "Naaprubahan" ? "Tanggihan" : "Aprubahan";

    // Show confirmation dialog
    const { value } = await Swal.fire({
        title: `Gusto mo ba ${action} ang gumagamit na ito?`,
        showCancelButton: true,
        confirmButtonText: action,
    });

    if (value) {
        try {
            const newStatus = action === "Aprubahan" ? "Naaprubahan" : "Tinanggihan";
            // Update Firestore with the new status
            await setDoc(doc(db, 'users', userId), {
                status: newStatus,
                updatedAt: serverTimestamp(),  // Adding timestamp for the update
            }, { merge: true });

            // Update the table UI
            event.target.innerText = newStatus;

            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Na-update ang Katayuan!',
                text: `Ang gumagamit ay naging ${newStatus.toLowerCase()}.`
            });
        } catch (error) {
            console.error("Error sa pag-update ng status ng user: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Nagkaroon ng error sa pag-update ng status.'
            });
        }
    }
}

// Fetch and display users data when the page loads
document.addEventListener('DOMContentLoaded', fetchUsersData);

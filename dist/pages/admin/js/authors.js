import { auth, db } from './index.js';
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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
            console.log("No users found.");
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
            row.innerHTML = `
                <td>${firstName} ${lastName}</td>
                <td>${email}</td>
                <td>${certificates}</td>
                <td>${experience}</td>
                <td>${proofs}</td>
                <td>${createdAt}</td>
                <td><a href="#" class="status-link" data-id="${doc.id}">${status}</a></td>
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
    const action = currentStatus === "Approved" ? "Reject" : "Approve";

    // Show confirmation dialog
    const { value } = await Swal.fire({
        title: `Do you want to ${action} this user?`,
        showCancelButton: true,
        confirmButtonText: action,
    });

    if (value) {
        try {
            const newStatus = action === "Approve" ? "Approved" : "Rejected";
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
                title: 'Status Updated!',
                text: `The user has been ${newStatus.toLowerCase()}.`
            });
        } catch (error) {
            console.error("Error updating user status: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'There was an error updating the status.'
            });
        }
    }
}

// Fetch and display users data when the page loads
document.addEventListener('DOMContentLoaded', fetchUsersData);

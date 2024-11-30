import { auth, db } from './index.js';
import { collectionGroup, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';


function formatDate(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedTime = `${hour12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${formattedTime}`;
    return formattedDate;
}

function updateDateTime() {
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = formatDate(currentDate);
}
window.addEventListener('load', attachLogoutEventListener);
function attachLogoutEventListener() {
    document.addEventListener('DOMContentLoaded', () => {
        const logoutButton = document.getElementById('logout');

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    console.log('Successfully signed out');
                    window.location.href = '../index.html';
                } catch (error) {
                    console.error('Logout failed:', error.message);
                }
            });
        } else {
            console.error("Logout button not found!");
        }
    });
}
updateDateTime();
setInterval(updateDateTime, 1000);
async function fetchBooks() {
    try {
        const booksCollection = collectionGroup(db, 'books');
        const querySnapshot = await getDocs(booksCollection);

        const tableBody = document.getElementById('bookTableBody');
        tableBody.innerHTML = '';
        let bookIndex = 1;

        querySnapshot.forEach((doc) => {
            const bookData = doc.data();
            addBookRow(tableBody, bookIndex++, bookData, doc.ref.path); // Pass full document path
        });

        document.getElementById('searchBar').addEventListener('input', searchTable);
    } catch (error) {
        console.error('Error fetching books: ', error);
    }
}

function addBookRow(tableBody, index, bookData, bookPath) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${index}</td>
        <td class="book-title">${bookData.title}</td>
        <td class="book-author">${bookData.author}</td>
        <td><img src="${bookData.coverImageURL}" alt="Book Image" width="50"></td>
        <td>${new Date(bookData.createdAt.seconds * 1000).toLocaleDateString()}</td>
        <td><span class="book-status clickable">${bookData.bookStatus}</span></td>
    `;
    tableBody.appendChild(row);

    // Add click event listener to the status field
    const statusElement = row.querySelector('.book-status');
    statusElement.addEventListener('click', () => handleStatusClick(bookPath, bookData.bookStatus));
}
async function handleStatusClick(bookPath, currentStatus) {
    // Prompt the user to update the status regardless of the current one
    const { isConfirmed, isDenied } = await Swal.fire({
        title: `Current status: ${currentStatus}`,
        text: 'Do you want to update the status?',
        icon: 'question',
        showDenyButton: true,
        confirmButtonText: 'Approve',
        denyButtonText: 'Reject',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#d33',
        cancelButtonColor: '#aaa',
    });

    console.log('User action - isConfirmed:', isConfirmed, 'isDenied:', isDenied);

    // Determine the new status based on user action
    let newStatus = '';
    if (isConfirmed) {
        newStatus = 'Approved';
    } else if (isDenied) {
        newStatus = 'Rejected';
    } else {
        console.log('User canceled the action or no valid action was taken.');
        return; // Exit if no valid action was taken
    }

    console.log('Updating book with path:', bookPath, 'to status:', newStatus);

    try {
        const bookRef = doc(db, bookPath); // Use full document path
        console.log('Firestore document path:', bookRef.path);

        // Update the document with the new status
        await updateDoc(bookRef, { bookStatus: newStatus });

        Swal.fire('Success', `Status updated to ${newStatus}`, 'success');
        console.log('Status update successful for book:', bookPath);

        fetchBooks(); // Refresh the table after the update
    } catch (error) {
        console.error('Error updating status:', error);
        Swal.fire('Error', 'Failed to update status', 'error');
    }
}

function searchTable() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    const tableRows = document.querySelectorAll('#bookTableBody tr');

    tableRows.forEach(row => {
        const title = row.querySelector('.book-title').textContent.toLowerCase();
        const author = row.querySelector('.book-author').textContent.toLowerCase();

        if (title.includes(searchTerm) || author.includes(searchTerm)) {
            row.style.display = ''; 
        } else {
            row.style.display = 'none'; 
        }
    });
}

fetchBooks();
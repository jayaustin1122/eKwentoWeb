import { db } from './index.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
const searchBooks = async (searchQuery) => {
    const books = [];
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);

    for (const userDoc of usersSnapshot.docs) {
        const userBooksCollection = collection(db, `users/${userDoc.id}/books`);
        const approvedBooksQuery = query(userBooksCollection, where('bookStatus', '==', 'Approved'));
        const booksSnapshot = await getDocs(approvedBooksQuery);
        booksSnapshot.forEach(bookDoc => {
            const bookData = bookDoc.data();
            const timestamp = bookData.timestampEpoch;
            
            if (bookData.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                books.push({
                    ...bookData,
                    userId: userDoc.id,
                    timestampEpoch: timestamp 
                });
            }
        });
    }

    renderSearchResults(books);
};

const renderSearchResults = (books) => {
    const booksContainer = document.querySelector('.books-container');
    booksContainer.innerHTML = '';
    Swal.close();

    if (books.length === 0) {
        Swal.fire('No books found', '', 'warning');
        return;
    }

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.classList.add('story-cards', 'card', 'mb-3');
        bookElement.setAttribute('data-book-timestamp', book.timestampEpoch);
        bookElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${book.title}</h5>
                <p class="card-text">${book.description}</p>
                <small>By: ${book.author}</small><br>
                <small>${new Date(book.timestampEpoch).toLocaleDateString()}</small>
            </div>  
        `;
        console.log(book.timestampEpoch);

        bookElement.addEventListener('click', () => {
            localStorage.setItem('selectedBookTimestamp', book.timestampEpoch);
            window.location.href = 'readbook.html';
        });

        booksContainer.appendChild(bookElement);
    });

    Swal.fire('Search complete', '', 'success');
};


const searchForm = document.querySelector('form');
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchInput = document.querySelector('input[type="search"]').value.trim();

    if (searchInput) {

        Swal.fire({
            title: 'Searching...',
            text: 'Please wait while we search for books.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        await searchBooks(searchInput);
    } else {
        Swal.fire('Please enter a search term.', '', 'info');
    }
});

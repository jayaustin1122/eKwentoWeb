import { db } from './index.js'; 
import { getDocs, collectionGroup, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

async function fetchBooks() {
    try {
        // Get selected genre from the dropdown
        const selectedGenre = document.getElementById('genreFilter').value;
        const searchQuery = document.getElementById('titleSearchInput').value.trim().toLowerCase();

        // Query Firestore to get books with status 'Approved'
        let booksRef = collectionGroup(db, 'books');
        if (selectedGenre) {
            booksRef = query(booksRef, where('bookStatus', '==', 'Approved'), where('genre', '==', selectedGenre));
        } else {
            booksRef = query(booksRef, where('bookStatus', '==', 'Approved'));
        }

        const querySnapshot = await getDocs(booksRef);

        const storyCardsContainer = document.querySelector('.story-cards .row');
        storyCardsContainer.innerHTML = ''; // Clear previous results

        const books = [];

        querySnapshot.forEach((doc) => {
            const book = doc.data();
            books.push({
                title: book.title || "Unknown Title",
                author: book.author || "Unknown Author",
                content: book.content || "No Content",
                coverImageURL: book.coverImageURL || null,
                bookStatus: book.bookStatus,
                genre: book.genre,
                timestampEpoch: book.timestampEpoch
            });
        });

        // Filter books by search query (title)
        const filteredBooks = books.filter(book => 
            book.title.toLowerCase().includes(searchQuery)
        );

        if (filteredBooks.length === 0) {
            storyCardsContainer.innerHTML = '<p>No books found for the selected genre or search term.</p>';
            return;
        }

        // Shuffle and limit to 5 books
        const shuffledBooks = filteredBooks.sort(() => 0.5 - Math.random());
        const selectedBooks = shuffledBooks.slice(0, 5);

        // Render the selected books
        selectedBooks.forEach((book) => {
            const { title, author, content, coverImageURL, timestampEpoch } = book;

            const cardHTML = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                    <div class="story-cards" data-book-timestamp="${timestampEpoch}">
                        <img src="${coverImageURL ? coverImageURL : '/assets/pc.png'}" alt="Book Cover" class="img-fluid">
                        <div class="card-details">
                            <h4>${title}</h4>
                            <p class="author">${author ? `By ${author}` : 'Unknown Author'}</p>
                            <p class="content">${content.substring(0, 20)}...</p>
                        </div>
                    </div>
                </div>
            `;

            storyCardsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Add click event listeners to the cards
        const storyCards = document.querySelectorAll('.story-cards');
        storyCards.forEach((card) => {
            card.addEventListener('click', () => {
                const bookTimestamp = card.getAttribute('data-book-timestamp');
                console.log('Card clicked! Timestamp:', bookTimestamp);

                const clickedBook = books.find(book => book.timestampEpoch == bookTimestamp);

                if (clickedBook) {
                    console.log('Clicked Book Found:', clickedBook);
                    localStorage.setItem('selectedBookTimestamp', clickedBook.timestampEpoch);
                    window.location.href = "../pages/readbook.html";
                } else {
                    console.error('No book found for the clicked card.');
                }
            });
        });

        console.log('Selected Books:', selectedBooks);

    } catch (error) {
        console.error("Error fetching books from Firestore: ", error);
    }
}

// Fetch books on page load
window.addEventListener('DOMContentLoaded', fetchBooks);

// Add event listener to the genre dropdown
document.getElementById('genreFilter').addEventListener('change', fetchBooks);

// Add event listener to the search input
document.getElementById('titleSearchInput').addEventListener('input', fetchBooks);

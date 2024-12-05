import { auth, db } from './index.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

// Retrieve the timestampEpoch from localStorage
const selectedBookTimestamp = localStorage.getItem('selectedBookTimestamp');

if (selectedBookTimestamp) {
    showLoadingSwal()
    showMascotPopup() 
    queryBookAcrossAllUsersByTimestamp(selectedBookTimestamp);
    console.log(`read ${selectedBookTimestamp}`)
} else {
    document.querySelector('.book-content').innerHTML = '<p>No book data available.</p>';
}

function showMascotPopup() {
    const mascotPopup = document.getElementById('mascot-popup');
    mascotPopup.style.display = 'flex';
    setTimeout(() => {
        mascotPopup.style.display = 'none';
    }, 3000); // Hide after 3 seconds
}

function showLoadingSwal() {
    Swal.fire({
        title: 'Loading...',
        text: 'Getting Book Content, please wait...',
        allowOutsideClick: false, 
        didOpen: () => {
            Swal.showLoading(); 
        }
    });
}
async function queryBookAcrossAllUsersByTimestamp(timestampEpoch) {
    try {
      
        const timestampInt = Math.floor(parseInt(timestampEpoch, 10));

        const usersCollectionRef = collection(db, 'users'); 
        const usersSnapshot = await getDocs(usersCollectionRef);

        if (!usersSnapshot.empty) {
            let bookFound = false;

            // Iterate through each user's books
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                console.log(`Checking books for user: ${userId}`);

             
                const booksCollectionRef = collection(db, `users/${userId}/books`);
        
      
                const booksQuery = query(booksCollectionRef, where('timestampEpoch', '==', timestampInt));
                const booksSnapshot = await getDocs(booksQuery);

                if (!booksSnapshot.empty) {
               
                    booksSnapshot.forEach((bookDoc) => {
                        const bookDetails = bookDoc.data();
                        const {
                            title = "Unknown Title",
                            author = "Unknown Author",
                            content = "No Content",
                            publicationDate = "Unknown Date",
                            genre = "Unknown Genre",
                            coverImageURL = ""
                        } = bookDetails;

                  
                        console.log("Book details found:", bookDetails);
                        document.getElementById('book-title').textContent = title;
                        document.getElementById('book-author').textContent = `By ${author}`;
                        document.getElementById('book-publication-date').textContent = `Publication Date: ${publicationDate}`;
                        document.getElementById('book-genre').textContent = `Genre: ${genre}`;
                        document.getElementById('book-content').textContent = content;

                        if (coverImageURL) {
                            const coverElement = document.getElementById('book-cover');
                            coverElement.src = coverImageURL;
                            coverElement.style.display = 'block';
                        } else {
                            document.getElementById('book-cover').style.display = 'none';
                        }

                        bookFound = true;
                    });

            
                    if (bookFound) {
                        console.log(`Book found for user: ${userId}`);
                        break;
                    }
                }
            }

            if (!bookFound) {
                alert("No matching book found across all users.");
            }
        } else {
            alert("No users found in the database.");
        }
    } catch (error) {
        console.error("Error querying the books across all users:", error);
    } finally {
        Swal.close();
    }
}

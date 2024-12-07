import { auth, db } from './index.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
const messages = [
    { text: "Welcome! Read and Explore this book.", image: "/assets/lola.png" },
    { text: "Did you know? This book has some fun facts.", image: "/assets/fun_fact.png" },
    { text: "Keep going, you're doing great!", image: "/assets/keep_going.png" },
    { text: "Take a break, and enjoy the story!", image: "/assets/take_break.png" },
    { text: "Click on different chapters to learn more.", image: "/assets/chapters.png" }
];

const selectedBookTimestamp = localStorage.getItem('selectedBookTimestamp');

if (selectedBookTimestamp) {
    showLoadingSwal()

    queryBookAcrossAllUsersByTimestamp(selectedBookTimestamp);
    console.log(`read ${selectedBookTimestamp}`)
} else {
    showMascotPopup2()
    document.querySelector('.book-content').innerHTML = '<p>No book data available.</p>';
}


function showLoadingSwal() {
    Swal.fire({
        title: 'Loading...',
        text: 'Getting Book Content, please wait...',
        allowOutsideClick: false, 
        didOpen: () => {
            Swal.showLoading(); 
            startShowingMascotPopup();
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
                            createdAt = "Unknown Date",
                            genre = "Unknown Genre",
                            coverImageURL = ""
                        } = bookDetails;
                        
                        // Check if createdAt is a valid timestamp and format it into a date and time
                        let formattedDate = "Unknown Date";
                        if (createdAt && !isNaN(createdAt)) {
                            const date = new Date(createdAt * 1000);  // Assuming createdAt is in seconds (Unix Epoch)
                            formattedDate = date.toLocaleString();    // Formats to local date and time
                        }
                        
                        console.log("Book details found:", bookDetails);
                        document.getElementById('book-title').textContent = title;
                        document.getElementById('book-author').textContent = `By ${author} | Publication Date: ${formattedDate}`;
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

function showMascotPopup2() {
    const mascotPopup = document.getElementById('mascot-popup');
    const messageElement = mascotPopup.querySelector('p');
    const imageElement = mascotPopup.querySelector('img');
  
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    messageElement.textContent = randomMessage.text;
    imageElement.src = randomMessage.image;
    
 
    const randomTop = Math.floor(Math.random() * (window.innerHeight - mascotPopup.offsetHeight));
    const randomLeft = Math.floor(Math.random() * (window.innerWidth - mascotPopup.offsetWidth));
    

    mascotPopup.style.top = randomTop + 'px';
    mascotPopup.style.left = randomLeft + 'px';
    

    mascotPopup.style.display = 'flex';
    

    setTimeout(() => {
        mascotPopup.style.display = 'none';
    }, 3000); // Hide after 3 seconds
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}




function startShowingMascotPopup() {
    setInterval(() => {
        const randomDelay = getRandomInt(10000, 20000); 
        showMascotPopup2();
    }, getRandomInt(10000, 20000)); // Repeat every 10-20 seconds
}


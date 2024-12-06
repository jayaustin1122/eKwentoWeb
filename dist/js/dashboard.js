import { auth, db, } from './index.js';
import { setDoc, doc, serverTimestamp,getDoc, getDocs, collection , query, where,collectionGroup,deleteDoc} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { onAuthStateChanged , signOut} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
 

 const storage = getStorage();
 onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user);
    
        fetchBook(user.uid)
        fetchUserProfile(user.uid)
        fetchBooksToAll(user.uid)
        fetchBooksFromLibrary(user.uid)
        showLoadingSwal()
    } else {
        console.log("No user is authenticated, redirecting to login.");
        window.location.href = '../pages/index.html'; // Redirect to login if not authenticated
    }
});
function showLoadingSwal() {
    Swal.fire({
        title: 'Loading...',
        text: 'Please wait...',
        allowOutsideClick: false, 
        didOpen: () => {
            Swal.showLoading(); 
        }
    });
}
function attachLogoutEventListener() {
    const logoutButton = document.getElementById('logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log('Successfully signed out');
                window.location.href = '../index.html'; // Redirect after sign out
            } catch (error) {
                console.error('Logout failed:', error.message);
            }
        });
    } else {
        console.error("Logout button not found!");
    }
}

// Attach listener when DOM is ready
window.addEventListener('load', attachLogoutEventListener);


//aa books
async function fetchBooksToAll(userId) {
    try {
        const storyCardsContainer = document.querySelector('.story-cards .row');
        storyCardsContainer.innerHTML = `
            <div class="loading-spinner text-center">
                <div class="spinner-border text-info" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p>Loading books...</p>
            </div>
        `;

        const booksRef = collectionGroup(db, 'books');
        const querySnapshot = await getDocs(query(booksRef, where("bookStatus", "==", "Approved")));

        storyCardsContainer.innerHTML = ''; 

        const books = [];

        // Get user's saved books from Firestore
        const userLibraryRef = collection(db, `users/${userId}/mylibrary`);
        const userLibrarySnapshot = await getDocs(userLibraryRef);
        const savedBooks = userLibrarySnapshot.docs.map(doc => doc.id);  

        querySnapshot.forEach((doc) => {
            const book = doc.data();
            const {
                title = "Unknown Title",
                author = "Unknown Author",
                genre = "Unknown Genre",
                coverImageURL = null,
                timestampEpoch = doc.id 
            } = book;

            books.push({ ...book, timestampEpoch });  
            const isSaved = savedBooks.includes(timestampEpoch);

            // Build HTML for the card
            const cardHTML = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                    <div class="story-cards" data-book-timestamp="${timestampEpoch}">
                        <img src="${coverImageURL ? coverImageURL : '/assets/pc.png'}" alt="Book Cover" class="img-fluid card-image">
                        <div class="card-details">
                            <h4>${title}</h4>
                            <p class="author">${author ? `By ${author}` : 'Unknown Author'}</p>
                            <p class="genre">${genre ? `${genre}` : 'Unknown Genre'}</p>
                            <button class="heart-button" data-id="${timestampEpoch}">
                                <i class="fa ${isSaved ? 'fa-heart' : 'fa-heart-o'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
         
            storyCardsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

     
        const storyCards = document.querySelectorAll('.story-cards');
        storyCards.forEach((card) => {
            card.addEventListener('click', () => {
                const bookTimestamp = card.getAttribute('data-book-timestamp');
                const clickedBook = books.find(book => book.timestampEpoch == bookTimestamp);

                if (clickedBook) {
                    console.log('Clicked Book Found:', clickedBook.timestampEpoch);
                    localStorage.setItem('selectedBookTimestamp', String(clickedBook.timestampEpoch));
                    window.location.href = "../pages/readbook.html";
                } else {
                  
                }
            });
        });

        // Attach click listeners to the heart buttons
        const heartButtons = document.querySelectorAll('.heart-button');
        heartButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); 
                const bookId = event.currentTarget.getAttribute('data-id');
                const icon = event.currentTarget.querySelector('i');

                const bookRef = doc(db, `users/${userId}/mylibrary`, bookId);
                const docSnapshot = await getDoc(bookRef);

                if (docSnapshot.exists()) {
                    await deleteDoc(bookRef);
                    icon.classList.remove('fa-heart');
                    icon.classList.add('fa-heart-o');
                } else {
                    const bookDataToSave = {
                        bookId: String(bookId),
                        savedAt: new Date()
                    };
                    await setDoc(bookRef, bookDataToSave);
                    icon.classList.remove('fa-heart-o');
                    icon.classList.add('fa-heart');
                }
            });
        });

        if (querySnapshot.empty) {
            storyCardsContainer.innerHTML = `
                <div class="writing-section text-center" data-bs-toggle="modal" data-bs-target="#bookModal">
                    <img src="/assets/bg no.png" alt="Illustration" class="section-illustration mb-3">
                    <p>You still haven’t written anything.</p>
                    <button class="btn btn-info">Isulat ang Iyong Unang Akda</button>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error fetching books from Firestore: ", error);
    }
}



let countsss = 0;


async function fetchBooksFromLibrary(userId) {
    try {
       
        const storyCardsContainer = document.querySelector('.story-cards3 .row');
        storyCardsContainer.innerHTML = `
            <div class="loading-spinner text-center">
                <div class="spinner-border text-info" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p>Loading books...</p>
            </div>
        `;


        const booksRef = collection(db, 'users', userId, 'mylibrary');
        const querySnapshot = await getDocs(booksRef);

   
        if (querySnapshot.empty) {
            console.log("No books found in the library.");
            
     
            const emptyStateHTML = ` 
               <div class="writing-section text-center" data-bs-toggle="modal" data-bs-target="#bookModal">
                    <img src="/assets/bg no.png" alt="Illustration" class="section-illustration mb-3">
                    <p>No matching books found in your library.</p>
                </div>
            `;
            storyCardsContainer.innerHTML = emptyStateHTML;
            return;
        }


        let books = [];


        let allCardsHTML = '';  
        let foundBook = false;  

        for (const doc of querySnapshot.docs) {
            const timestampEpoch = parseInt(doc.id, 10);  // Convert the book ID (timestamp) to an integer
        
           
            const usersRef = collection(db, 'users'); 
            const allUsersSnapshot = await getDocs(usersRef);
  
            for (const userDoc of allUsersSnapshot.docs) {
       
                const userBooksRef = collection(db, 'users', userDoc.id, 'books');
                const userBooksSnapshot = await getDocs(userBooksRef);

        
                for (const bookInUserCollection of userBooksSnapshot.docs) {
                    const bookInUserData = bookInUserCollection.data();
                    const bookTimestampEpoch = bookInUserData.timestampEpoch; 
                    

                    if (bookTimestampEpoch === timestampEpoch) {
                        foundBook = true; 
                    
                     
                        books.push(bookInUserData);

                
                        const { title, author, content, coverImageURL } = bookInUserData;


                        const cardHTML = `
                            <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                             <div class="story-cards3" data-book-timestamp="${timestampEpoch}">
                                    <img src="${coverImageURL || '/assets/pc.png'}" alt="Book Cover" class="img-fluid book-cover">
                                    <div class="card-details">
                                        <h4>${title}</h4>
                                        <p class="author">${author ? `By ${author}` : 'Unknown Author'}</p>
                                        <p class="content">${content ? content.substring(0, 20) + '...' : 'No content available'}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                     
                        allCardsHTML += cardHTML;
                    }
                }
            }
        }


        if (foundBook) {
            storyCardsContainer.innerHTML = allCardsHTML;
            Swal.close();
            // Add click event listeners to the cards
            const storyCards = document.querySelectorAll('.story-cards3');
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
        } else {
    
            const emptyStateHTML = `
                <div class="writing-section text-center" data-bs-toggle="modal" data-bs-target="#bookModal">
                    <img src="/assets/bg no.png" alt="Illustration" class="section-illustration mb-3">
                    <p>No matching books found in your library.</p>
                </div>
            `;
            storyCardsContainer.innerHTML = emptyStateHTML;
        }

    } catch (error) {
        console.error("Error fetching books from Firestore:", error);
        storyCardsContainer.innerHTML = '<p class="text-danger">Error fetching books. Please try again later.</p>';
    }
    finally{
        Swal.close();
    }
}
//recommended
async function fetchBook(userId) {
    try {
        const storyCardsContainer = document.querySelector('.story-cardss .row');

        storyCardsContainer.innerHTML = ` 
            <div class="loading-spinner text-center">
                <div class="spinner-border text-info" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p>Loading Recommended Books...</p>
            </div>
        `;

        const userDocRef = doc(db, 'users', userId); 
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.error("User not found.");
            return;
        }

        const userGenres = userDoc.data().genre || []; 

        console.log("User Genres (Array): ", userGenres);

        const booksRef = collectionGroup(db, 'books');
        const querySnapshot = await getDocs(booksRef);

        storyCardsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            storyCardsContainer.innerHTML = '<p>No books found.</p>';
            return;
        }

        const books = [];

        querySnapshot.forEach((doc) => {
            const book = doc.data();
            const {
                title = "Unknown Title",
                author = "Unknown Author",
                content = "No Content",
                genre = "Unknown Genre", 
                cover = null,
                timestampEpoch = null,
                bookStatus = "Pending"  
            } = book;

            console.log("Book Retrieved: ", book);

            if (userGenres.includes(genre) && bookStatus === 'Approved') {
                books.push({
                    id: doc.id,
                    ...book
                });

                console.log("Matched Book: ", title);

         
                const cardHTML = `
                    <div class="col-6 col-sm-4 col-md-3 col-lg-2-4 mb-3">
                        <div class="story-cardss" data-book-timestamp="${timestampEpoch}">
                            <img src="${cover ? cover : '/assets/pc.png'}" alt="Book Cover" class="img-fluid">
                            <div class="card-details">
                                <h4>${title}</h4>
                                <p class="author">${author ? `By ${author}` : 'Unknown Author'}</p>
                                <p class="genre">${genre}</p>
                            </div>
                        </div>
                    </div>
                `;

                storyCardsContainer.insertAdjacentHTML('beforeend', cardHTML);
            } else {
                console.log(`Book "${title}" doesn't match genres or is not approved.`);
            }
        });

        // Log the final list of matched books
        console.log("Books Matched and Approved: ", books);

        // Add click event listeners to each book card
        const storyCards = document.querySelectorAll('.story-cardss');
        storyCards.forEach((card) => {
            card.addEventListener('click', () => {
                const bookTimestamp = card.getAttribute('data-book-timestamp');
                console.log('Card clicked! Timestamp:', bookTimestamp);
                const clickedBook = books.find(book => book.timestampEpoch == bookTimestamp);

                if (clickedBook) {
                    console.log('Clicked Book Found:', clickedBook);
                    localStorage.setItem('selectedBookTimestamp', clickedBook.timestampEpoch);
                    window.location.href ="../pages/readbook.html";
                } else {
                    console.error('No book found for the clicked card.');
                }
            });
        });

    } catch (error) {
        console.error("Error fetching books from Firestore: ", error);
    
        storyCardsContainer.innerHTML = '<p class="text-danger">Error fetching books. Please try again later.</p>';
    }  
}





// Function to calculate age based on birthdate
function calculateAge(birthdate) {
    const birthDateObj = new Date(birthdate); // Convert birthdate to Date object
    const today = new Date(); // Current date

    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    const dayDiff = today.getDate() - birthDateObj.getDate();

    // Adjust if the birthdate has not occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    
    return age;
}

function fetchUserProfile(userId) {
    const userRef = doc(db, "users", userId); // Reference to the user's document in Firestore

    getDoc(userRef).then((docSnap) => { // Use getDoc for a single document
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("User profile data:", userData);

            // Handle missing values and update the DOM accordingly
            const username = userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : "N/A";
            const bio = userData.gender || "N/A";
            const email = userData.email || "N/A";
            const profileImage = userData.profilePicture || "../assets/bg no.png"; // Default image if profile image is not provided

            // Fetch and calculate age if birthdate exists
            let age = "N/A"; // Default value
            if (userData.birthdate) {
                age = calculateAge(userData.birthdate); // Compute the age using the birthdate
            }

            // Update the profile card with the user data
            document.getElementById("profile-username").textContent = username;
            document.getElementById("profile-age-bio").innerHTML = `Age: ${age} <span class="separator">|</span> Gender: ${bio}`;
        
            document.getElementById("profile-email").textContent = `Email: ${email}`;
            document.getElementById("profile-published").textContent = `${countsss}`;
            document.querySelector(".profile-avatar").src = profileImage;

            // Store the user's first name and last name globally or pass them to the form submission function
            window.currentUserProfile = {
                firstName: userData.firstName || "Unknown",
                lastName: userData.lastName || "User",
                email: userData.email || "N/A",
                bio: bio,
                age: age,
                profileImage: profileImage
            };
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.error("Error fetching user profile:", error);
    });
}

window.addEventListener('DOMContentLoaded', function() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (userId) {
        fetchUserProfile(userId); 
        fetchBook();
        fetchBooksToAll();
        attachLogoutEventListener();
    }
});

import { auth, db, } from './index.js';
import { setDoc, doc, serverTimestamp,getDoc, getDocs, collection , query, where,collectionGroup,deleteDoc} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { onAuthStateChanged , signOut} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
 

 const storage = getStorage();
 onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user);
        fetchBooks(user.uid); 
        fetchBook(user.uid)
        fetchUserProfile(user.uid)
        fetchBooksToAll(user.uid)
        fetchBooksFromLibrary(user.uid)
        showLoadingSwal()
    } else {
        console.log("No user is authenticated, redirecting to login.");
        window.location.href = '/dist/pages/index.html'; // Redirect to login if not authenticated
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

    // Handle "Add a New Book" Modal Form Submission
document.addEventListener("DOMContentLoaded", function () {


    const bookForm = document.getElementById("bookForm");
    bookForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const bookTitle = document.getElementById("bookTitle").value.trim();
        const bookAuthor = document.getElementById("bookAuthor").value.trim();
        const bookContent = document.getElementById("bookContent").value.trim();
        const bookCover = document.getElementById("bookCover").files[0]; // File input
        const sanitizedBookTitle = bookTitle.replace(/[^a-zA-Z0-9_]/g, '_');
        // Check if there's a book cover to upload
        if (bookCover) {
            const storageRef = ref(getStorage(), `bookCovers/${auth.currentUser.uid}/${Date.now()}_${bookCover.name}`);
            if (bookCover.size > 5000000) {
                Swal.fire({
                    title: 'Error!',
                    text: 'File size is too large. Please upload a smaller file.',
                    icon: 'error',
                    confirmButtonText: 'Try Again'
                });
                return;
            }

            // Show loading Swal
            const loadingSwal = Swal.fire({
                title: 'Uploading... Please wait.',
                text: 'Your book cover is being uploaded.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Upload the file to Firebase Storage
            uploadBytes(storageRef, bookCover).then((snapshot) => {
                console.log("File uploaded successfully:", snapshot);

                // Get the download URL after upload
                getDownloadURL(snapshot.ref).then((downloadURL) => {
                    console.log("Download URL:", downloadURL);
                    const timestampEpoch = Date.now()
                    const userBookRef = doc(db, "users", auth.currentUser.uid, "books",`${timestampEpoch}` );
                    setDoc(userBookRef, {
                        title: bookTitle,
                        content: bookContent,
                        author: bookAuthor,
                        coverFileName: bookCover.name,
                        coverImageURL: downloadURL,
                        genre: selectedGenre, // Add the selected genre
                        createdAt: serverTimestamp(),
                        timestampEpoch: timestampEpoch,
                        uploader: `${window.currentUserProfile.firstName} ${window.currentUserProfile.lastName}`,
                        bookStatus: "Pending"
                    }).then(() => {
                        loadingSwal.close(); // Close loading Swal

                        Swal.fire({
                            title: 'Success!',
                            text: 'Your story has been submitted for proofreading. We will notify you once the review is complete.',
                            icon: 'success',
                            confirmButtonText: 'Okay'
                        });

                        // Clear the form and close modal
                        bookForm.reset();
                        closeModal("#bookModal");
                    }).catch((error) => {
                        loadingSwal.close();
                        console.error('Error adding book to Firestore:', error);
                        Swal.fire({
                            title: 'Error!',
                            text: 'There was an error adding the book: ' + error.message,
                            icon: 'error',
                            confirmButtonText: 'Try Again'
                        });
                    });
                }).catch((error) => {
                    loadingSwal.close();
                    console.error('Error getting download URL:', error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'There was an error getting the file URL: ' + error.message,
                        icon: 'error',
                        confirmButtonText: 'Try Again'
                    });
                });
            }).catch((error) => {
                loadingSwal.close();
                console.error('Error uploading file:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was an error uploading the file: ' + error.message,
                    icon: 'error',
                    confirmButtonText: 'Try Again'
                });
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Please select a cover image for the book.',
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    });

    // Function to close modals
  
});
//close modal function
function closeModal(modalId) {
    const modal = document.querySelector(modalId);
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();
}
// upload a book with a file
document.addEventListener("DOMContentLoaded", function () {
   
    const submitButton = document.getElementById("submitBookBtn");
    submitButton.addEventListener("click", function (e) {
        e.preventDefault();
        uploadBook(selectedGenre);
    });
});

async function uploadBook() {
    // Get the current authenticated user
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to upload a book.');
        return;
    }

    // Get input values from the form
    const bookTitle = document.getElementById('bookTitleUpload').value.trim();
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput ? fileInput.files[0] : null; // Ensure the file is selected
    const isPublic = document.getElementById('publicUpload').checked ? 'all' : 'private';


    // Validate form data
    if (!bookTitle || !file || !selectedGenre) {
        alert('Please provide all details: Title, file, and genre.');
        return;
    }

    try {
        // Show some loading feedback to the user (optional)
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while your book is being uploaded.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Upload the file to Firebase Storage
        const storageRef = ref(storage, `books/${user.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);

        // Get the download URL of the uploaded file
        const downloadURL = await getDownloadURL(uploadResult.ref);

        // Save book details to Firestore under the user's uploaded books collection
        const bookDocRef = doc(collection(db, "users", user.uid, 'uploadedBooks'));

        await setDoc(bookDocRef, {
            title: bookTitle,
            filenamePath: downloadURL,
            genre: selectedGenre,
            bookStatus: isPublic,  // 'all' or 'private'
            uploadedBy: `${user.displayName || user.email}`,  // Use the user's displayName or email
            timestamp: serverTimestamp(),
        });

        // Close the modal after successful upload
        closeModal("#uploadModal");

        // Display success message
        Swal.fire({
            title: 'Success!',
            text: 'Your book has been uploaded successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
        });

    } catch (error) {
        console.error('Error uploading book:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to upload the book. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

let selectedGenre = '';

document.querySelectorAll('.genre-btn').forEach(button => {
    button.addEventListener('click', function () {
    
        document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));

        this.classList.add('active');
        selectedGenre = this.getAttribute('data-genre');
        console.log("Selected Genre:", selectedGenre); // For debugging
    });
});

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
                    window.location.href = 'readbook.html';
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

//All Books
async function fetchBooks(userId) {
    try {
        const storyCardsContainer = document.querySelector('.story-cards2');
        storyCardsContainer.innerHTML = `
            <div class="loading-spinner text-center">
                <div class="spinner-border text-info" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p>Loading books...</p>
            </div>
        `;

        const booksRef = collection(db, 'users', userId, 'books');
        const querySnapshot = await getDocs(booksRef);

        storyCardsContainer.innerHTML = ''; 
        const books = [];
        let rowHTML = '<div class="row">'; 
        let countbook = 0;

        if (querySnapshot.empty) {
            const emptyStateHTML = `
                <div class="writing-section text-center" data-bs-toggle="modal" data-bs-target="#bookModal">
                    <img src="/assets/bg no.png" alt="Illustration" class="section-illustration mb-3">
                    <p>You still haven’t written anything.</p>
                    <button class="btn btn-info">Isulat ang Iyong Unang Akda</button>
                </div>
            `;
            storyCardsContainer.innerHTML = emptyStateHTML;
            return;
        }

        querySnapshot.forEach((doc, index) => {
            const book = doc.data();
            const {
                title = "Unknown Title",
                author = "Unknown Author",
                content = "No Content",
                coverImageURL = null,
                timestampEpoch = null
            } = book;


            books.push({ ...book, timestampEpoch });

            const cardHTML = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                    <div class="story-cards" data-book-timestamp="${timestampEpoch}">
                        <img src="${coverImageURL ? coverImageURL : '/assets/pc.png'}" alt="Book Cover" class="img-fluid book-cover">
                        <div class="card-details">
                            <h4>${title}</h4>
                            <p class="author">${author}</p>
                            <p class="content">${content.substring(0, 20)}...</p>
                        </div>
                    </div>
                </div>
            `;

            rowHTML += cardHTML;
            countbook++;

            if ((index + 1) % 4 === 0) {
                rowHTML += '</div><div class="row">'; // Start a new row after 4 books
            }
        });

        rowHTML += '</div>'; // Close the last row
        storyCardsContainer.innerHTML = rowHTML;
        const storyCards = document.querySelectorAll('.story-cards');
        storyCards.forEach((card) => {
            card.addEventListener('click', () => {
                const bookTimestamp = card.getAttribute('data-book-timestamp');
                console.log('Card clicked! Timestamp All Books:', bookTimestamp);

                const clickedBook = books.find(book => book.timestampEpoch == bookTimestamp);

                if (clickedBook) {
                    console.log('Clicked Book Found:', clickedBook);

                    // Store the book timestamp in localStorage
                    localStorage.setItem('selectedBookTimestamp', clickedBook.timestampEpoch);

                    // Navigate to the readbook.html page
                    window.location.href = 'readbook.html';
                } else {
                    console.error('No book found for the clicked card.');
                }
            });
        });

    } catch (error) {
        storyCardsContainer.innerHTML = '<p class="text-danger">Error fetching books. Please try again later.</p>';
        console.error("Error fetching books from Firestore:", error);
    }
}

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

                        window.location.href = 'readbook.html';
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
                    window.location.href = 'readbook.html';
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
            const profileImage = userData.profilePicture || "/assets/bg no.png"; // Default image if profile image is not provided

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
        fetchBooks(userId);
        fetchBook();
        fetchBooksToAll();
        attachLogoutEventListener();
    }
});

import { auth, db } from './index.js';
import { getDocs, collection, query, where } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

const messages = [
    { text: "Maligayang pagdating! Basahin at tuklasin ang aklat na ito.", image: "/pages/assets/lola.png" },
    { text: "Alam mo ba? Ang aklat na ito ay may mga nakakatuwang impormasyon.", image: "/pages/assets/lolakausap.png" },
    { text: "Magpatuloy ka lang, magaling ka!", image: "/pages/assets/lola2.png" },
    { text: "Magpahinga ka muna, at tamasahin ang kwento!", image: "/pages/assets/lolawithsimangut.png" },
    { text: "Huwag titigil, ang bawat pahina ay may bagong aral.", image: "/pages/assets/lola2.png" },
    { text: "Bawat kabanata ay puno ng kasiyahan. Basahin mo na!", image: "/pages/assets/lola.png" },
    { text: "Nasa tamang landas ka, patuloy lang sa pagbabasa.", image: "/pages/assets/lola2.png" },
    { text: "Ang aklat na ito ay magdadala sa iyo sa bagong mundo.", image: "/pages/assets/lola.png" },
    { text: "Tandaan, ang bawat kwento ay may aral na matutunan.", image: "/pages/assets/lolakausap.png" },
    { text: "Napakahalaga ng bawat salita sa kwentong ito.", image: "/pages/assets/lola.png" },
    { text: "Bawat pahina ay may kasamang sorpresa!", image: "/pages/assets/lola2.png" },
    { text: "Laging may bagong bagay na matutuklasan sa bawat kabanata.", image: "/pages/assets/lola.png" },
    { text: "Ang mga karakter sa kwento ay magpapakita ng tunay na tapang.", image: "/pages/assets/lolakausap.png" },
    { text: "Huwag matakot sa mga pagsubok, dahil lahat ay may solusyon.", image: "/pages/assets/lolawithsimangut.png" },
    { text: "Sumubok ng bagong bagay sa bawat pag-pihit ng pahina.", image: "/pages/assets/lolawithsimangut.png" },
    { text: "Makakahanap ka ng kasiyahan sa bawat kwento.", image: "/pages/assets/lolawithsimangut.png" },
    { text: "Ang aklat na ito ay isang biyaya na magdadala ng saya.", image: "/pages/assets/lolawithsimangut.png" },
    { text: "Ang bawat kwento ay may tagpo ng pag-asa at saya.", image: "/pages/assets/lolakausap.png" },
    { text: "Huwag kalimutang magpahinga at mag-relax habang nagbabasa.", image: "/pages/assets/lolakausap.png" },
    { text: "Bawat kwento ay isang paglalakbay sa kamangha-manghang mundo.", image: "/pages/assets/lolawithsimangut.png" },
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
let bookContentChunks = [];
let currentPage = 0;
const wordsPerPage = 300; 
function splitContentIntoPages(content) {
    const words = content.split(' ');
    let pages = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
        const pageContent = words.slice(i, i + wordsPerPage).join(' ');
        pages.push(pageContent);
    }

    return pages;
}
function displayPage(pageIndex) {
    const bookContentElement = document.getElementById('book-content');
    if (bookContentChunks.length > 0) {
        bookContentElement.innerHTML = `
            <h4>Pahina ${pageIndex + 1}</h4>
            <p>${bookContentChunks[pageIndex]}</p>
        `;
    }

    // Enable or disable buttons based on current page
    document.querySelector('.back-btn').disabled = (pageIndex === 0);
    document.querySelector('.next-btn').disabled = (pageIndex === bookContentChunks.length - 1);
}
async function queryBookAcrossAllUsersByTimestamp(timestampEpoch) {
    try {
        const timestampInt = Math.floor(parseInt(timestampEpoch, 10));
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);

        if (!usersSnapshot.empty) {
            let bookFound = false;

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
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

                        let formattedDate = "Unknown Date";
                        if (createdAt && !isNaN(createdAt)) {
                            const date = new Date(createdAt * 1000);
                            formattedDate = date.toLocaleString();
                        }

                        // Translate the genre to Tagalog
                        let genreTagalog = '';
                        switch (genre.toLowerCase()) {
                            case 'fiction':
                                genreTagalog = 'Piksyon';
                                break;
                            case 'non-fiction':
                            case 'nonfiction':
                                genreTagalog = 'Di-Piksyon';
                                break;
                            case 'romance':
                                genreTagalog = 'Romansa';
                                break;
                            case 'science fiction':
                                genreTagalog = 'Agham-Piksyon';
                                break;
                            case 'fantasy':
                                genreTagalog = 'Pantasya';
                                break;
                            case 'horror':
                                genreTagalog = 'Katatakutan';
                                break;
                            case 'mystery':
                                genreTagalog = 'Misteryo';
                                break;
                            case 'thriller':
                                genreTagalog = 'Kapana-panabik';
                                break;
                            case 'biography':
                                genreTagalog = 'Talambuhay';
                                break;
                            case 'history':
                                genreTagalog = 'Kasaysayan';
                                break;
                            default:
                                genreTagalog = genre;
                                break;
                        }

                        document.getElementById('book-title').textContent = title;
                        document.getElementById('book-author').textContent = `Ni ${author} | Petsa ng Pagkakalathala: ${formattedDate}`;
                        document.getElementById('book-genre').textContent = `Genre: ${genreTagalog}`;
                        
                        if (coverImageURL) {
                            const coverElement = document.getElementById('book-cover');
                            coverElement.src = coverImageURL;
                            coverElement.style.display = 'block';
                        } else {
                            document.getElementById('book-cover').style.display = 'none';
                        }

                        // Split content into pages
                        bookContentChunks = splitContentIntoPages(content);

                        // Display the first page
                        displayPage(0);

                        bookFound = true;
                    });

                    if (bookFound) {
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

// Event listeners for navigation buttons
document.querySelector('.next-btn').addEventListener('click', () => {
    if (currentPage < bookContentChunks.length - 1) {
        currentPage++;
        displayPage(currentPage);
    }
});

document.querySelector('.back-btn').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        displayPage(currentPage);
    }
});
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
    }, 5000); // Hide after 3 seconds
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


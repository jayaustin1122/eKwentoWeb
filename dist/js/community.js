import { auth, db } from './index.js';
import { setDoc, doc, serverTimestamp, getDoc, getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

const storage = getStorage();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';

    
        document.querySelector('.publish-button').addEventListener('click', async () => {
            const storyContent = document.querySelector('textarea').value;
            const imageInput = document.querySelector('input[type="file"]').files[0];

            if (storyContent) {
         
                Swal.fire({
                    title: 'Publishing...',
                    text: 'Please wait while we publish your story.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                try {
                    let imageUrl = '';

                    if (imageInput) {
                        const imageRef = ref(storage, `stories/${user.uid}/${imageInput.name}`);
                        await uploadBytes(imageRef, imageInput);
                        imageUrl = await getDownloadURL(imageRef);
                    }

 
                    const storyData = {
                        content: storyContent,
                        imageUrl: imageUrl || null,  
                        timestamp: serverTimestamp(),
                        uploader: `${firstName} ${lastName}`
                    };

                 
                    await setDoc(doc(collection(db, "stories")), storyData);

    
                    document.querySelector('textarea').value = '';
                    document.querySelector('input[type="file"]').value = '';

                    Swal.fire({
                        icon: 'success',
                        title: 'Story Published',
                        text: 'Your story has been published successfully!',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error("Error publishing story:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to Publish',
                        text: 'An error occurred while publishing your story. Please try again.',
                    });
                }
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Incomplete',
                    text: 'Please write a story before publishing.',
                });
            }
        });
    } else {
        console.log("User is not logged in");
    }
});
const displayStories = async () => {
    const storiesContainer = document.querySelector('.mt-4');
    const storiesSnapshot = await getDocs(collection(db, 'stories'));

    if (storiesSnapshot.empty) {
      
        storiesContainer.innerHTML = `
            <div class="text-center mt-4">
                <img src="/assets/Community bg.png" alt="Empty feed illustration">
                <p>You haven't posted anything</p>
            </div>
        `;
    } else {

        let storiesHTML = '';
        storiesSnapshot.forEach(doc => {
            const story = doc.data();
            storiesHTML += `
                <div class="story">
                    ${story.imageUrl ? `<img src="${story.imageUrl}" alt="Story Image">` : ''}
                    <div class="story-content">
                        <h5>${story.uploader}</h5>
                        <p>${story.content}</p>
                        <small>${new Date(story.timestamp.seconds * 1000).toLocaleString()}</small>
                    </div>
                </div>
            `;
        });
        storiesContainer.innerHTML = storiesHTML;
    }
};

displayStories();

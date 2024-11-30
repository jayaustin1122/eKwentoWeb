import { auth, db } from './index.js';
import { updateDoc,setDoc, doc, serverTimestamp,getDoc, getDocs, collection , query, where,collectionGroup,} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { onAuthStateChanged,reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

 const storage = getStorage();
 onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in:", user);
        document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
        fetchUserProfile(user.uid)
        document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    } else {
        console.log("No user is authenticated, redirecting to login.");
        window.location.href = "../pages/sign_in.html"; // Redirect to login if not authenticated
    }
});
function fetchUserProfile(userId) {
    const userRef = doc(db, "users", userId);

    getDoc(userRef).then((docSnap) => { 
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("User profile data:", userData);

        
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('birthdate').value = userData.birthdate || '';
            document.getElementById('gender').value = userData.gender || '';
            document.getElementById('address').value = userData.address || 'Not Set';

      
           const profilePictureImg = document.querySelector('img[alt="Profile Placeholder"]');
           if (userData.profilePicture) {
               profilePictureImg.src = userData.profilePicture;
           }
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.error("Error fetching user profile:", error);
    });
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target;

    // Ensure form is valid
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const user = auth.currentUser;
    if (user) {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const birthdate = document.getElementById('birthdate').value;
        const gender = document.getElementById('gender').value;
        const address = document.getElementById('address').value;
        const profilePictureFile = document.getElementById('profilePicture').files[0]; // Check if a file is selected

        try {
            Swal.fire({
                title: 'Updating Profile...',
                text: 'Please wait while we update your profile.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const userRef = doc(db, 'users', user.uid);
            let profilePictureURL = ''; 

            
            console.log("Profile Picture File: ", profilePictureFile);

        
            if (profilePictureFile) {
                const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePictureFile.name}`);
                await uploadBytes(storageRef, profilePictureFile);
                profilePictureURL = await getDownloadURL(storageRef);
                
         
                console.log("Profile Picture URL: ", profilePictureURL);
            }

       
            const updateData = {
                firstName,
                lastName,
                birthdate,
                gender,
                address,
            };


            if (profilePictureURL) {
                updateData.profilePicture = profilePictureURL;
            }

            await updateDoc(userRef, updateData);

            Swal.fire({
                title: 'Success!',
                text: 'Profile updated successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
       
                window.location.href = '../pages/dashboard.html'; 
            });

            form.reset();
            form.classList.remove('was-validated');

        } catch (error) {
            console.error("Error updating user data: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error updating your profile.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } else {
        Swal.fire('Error', 'No user is logged in.', 'error');
    }
}

// -------------------------------------------------- Handle Password Change
async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const user = auth.currentUser;
    if (user) {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            Swal.fire({
                title: 'Error!',
                text: 'New passwords do not match.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Changing Password...',
                text: 'Please wait while we update your password.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
         
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Update to the new password
            await updatePassword(user, newPassword);

            Swal.fire({
                title: 'Success!',
                text: 'Password changed successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Navigate to the dashboard after success
                window.location.href = '../pages/dashboard.html'; 
            });


            form.reset(); // Reset form after success

        } catch (error) {
            console.error("Error changing password: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error changing your password.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } else {
        Swal.fire('Error', 'No user is logged in.', 'error');
    }
}
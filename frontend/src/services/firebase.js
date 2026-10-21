/**
 * firebase.js
 * 
 * Firebase client service for ConnectHearts.
 * Provides Firebase Cloud Storage for profile/gallery photos and
 * Firebase Authentication for one-click Google Sign-In.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase safely (prevent duplicate app initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

/**
 * Sign in using Google OAuth Popup
 * Returns user profile info and Firebase ID token for backend authentication
 */
export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        phoneNumber: result.user.phoneNumber,
      },
      idToken
    };
  } catch (error) {
    console.error("Google sign-in popup error:", error);
    throw error;
  }
}

/**
 * Upload a profile or gallery photo directly to Firebase Cloud Storage
 * Returns the permanent HTTPS download URL
 * 
 * @param {File|Blob} file The image file or blob
 * @param {string} userId The current user's ID
 * @param {string} folder Target storage folder ('profiles' | 'gallery')
 * @returns {Promise<string>} Public download URL
 */
export async function uploadPhotoToFirebase(file, userId = "anonymous", folder = "profiles") {
  if (!file) throw new Error("No file provided for upload.");

  try {
    // Sanitize filename and create unique timestamped path
    const cleanFileName = (file.name || "photo.jpg").replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `connecthearts/${folder}/${userId}/${Date.now()}_${cleanFileName}`;
    const storageReference = ref(storage, filePath);

    const metadata = {
      contentType: file.type || "image/jpeg",
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        userId
      }
    };

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageReference, file, metadata);
    
    // Retrieve permanent public download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Firebase Storage upload failed:", error);
    throw error;
  }
}

/**
 * Optional helper to delete a photo from Firebase Storage
 */
export async function deletePhotoFromFirebase(photoUrl) {
  if (!photoUrl || !photoUrl.includes("firebasestorage.googleapis.com")) {
    return false;
  }
  try {
    const storageRef = ref(storage, photoUrl);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn("Failed to delete Firebase photo:", err.message);
    return false;
  }
}

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export { firebaseSignOut };
export default app;

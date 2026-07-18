import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// We reuse the initialized Firebase app if possible, or initialize a new one.
// The main app is initialized in App.tsx but let's check if we can reuse the default auth instance.
import { auth as mainAuth } from "./firebase";

const auth = mainAuth;

const provider = new GoogleAuthProvider();
// Add Google Slides, Sheets, and Drive scopes requested by the user
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/drive.readonly");
provider.addScope("https://www.googleapis.com/auth/presentations");
provider.addScope("https://www.googleapis.com/auth/presentations.readonly");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initializer for workspace auth listeners
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign-In with popup specifically configured for requested workspace scopes
export const googleWorkspaceSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google Workspace access token from Auth flow");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Workspace sign-in error: ", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setWorkspaceAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const workspaceLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Firebase Admin SDK initialization
 * Path: src/config/firebaseConfig.ts
 */

import {
  initializeApp,
  cert,
  getApps,
  App,
  AppOptions,
  ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

/**
 * Retrieves Firebase configuration from environment variables
 * @returns Firebase application configuration object
 * @throws Error if any required environment variables are missing
 */
const getFirebaseConfig = (): AppOptions => {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY
  ) {
    throw new Error(
      "Missing Firebase configuration. Please check your environment variables."
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    // CRITICAL: Replace escaped newlines with actual newlines
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  return {
    credential: cert(serviceAccount),
  };
};

/**
 * Initializes Firebase Admin SDK if not already initialized
 * Implements singleton pattern to ensure only one Firebase app instance
 * @returns Firebase Admin app instance
 */
const initializeFirebaseAdmin = (): App => {
  const existingApp: App = getApps()[0];
  if (existingApp) {
    return existingApp;
  }
  return initializeApp(getFirebaseConfig());
};

// Initialize Firebase
const app: App = initializeFirebaseAdmin();

// Get service instances
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth };
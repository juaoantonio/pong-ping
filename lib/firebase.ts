import { getApp, getApps, initializeApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

function requirePublicEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: requirePublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requirePublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  databaseURL: requirePublicEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
  projectId: requirePublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requirePublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requirePublicEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: requirePublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: requirePublicEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const realtimeDatabase = getDatabase(firebaseApp);

let analytics: Analytics | null = null;

export async function getFirebaseAnalytics() {
  if (analytics || typeof window === "undefined") {
    return analytics;
  }

  const { getAnalytics, isSupported } = await import("firebase/analytics");

  if (!(await isSupported())) {
    return null;
  }

  analytics = getAnalytics(firebaseApp);
  return analytics;
}

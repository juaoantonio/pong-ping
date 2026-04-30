import { getApp, getApps, initializeApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBUsg3n2yXoyrdpFB8bmT3P4eHb_2ga5PM",
  authDomain: "pong-ping-f53bf.firebaseapp.com",
  databaseURL: "https://pong-ping-f53bf-default-rtdb.firebaseio.com",
  projectId: "pong-ping-f53bf",
  storageBucket: "pong-ping-f53bf.firebasestorage.app",
  messagingSenderId: "644026686433",
  appId: "1:644026686433:web:bea0fa6af86f669671d0a0",
  measurementId: "G-DPM4K4LHEL",
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

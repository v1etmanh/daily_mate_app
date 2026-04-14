// utils/firebaseConfig.js
// ⚠️  ĐIỀN CONFIG CỦA BẠN VÀO ĐÂY
// Lấy tại: Firebase Console → Project Settings → Your apps → SDK setup
// firebase JS SDK hoạt động với Expo Go — không cần native build

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
   apiKey: "AIzaSyCdBs-0aXwH3Y83FOYEMCva_v1bTdFXaAM",
  authDomain: "jpdweb-9d3d3.firebaseapp.com",
  projectId: "jpdweb-9d3d3",
  storageBucket: "jpdweb-9d3d3.firebasestorage.app",
  messagingSenderId: "278913880737",
  appId: "1:278913880737:web:51842f03526615535856e0",
  measurementId: "G-EKPBVXN961"
};


// Tránh init nhiều lần khi hot-reload
const isNew = getApps().length === 0;
const app   = isNew ? initializeApp(firebaseConfig) : getApps()[0];

// initializeFirestore chỉ gọi được 1 lần — getFirestore cho các lần sau
export const firestore = isNew
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    })
  : getFirestore(app);

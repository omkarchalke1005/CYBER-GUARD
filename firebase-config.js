window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const hasRealFirebaseConfig = () => {
  const config = window.firebaseConfig || {};
  return Boolean(
    config.apiKey &&
    config.apiKey !== 'YOUR_API_KEY' &&
    config.projectId &&
    config.projectId !== 'YOUR_PROJECT_ID' &&
    config.appId &&
    config.appId !== 'YOUR_APP_ID'
  );
};

if (window.firebase && typeof window.firebase.initializeApp === 'function' && hasRealFirebaseConfig()) {
  window.firebase.initializeApp(window.firebaseConfig);
}

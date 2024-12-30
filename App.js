import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Firebase configuration using environment variables
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Handle Login/Register
  const handleAuth = async () => {
    try {
      if (isLoginMode) {
        // Login
        await firebase.auth().signInWithEmailAndPassword(email, password);
      } else {
        // Register
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        alert('Account created! Please log in.');
        setIsLoginMode(true);
      }
      setUser(firebase.auth().currentUser);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      setUser(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  useEffect(() => {
    // Set user on initial load
    firebase.auth().onAuthStateChanged(setUser);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px', color: 'white', backgroundColor: '#1e1e1e' }}>
      <h1>Inventory System</h1>
      {!user ? (
        <div style={{ margin: '20px auto', maxWidth: '400px', padding: '20px', backgroundColor: '#2c2c2c' }}>
          <h2>{isLoginMode ? 'Login' : 'Register'}</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: '90%', padding: '10px', margin: '10px 0', borderRadius: '5px', fontSize: '16px' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ width: '90%', padding: '10px', margin: '10px 0', borderRadius: '5px', fontSize: '16px' }}
          />
          <button
            onClick={handleAuth}
            style={{ backgroundColor: '#007bff', color: 'white', padding: '10px', borderRadius: '5px', fontSize: '16px' }}
          >
            {isLoginMode ? 'Login' : 'Register'}
          </button>
          <p>
            {isLoginMode ? (
              <>Don't have an account? <a href="#" onClick={() => setIsLoginMode(false)}>Register here</a></>
            ) : (
              <>Already have an account? <a href="#" onClick={() => setIsLoginMode(true)}>Login here</a></>
            )}
          </p>
        </div>
      ) : (
        <div style={{ margin: '20px auto', maxWidth: '400px', padding: '20px', backgroundColor: '#2c2c2c' }}>
          <h2>Welcome, {user.email}!</h2>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#d9534f', color: 'white', padding: '10px', borderRadius: '5px', fontSize: '16px' }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

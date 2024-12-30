// Firebase Initialization
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Your Firebase config (replace these values with your own credentials)
const firebaseConfig = {
  apiKey: "AIzaSyBp4FWfR8GLz6zdvitnSJUTp9l4ALTorK8",
  authDomain: "anoti-10cf5.firebaseapp.com",
  projectId: "anoti-10cf5",
  storageBucket: "anoti-10cf5.firebasestorage.app",
  messagingSenderId: "72026208202",
  appId: "1:72026208202:web:3e4c88f784e8a8d4bb8133"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const authContainer = document.getElementById("auth");
const welcomeContainer = document.getElementById("welcome");
const inventorySection = document.getElementById("inventorySection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authAction = document.getElementById("authAction");
const logoutButton = document.getElementById("logout");
const tableBody = document.querySelector("#inventoryTable tbody");

// State variables
let isLoginMode = true;

// Switch between Login and Register
document.getElementById("switchToRegister").addEventListener("click", (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  authAction.textContent = isLoginMode ? "Login" : "Register";
});

// Handle Login/Register
authAction.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    if (isLoginMode) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
      isLoginMode = true;
      alert("Account created. Please log in.");
    }
    showWelcome();
  } catch (error) {
    alert(error.message);
  }
});

// Logout functionality
logoutButton.addEventListener("click", async () => {
  await auth.signOut();
  showAuth();
});

// Display UI elements based on authentication state
function showAuth() {
  authContainer.classList.remove("hidden");
  welcomeContainer.classList.add("hidden");
  inventorySection.classList.add("hidden");
}

function showWelcome() {
  authContainer.classList.add("hidden");
  welcomeContainer.classList.remove("hidden");
  inventorySection.classList.remove("hidden");
}

// Fetching and displaying inventory from Firestore
async function renderInventory() {
  const userId = auth.currentUser.uid;
  const inventoryRef = db.collection('users').doc(userId).collection('inventory');

  tableBody.innerHTML = "";  // Clear the table

  const snapshot = await inventoryRef.get();
  snapshot.forEach(doc => {
    const item = doc.data();
    const row = `<tr>
      <td>${doc.id}</td>
      <td>${item.barcode}</td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price}</td>
      <td>
        <button onclick="removeItem('${doc.id}')">Remove</button>
        <button onclick="editItem('${doc.id}')">Edit</button>
      </td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

// Removing an item from Firestore
async function removeItem(itemId) {
  const userId = auth.currentUser.uid;
  await db.collection('users').doc(userId).collection('inventory').doc(itemId).delete();
  renderInventory();  // Refresh the inventory view
}

// Editing an item in Firestore
async function editItem(itemId) {
  const userId = auth.currentUser.uid;
  const itemRef = db.collection('users').doc(userId).collection('inventory').doc(itemId);
  const doc = await itemRef.get();
  const item = doc.data();

  document.querySelector("#barcode").value = item.barcode;
  document.querySelector("#name").value = item.name;
  document.querySelector("#quantity").value = item.quantity;
  document.querySelector("#price").value = item.price;

  await itemRef.delete();  // Remove original item
}

// Adding an item to Firestore
document.getElementById("addItemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const barcode = document.querySelector("#barcode").value;
  const name = document.querySelector("#name").value;
  const quantity = document.querySelector("#quantity").value;
  const price = document.querySelector("#price").value;

  const userId = auth.currentUser.uid;

  // Save item to Firestore
  await db.collection('users').doc(userId).collection('inventory').add({
    barcode,
    name,
    quantity,
    price
  });

  renderInventory();  // Refresh the inventory view
  e.target.reset();   // Clear the form
});

// Listen to auth state changes to load the inventory
auth.onAuthStateChanged(async (user) => {
  if (user) {
    showWelcome();
    await renderInventory();
  } else {
    showAuth();
  }
});

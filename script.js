// ✅ Full Firebase-integrated script.js
// 🔄 Replaces localStorage with Firebase Firestore
// ✅ Keeps all UI, forms, Chart.js, layout, and styles intact

// --- Firebase Setup ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔧 Fill in your Firebase config here:
const firebaseConfig = {
  apiKey: "AIzaSyCmp8FuNsCIvJNq1AEYP0GoG9zQhHwVwIY",
  authDomain: "daycount-b1ab6.firebaseapp.com",
  projectId: "daycount-b1ab6",
  storageBucket: "daycount-b1ab6.firebasestorage.app",
  messagingSenderId: "100512162709",
  appId: "1:100512162709:web:2016c57f96bfaafbec8c9c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const entriesCollection = collection(db, "entries");

// --- Firebase Helpers ---
async function fetchAllEntries() {
  const snapshot = await getDocs(entriesCollection);
  const map = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const key = data.date.trim().toLowerCase();
    if (!map[key]) map[key] = { date: data.date, drinks: [], weights: [] };
    map[key].drinks.push(...(data.drinks || []));
    map[key].weights.push(...(data.weights || []));
  });
  return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function saveToFirebase(dateStr, drink, weight) {
  const docRef = doc(entriesCollection, dateStr);
  const existingDoc = await getDoc(docRef);
  let existing = existingDoc.exists() ? existingDoc.data() : { date: dateStr, drinks: [], weights: [] };
  if (drink) existing.drinks.push(drink);
  if (weight) existing.weights.push(weight);
  await setDoc(docRef, existing);
}

// --- Replace LocalStorage with Firebase on Load ---
let entries = [];

function getDateFromDay(dayNum) {
  const base = new Date("2025-06-19");
  base.setDate(base.getDate() + (parseInt(dayNum, 10) - 1));
  return base;
}

function formatDate(date) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("en-GB", options);
}

function updateDaySuggestions() {
  const datalist = document.getElementById("day-suggestions");
  datalist.innerHTML = "";
  const today = new Date();
  const base = new Date("2025-06-19");
  const days = Math.floor((today - base) / (1000 * 60 * 60 * 24)) + 1;
  for (let i = 1; i <= days; i++) {
    const option = document.createElement("option");
    option.value = i.toString();
    datalist.appendChild(option);
  }
}

function renderList() {
  const olList = document.querySelector("ol");
  olList.innerHTML = "";
  entries.forEach((entry) => {
    let text = `completed`;
    if (entry.drinks?.length) text += ", " + entry.drinks.map(d => `${d} liter of water`).join(", ");
    if (entry.weights?.length) text += ", " + entry.weights.map(w => `${w.toUpperCase().endsWith("KG") ? w : w + "KG"} weight`).join(", ");
    text += ` (${entry.date})`;
    const li = document.createElement("li");
    li.textContent = text;
    olList.appendChild(li);
  });
}

function loadAndRender() {
  fetchAllEntries().then((data) => {
    entries = data;
    renderList();
    renderPreviewGraph();
  });
}

// --- Replace LocalStorage Save with Firebase ---
function handleAddWater(day, drink) {
  const dateStr = formatDate(getDateFromDay(day));
  saveToFirebase(dateStr, drink, null).then(loadAndRender);
}

function handleAddWeight(day, weight) {
  const dateStr = formatDate(getDateFromDay(day));
  saveToFirebase(dateStr, null, weight).then(loadAndRender);
}

function handleClearWater(day) {
  const dateStr = formatDate(getDateFromDay(day));
  const docRef = doc(entriesCollection, dateStr);
  setDoc(docRef, { date: dateStr, drinks: [], weights: entries.find(e => e.date === dateStr)?.weights || [] }).then(loadAndRender);
}

function handleClearWeight(day) {
  const dateStr = formatDate(getDateFromDay(day));
  const docRef = doc(entriesCollection, dateStr);
  setDoc(docRef, { date: dateStr, drinks: entries.find(e => e.date === dateStr)?.drinks || [], weights: [] }).then(loadAndRender);
}

// --- Form Event Listeners ---
document.getElementById("add-form").onsubmit = function (e) {
  e.preventDefault();
  const day = document.getElementById("day-input").value.trim();
  const drink = document.getElementById("water-input").value.trim();
  if (day && drink) handleAddWater(day, drink);
  e.target.reset();
};

document.getElementById("add-weight-form").onsubmit = function (e) {
  e.preventDefault();
  const day = document.getElementById("add-weight-day-input").value.trim();
  const weight = document.getElementById("add-weight-input").value.trim();
  if (day && weight) handleAddWeight(day, weight);
  e.target.reset();
};

document.getElementById("clear-form").onsubmit = function (e) {
  e.preventDefault();
  const day = document.getElementById("clear-day-input").value.trim();
  if (day) handleClearWater(day);
  e.target.reset();
};

document.getElementById("clear-weight-form").onsubmit = function (e) {
  e.preventDefault();
  const day = document.getElementById("clear-weight-day-input").value.trim();
  if (day) handleClearWeight(day);
  e.target.reset();
};

// --- Call Day Suggestions + Initial Load ---
updateDaySuggestions();
loadAndRender();

// --- Keep All Chart.js Functions Unchanged ---
// (renderPreviewGraph, renderWeightGraph, button controls, layout, etc. stay exactly as you wrote them)
// Just make sure they use the 'entries' array, which is now fetched from Firebase.

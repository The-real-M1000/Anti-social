import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDFs98G3-1gcWVgjfoXi_47EGd8ZYsMZrI",
  authDomain: "anti-social-18930.firebaseapp.com",
  projectId: "anti-social-18930",
  storageBucket: "anti-social-18930.appspot.com",
  messagingSenderId: "85648736312",
  appId: "1:85648736312:web:c8ec3cda6d2f08d397e6cd",
  measurementId: "G-BRWL7419ZQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentViewBeforePublic = "explore";

// Referencias UI
const navButtons = {
  myProfile: document.getElementById("nav-my-profile"),
  explore: document.getElementById("nav-explore")
};

const views = {
  myProfile: document.getElementById("my-profile-view"),
  explore: document.getElementById("explore-view"),
  publicProfile: document.getElementById("public-profile-view")
};

document.getElementById("login-button").addEventListener("click", () => signInWithPopup(auth, provider));
document.getElementById("logout-button").addEventListener("click", () => signOut(auth));
document.getElementById("close-public-profile").addEventListener("click", () => {
  switchView(currentViewBeforePublic || "explore");
});

// Estado de sesión
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  document.getElementById("login-button").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-button").style.display = user ? "inline-block" : "none";

  if (user) {
    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
      document.getElementById("app-container").innerHTML = `<p class="placeholder-text">Completa tu perfil para continuar.</p>`;
      return;
    }
    switchView("myProfile");
  } else {
    switchView("explore");
  }
});

// Navegación
function switchView(view) {
  Object.values(views).forEach(v => v && (v.style.display = "none"));
  Object.values(navButtons).forEach(b => b.classList.remove("active"));

  if (view !== "publicProfile") {
    if (views[view]) views[view].style.display = "block";
    if (navButtons[view]) navButtons[view].classList.add("active");
    currentViewBeforePublic = view;
  } else {
    views.publicProfile.style.display = "block";
  }

  if (view === "myProfile") loadMyProfile();
  if (view === "explore") loadUserList();
}

navButtons.myProfile.addEventListener("click", () => switchView("myProfile"));
navButtons.explore.addEventListener("click", () => switchView("explore"));

// Cargar mi perfil
async function loadMyProfile() {
  const container = document.getElementById("profile-display-content");
  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (!profileSnap.exists()) {
    container.innerHTML = `<p class="placeholder-text">Aún no has creado tu perfil.</p>`;
    return;
  }

  const data = profileSnap.data();
  let nameHTML = data.name;
  if (data.photoLink) nameHTML = `<a href="${data.photoLink}" target="_blank">${data.name}</a>`;

  let interestsHTML = "";
  if (data.interests) {
    interestsHTML = "<h3>Mis gustos</h3><ul>";
    for (const [cat, info] of Object.entries(data.interests)) {
      interestsHTML += `
        <li>
          <strong>${cat}:</strong> ${info.name}
          ${info.reason ? `<br><em>Por qué: ${info.reason}</em>` : ""}
          ${info.image ? `<br><img src="${info.image}" style="max-width:150px; border-radius:8px;">` : ""}
        </li>`;
    }
    interestsHTML += "</ul>";
  }

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || "default-profile.png"}" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    ${interestsHTML}
    <button id="add-interest-btn">➕ Añadir otro gusto</button>
  `;

  document.getElementById("add-interest-btn").addEventListener("click", showInterestForm);
}

// Formulario para añadir gusto
async function showInterestForm() {
  const container = document.getElementById("profile-display-content");
  if (document.getElementById("new-interest-form")) return;

  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  const existingData = profileSnap.exists() ? profileSnap.data() : {};
  const existingCategories = existingData.interests ? Object.keys(existingData.interests) : [];

  const defaultCategories = ["Películas", "Series", "Juegos", "Música", "Libros", "Hobbies"];
  const allCategories = [...new Set([...defaultCategories, ...existingCategories])];

  container.innerHTML += `
    <form id="new-interest-form" style="margin-top: 1em;">
      <h4>Nuevo gusto</h4>
      <label>Categoría:</label>
      <select id="new-category-select">
        ${allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
        <option value="otra">Otra...</option>
      </select>
      <div id="custom-category-field" style="display:none; margin-top:0.5em;">
        <input type="text" id="custom-category" placeholder="Escribe tu categoría" />
      </div>
      <label>Nombre:</label>
      <input type="text" id="new-name"><br>
      <label>¿Por qué te gusta?</label>
      <textarea id="new-reason"></textarea><br>
      <label>Imagen (URL):</label>
      <input type="url" id="new-img"><br>
      <button type="submit">Guardar</button>
    </form>
  `;

  const select = document.getElementById("new-category-select");
  const customField = document.getElementById("custom-category-field");
  select.addEventListener("change", () => {
    customField.style.display = select.value === "otra" ? "block" : "none";
  });

  document.getElementById("new-interest-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedCategory = select.value === "otra"
      ? document.getElementById("custom-category").value.trim()
      : select.value;

    const name = document.getElementById("new-name").value.trim();
    const reason = document.getElementById("new-reason").value.trim();
    const image = document.getElementById("new-img").value.trim();

    if (!selectedCategory || !name) {
      alert("La categoría y el nombre son obligatorios");
      return;
    }

    const updatedInterests = {
      ...existingData.interests,
      [selectedCategory]: { name, reason, image }
    };

    await setDoc(doc(db, "profiles", currentUser.uid), {
      interests: updatedInterests
    }, { merge: true });

    alert("🎉 Gusto añadido correctamente");
    loadMyProfile();
  });
}

// Explorar perfiles
async function loadUserList() {
  const container = document.getElementById("user-list-container");
  container.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "profiles"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = docSnap.id;

    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <img src="${data.image || "default-profile.png"}" />
      <span>${data.name}</span>
    `;
    card.onclick = () => showPublicProfile(uid);
    container.appendChild(card);
  });
}

// Mostrar perfil público
async function showPublicProfile(userId) {
  const container = document.getElementById("public-profile-content");
  const profileSnap = await getDoc(doc(db, "profiles", userId));
  if (!profileSnap.exists()) {
    container.innerHTML = "<p>Perfil no encontrado.</p>";
    return;
  }

  const data = profileSnap.data();
  let nameHTML = data.name;
  if (data.photoLink) nameHTML = `<a href="${data.photoLink}" target="_blank">${data.name}</a>`;

  let interestsHTML = "";
  if (data.interests) {
    interestsHTML = "<h3>Gustos</h3><ul>";
    for (const [cat, info] of Object.entries(data.interests)) {
      interestsHTML += `
        <li>
          <strong>${cat}:</strong> ${info.name}
          ${info.reason ? `<br><em>Por qué: ${info.reason}</em>` : ""}
          ${info.image ? `<br><img src="${info.image}" style="max-width:150px; border-radius:8px;">` : ""}
        </li>`;
    }
    interestsHTML += "</ul>";
  }

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || "default-profile.png"}" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    ${interestsHTML}
  `;

  switchView("publicProfile");
}

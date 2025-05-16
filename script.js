import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDFs98G3-1gcWVgjfoXi_47EGd8ZYsMZrI",
  authDomain: "anti-social-18930.firebaseapp.com",
  projectId: "anti-social-18930",
  storageBucket: "anti-social-18930.appspot.com",
  messagingSenderId: "85648736312",
  appId: "1:85648736312:web:c8ec3cda6d2f08d397e6cd",
  measurementId: "G-BRWL7419ZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

const navButtons = {
  myProfile: document.getElementById("nav-my-profile"),
  editProfile: document.getElementById("nav-edit-profile"),
  explore: document.getElementById("nav-explore")
};
const views = {
  myProfile: document.getElementById("my-profile-view"),
  editProfile: document.getElementById("edit-profile-view"),
  explore: document.getElementById("explore-view")
};

document.getElementById("login-button").addEventListener("click", () => {
  signInWithPopup(auth, provider);
});
document.getElementById("logout-button").addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    document.getElementById("login-button").style.display = "none";
    document.getElementById("logout-button").style.display = "inline-block";
    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) return; // onboarding.js mostrará el cuestionario
    switchView("myProfile");
  } else {
    document.getElementById("login-button").style.display = "inline-block";
    document.getElementById("logout-button").style.display = "none";
    document.getElementById("app-container").innerHTML = `<p class="placeholder-text">Inicia sesión para ver tu perfil.</p>`;
  }
});

function switchView(view) {
  Object.values(views).forEach(v => (v.style.display = "none"));
  Object.values(navButtons).forEach(b => b.classList.remove("active"));
  views[view].style.display = "block";
  navButtons[view].classList.add("active");
  if (view === "myProfile") loadMyProfile();
  if (view === "explore") loadUserList();
  if (view === "editProfile") renderEditForm();
}

navButtons.myProfile.addEventListener("click", () => switchView("myProfile"));
navButtons.editProfile.addEventListener("click", () => switchView("editProfile"));
navButtons.explore.addEventListener("click", () => switchView("explore"));

// Carga perfil
async function loadMyProfile() {
  const container = document.getElementById("profile-display-content");
  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (profileSnap.exists()) {
    const data = profileSnap.data();
    container.innerHTML = `
      <div class="profile-header">
        <img src="${data.image}" alt="Foto de perfil" />
        <h2>${data.name}</h2>
      </div>
      <p>${data.description}</p>
    `;
  } else {
    container.innerHTML = `<p class="placeholder-text">Aún no has creado tu perfil.</p>`;
  }
}

// Explorar usuarios
async function loadUserList() {
  const container = document.getElementById("user-list-container");
  container.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "profiles"));
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== currentUser.uid) {
      const data = docSnap.data();
      container.innerHTML += `
        <div class="user-card">
          <img src="${data.image}" alt="${data.name}" />
          <span>${data.name}</span>
        </div>
      `;
    }
  });
}

// Renderizar formulario editar perfil
async function renderEditForm() {
  const container = document.getElementById("profile-edit-form");
  const profileRef = doc(db, "profiles", currentUser.uid);
  const profileSnap = await getDoc(profileRef);
  const data = profileSnap.exists() ? profileSnap.data() : {};
  container.innerHTML = `
    <fieldset>
      <legend>Tu perfil público</legend>

      <label for="edit-name">Nombre:</label>
      <input type="text" id="edit-name" value="${data.name || ""}" required />

      <label for="edit-description">Descripción:</label>
      <textarea id="edit-description" rows="3" required>${data.description || ""}</textarea>

      <label for="edit-image">URL de imagen de perfil:</label>
      <input type="url" id="edit-image" value="${data.image || ""}" />
    </fieldset>
  `;
}

// Guardar perfil
document.getElementById("save-profile-button").addEventListener("click", async () => {
  const name = document.getElementById("edit-name").value.trim();
  const description = document.getElementById("edit-description").value.trim();
  const image = document.getElementById("edit-image").value.trim();

  if (!name || !description) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  await setDoc(
    doc(db, "profiles", currentUser.uid),
    { name, description, image },
    { merge: true }
  );

  alert("✅ Perfil actualizado");
  switchView("myProfile");
  loadMyProfile();
});

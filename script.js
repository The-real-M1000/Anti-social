import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFs98G3-1gcWVgjfoXi_47EGd8ZYsMZrI",
  authDomain: "anti-social-18930.firebaseapp.com",
  projectId: "anti-social-18930",
  storageBucket: "anti-social-18930.appspot.com",
  messagingSenderId: "85648736312",
  appId: "1:85648736312:web:c8ec3cda6d2f08d397e6cd",
  measurementId: "G-BRWL7419ZQ"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// Referencias a botones y vistas
const navButtons = {
  myProfile: document.getElementById("nav-my-profile"),
  explore: document.getElementById("nav-explore")
};
const views = {
  myProfile: document.getElementById("my-profile-view"),
  explore: document.getElementById("explore-view")
};

document.getElementById("login-button").addEventListener("click", () => {
  signInWithPopup(auth, provider);
});
document.getElementById("logout-button").addEventListener("click", () => {
  signOut(auth);
});

// Observador de auth
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    document.getElementById("login-button").style.display = "none";
    document.getElementById("logout-button").style.display = "inline-block";

    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
      // onboarding.js mostrará el cuestionario, aquí no hacemos nada más
      document.getElementById("app-container").innerHTML = `<p class="placeholder-text">Completa tu perfil para continuar.</p>`;
      return;
    }

    switchView("myProfile");
  } else {
    document.getElementById("login-button").style.display = "inline-block";
    document.getElementById("logout-button").style.display = "none";
    document.getElementById("app-container").innerHTML = `<p class="placeholder-text">Inicia sesión para ver tu perfil.</p>`;
  }
});

// Cambiar vistas
function switchView(view) {
  Object.values(views).forEach(v => v.style.display = "none");
  Object.values(navButtons).forEach(b => b.classList.remove("active"));
  views[view].style.display = "block";
  navButtons[view].classList.add("active");
  if (view === "myProfile") loadMyProfile();
  if (view === "explore") loadUserList();
}

navButtons.myProfile.addEventListener("click", () => switchView("myProfile"));
navButtons.explore.addEventListener("click", () => switchView("explore"));

// Cargar perfil actual
async function loadMyProfile() {
  const container = document.getElementById("profile-display-content");
  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (profileSnap.exists()) {
    const data = profileSnap.data();

    // Nombre con link opcional
    let nameHTML = data.name;
    if (data.photoLink) {
      nameHTML = `<a href="${data.photoLink}" target="_blank" rel="noopener noreferrer">${data.name}</a>`;
    }

    container.innerHTML = `
      <div class="profile-header">
        <img src="${data.image || 'default-profile.png'}" alt="Foto de perfil" />
        <h2>${nameHTML}</h2>
      </div>
      <p>${data.description || ''}</p>
    `;
  } else {
    container.innerHTML = `<p class="placeholder-text">Aún no has creado tu perfil.</p>`;
  }
}

// Cargar lista de otros usuarios
async function loadUserList() {
  const container = document.getElementById("user-list-container");
  container.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "profiles"));
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== currentUser.uid) {
      const data = docSnap.data();
      container.innerHTML += `
        <div class="user-card">
          <img src="${data.image || 'default-profile.png'}" alt="${data.name}" />
          <span>${data.name}</span>
        </div>
      `;
    }
  });
}

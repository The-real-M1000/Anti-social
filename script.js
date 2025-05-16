import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
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

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

const navButtons = {
  myProfile: document.getElementById("nav-my-profile"),
  explore: document.getElementById("nav-explore")
};

const views = {
  myProfile: document.getElementById("my-profile-view"),
  explore: document.getElementById("explore-view"),
  publicProfile: document.getElementById("public-profile-view")
};

document.getElementById("login-button").addEventListener("click", () => {
  signInWithPopup(auth, provider);
});
document.getElementById("logout-button").addEventListener("click", () => {
  signOut(auth);
});

document.getElementById("close-public-profile").addEventListener("click", () => {
  switchView(currentViewBeforePublic || "explore");
});

let currentViewBeforePublic = "explore";

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    document.getElementById("login-button").style.display = "none";
    document.getElementById("logout-button").style.display = "inline-block";

    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
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

function switchView(view) {
  Object.values(views).forEach(v => (v.style.display = "none"));
  Object.values(navButtons).forEach(b => b.classList.remove("active"));
  if (view !== "publicProfile") {
    views[view].style.display = "block";
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

async function loadMyProfile() {
  const container = document.getElementById("profile-display-content");
  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (profileSnap.exists()) {
    const data = profileSnap.data();

    let nameHTML = data.name;
    if (data.photoLink) {
      nameHTML = `<a href="${data.photoLink}" target="_blank" rel="noopener noreferrer">${data.name}</a>`;
    }

    let interestsHTML = "";
    if (data.interests) {
      interestsHTML = "<h3>Mis gustos</h3><ul>";
      for (const [category, info] of Object.entries(data.interests)) {
        interestsHTML += `
          <li>
            <strong>${category}:</strong> ${info.name}
            ${info.reason ? `<br><em>Por qué: ${info.reason}</em>` : ""}
            ${info.image ? `<br><img src="${info.image}" alt="${info.name}" style="max-width:150px; border-radius:8px; margin-top:0.3em;">` : ""}
          </li>`;
      }
      interestsHTML += "</ul>";
    }

    container.innerHTML = `
      <div class="profile-header">
        <img src="${data.image || "default-profile.png"}" alt="Foto de perfil" />
        <h2>${nameHTML}</h2>
      </div>
      <p>${data.description || ""}</p>
      ${interestsHTML}
    `;
  } else {
    container.innerHTML = `<p class="placeholder-text">Aún no has creado tu perfil.</p>`;
  }
}

async function loadUserList() {
  const container = document.getElementById("user-list-container");
  container.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "profiles"));
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== currentUser.uid) {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <img src="${data.image || "default-profile.png"}" alt="${data.name}" />
        <span>${data.name}</span>
      `;
      card.style.cursor = "pointer";
      card.onclick = () => showPublicProfile(docSnap.id);
      container.appendChild(card);
    }
  });
}

async function showPublicProfile(userId) {
  const container = document.getElementById("public-profile-content");
  const profileSnap = await getDoc(doc(db, "profiles", userId));
  if (!profileSnap.exists()) {
    container.innerHTML = "<p>Perfil no encontrado.</p>";
    return;
  }
  const data = profileSnap.data();

  let nameHTML = data.name;
  if (data.photoLink) {
    nameHTML = `<a href="${data.photoLink}" target="_blank" rel="noopener noreferrer">${data.name}</a>`;
  }

  let interestsHTML = "";
  if (data.interests) {
    interestsHTML = "<h3>Gustos</h3><ul>";
    for (const [category, info] of Object.entries(data.interests)) {
      interestsHTML += `
        <li>
          <strong>${category}:</strong> ${info.name}
          ${info.reason ? `<br><em>Por qué: ${info.reason}</em>` : ""}
          ${info.image ? `<br><img src="${info.image}" alt="${info.name}" style="max-width:150px; border-radius:8px; margin-top:0.3em;">` : ""}
        </li>`;
    }
    interestsHTML += "</ul>";
  }

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || "default-profile.png"}" alt="Foto de perfil" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    ${interestsHTML}
  `;

  switchView("publicProfile");
}

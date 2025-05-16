import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

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

  const categories = data.interests ? Object.keys(data.interests) : [];
  const allBtn = `<button class="filter-btn active" data-cat="all">Todo</button>`;
  const catBtns = categories.map(cat => `<button class="filter-btn" data-cat="${cat}">${cat}</button>`).join("");

  async function renderInterestItem(cat, item) {
    const name = item.name;
    let html = "";
    let image = item.image || "";
    let description = item.reason || "";

    const TMDB_KEY = "c68b3c5edd56efe86a36e35c4dc891fc";
    const RAWG_KEY = "3ce551945ab3430eacfdf48b55fa0dbc";

    try {
      if (cat === "Películas" || cat === "Series") {
        const type = cat === "Películas" ? "movie" : "tv";
        const res = await fetch(`https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(name)}&language=es&api_key=${TMDB_KEY}`);
        const dataApi = await res.json();
        if (dataApi.results?.length) {
          const result = dataApi.results[0];
          image = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : image;
          description = result.overview || description;
        }
      } else if (cat === "Juegos") {
        const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(name)}`);
        const dataApi = await res.json();
        if (dataApi.results?.length) {
          const game = dataApi.results[0];
          image = game.background_image || image;
          description = game.slug || description;
        }
      } else if (cat === "Libros") {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(name)}`);
        const dataApi = await res.json();
        if (dataApi.items?.length) {
          const book = dataApi.items[0].volumeInfo;
          image = book.imageLinks?.thumbnail || image;
          description = book.description || book.subtitle || description;
        }
      }
    } catch (err) {
      console.warn(`Error cargando API para ${cat}:`, err);
    }

    html += `
      <li class="item-entry${image ? '' : ' no-image'}">
        ${image ? `<div class="item-image-container"><img class="item-content-image" src="${image}" alt="${name}"></div>` : ""}
        <div class="item-details">
          <p><strong>${cat}:</strong> ${name}</p>
          ${description ? `<p>${description}</p>` : ""}
        </div>
      </li>
    `;
    return html;
  }

  async function renderInterests(filterCat) {
    if (!data.interests) return "<p>No tienes gustos registrados.</p>";
    let html = "<ul>";

    if (filterCat === "all") {
      for (const cat of categories) {
        let items = data.interests[cat];
        if (!Array.isArray(items)) items = [items];
        for (const item of items) {
          html += await renderInterestItem(cat, item);
        }
      }
    } else {
      let items = data.interests[filterCat];
      if (!Array.isArray(items)) items = [items];
      for (const item of items) {
        html += await renderInterestItem(filterCat, item);
      }
    }

    html += "</ul>";
    return html;
  }

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || 'https://placehold.co/150x150?text=👤'}" alt="Foto de perfil" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    <div id="filters-container">${allBtn}${catBtns}</div>
    <div id="interests-list">Cargando gustos...</div>
    <button id="add-interest-btn">➕ Añadir otro gusto</button>
  `;

  const filtersContainer = document.getElementById("filters-container");
  const interestsList = document.getElementById("interests-list");

  // Carga inicial todo
  interestsList.innerHTML = await renderInterests("all");

  filtersContainer.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      filtersContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      interestsList.innerHTML = await renderInterests(cat);
    });
  });

  document.getElementById("add-interest-btn").addEventListener("click", showInterestForm);
}

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

    let interests = existingData.interests || {};
    let catArray = interests[selectedCategory];
    if (!catArray) {
      catArray = [];
    } else if (!Array.isArray(catArray)) {
      catArray = [catArray];
    }

    catArray.push({ name, reason, image });
    interests[selectedCategory] = catArray;

   

ChatGPT dijo:

await setDoc(doc(db, "profiles", currentUser.uid), {
interests
}, { merge: true });

alert("🎉 Gusto añadido correctamente");
loadMyProfile();

});
}

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
  <img src="${data.image || 'https://placehold.co/150x150?text=👤'}" />
  <span>${data.name}</span>
`;
card.onclick = () => showPublicProfile(uid);
container.appendChild(card);

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
if (data.photoLink) nameHTML = <a href="${data.photoLink}" target="_blank">${data.name}</a>;

let interestsHTML = "<ul>";
if (data.interests) {
for (const [cat, items] of Object.entries(data.interests)) {
let arr = items;
if (arr && !Array.isArray(arr)) arr = [arr];
interestsHTML += <li><strong>${cat}:</strong><ul>;
for (const item of arr) {
interestsHTML += <li>${item.name}</li>;
}
interestsHTML += "</ul></li>";
}
}
interestsHTML += "</ul>";

container.innerHTML = <div class="profile-header"> <img src="${data.image || 'https://placehold.co/150x150?text=👤'}" /> <h2>${nameHTML}</h2> </div> <p>${data.description || ""}</p> ${interestsHTML} ;

switchView("publicProfile");
}


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
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

  const filtersContainer = `
    <div id="filters-container">${allBtn}${catBtns}</div>
    <div id="interests-list">Cargando gustos...</div>
    <button id="add-interest-btn">➕ Añadir otro gusto</button>
  `;

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || 'https://placehold.co/150x150?text=👤'}" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    ${filtersContainer}
  `;

  await renderInterests("all", data);

  document.getElementById("filters-container").querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      document.getElementById("interests-list").innerHTML = "Cargando...";
      await renderInterests(cat, data);
    });
  });

  document.getElementById("add-interest-btn").addEventListener("click", showInterestForm);
}

async function renderInterests(filterCat, data) {
  const list = document.getElementById("interests-list");
  if (!data.interests) {
    list.innerHTML = "<p>No tienes gustos registrados.</p>";
    return;
  }

  let html = "<ul>";

  const renderItems = async (cat, items) => {
    if (!Array.isArray(items)) items = [items];
    let group = `<li><strong>${cat}:</strong><ul>`;

    for (const item of items) {
      if (cat === "Películas" || cat === "Series") {
        const tmdbInfo = await fetchFromTMDB(item.name, cat === "Series" ? "tv" : "movie");
        if (tmdbInfo) {
          group += `
            <li>
              <strong>${tmdbInfo.title || tmdbInfo.name}</strong><br>
              ${item.reason ? `<em>${item.reason}</em><br>` : ""}
              ${tmdbInfo.overview ? `<p>${tmdbInfo.overview}</p>` : ""}
              ${tmdbInfo.poster_path ? `<img src="https://image.tmdb.org/t/p/w300${tmdbInfo.poster_path}" style="max-width:150px; border-radius:8px;" />` : ""}
            </li>
          `;
          continue;
        }
      }

      group += `
        <li>
          ${item.name}
          ${item.reason ? `<br><em>${item.reason}</em>` : ""}
          ${item.image ? `<br><img src="${item.image}" style="max-width:150px; border-radius:8px;">` : ""}
        </li>
      `;
    }

    group += "</ul></li>";
    return group;
  };

  const promises = [];

  if (filterCat === "all") {
    for (const cat of Object.keys(data.interests)) {
      promises.push(renderItems(cat, data.interests[cat]));
    }
  } else {
    promises.push(renderItems(filterCat, data.interests[filterCat]));
  }

  const result = await Promise.all(promises);
  html += result.join("") + "</ul>";
  list.innerHTML = html;
}

async function fetchFromTMDB(query, type = "movie") {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&include_adult=false&language=es`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNjhiM2M1ZWRkNTZlZmU4NmEzNmUzNWM0ZGM4OTFmYyIsIm5iZiI6MS43Mjg2OTExNTk5MTkwMDAxZSs5LCJzdWIiOiI2NzA5YmJkNzk1Njc4ZTM1M2Y3MjcxOGIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.TkJ4KsHatRgx_uvAGHvxkMnxCjlF9c-YOJMvUA_Vf6E`
      }
    });
    const json = await res.json();
    return json.results && json.results.length > 0 ? json.results[0] : null;
  } catch (err) {
    console.error("Error al consultar TMDB:", err);
    return null;
  }
}


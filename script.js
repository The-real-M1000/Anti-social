import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
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

// Login / logout
document.getElementById("login-button").addEventListener("click", () => signInWithPopup(auth, provider));
document.getElementById("logout-button").addEventListener("click", () => signOut(auth));
document.getElementById("close-public-profile").addEventListener("click", () =>
  switchView(currentViewBeforePublic || "explore")
);

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  document.getElementById("login-button").style.display = user ? "none" : "inline-block";
  document.getElementById("logout-button").style.display = user ? "inline-block" : "none";

  if (user) {
    const snap = await getDoc(doc(db, "profiles", user.uid));
    if (!snap.exists() || !snap.data().onboardingComplete) {
      document.getElementById("app-container").innerHTML =
        `<p class="placeholder-text">Completa tu perfil para continuar.</p>`;
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
    views[view]?.style.display = "block";
    navButtons[view]?.classList.add("active");
    currentViewBeforePublic = view;
  } else {
    views.publicProfile.style.display = "block";
  }
  if (view === "myProfile") loadMyProfile();
  if (view === "explore") loadUserList();
}

navButtons.myProfile.addEventListener("click", () => switchView("myProfile"));
navButtons.explore.addEventListener("click", () => switchView("explore"));

// Cargar perfil propio
async function loadMyProfile() {
  const container = document.getElementById("profile-display-content");
  const snap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (!snap.exists()) {
    container.innerHTML = `<p class="placeholder-text">Aún no has creado tu perfil.</p>`;
    return;
  }
  const data = snap.data();
  const nameHTML = data.photoLink
    ? `<a href="${data.photoLink}" target="_blank">${data.name}</a>`
    : data.name;

  const categories = data.interests ? Object.keys(data.interests) : [];
  const btns = [`<button class="filter-btn active" data-cat="all">Todo</button>`]
    .concat(categories.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`))
    .join("");

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || 'https://placehold.co/150x150?text=👤'}" alt="Perfil" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description||''}</p>
    <div id="filters-container">${btns}</div>
    <div id="interests-list">Cargando gustos…</div>
    <button id="add-interest-btn">➕ Añadir otro gusto</button>
  `;

  // Configurar filtros
  document.querySelectorAll("#filters-container .filter-btn")
    .forEach(btn => btn.addEventListener("click", async () => {
      document.querySelectorAll("#filters-container .filter-btn")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      document.getElementById("interests-list").innerHTML = "Cargando…";
      document.getElementById("interests-list").innerHTML = await renderInterests(cat, data);
    }));

  // Primer render de “Todo”
  document.getElementById("interests-list").innerHTML = await renderInterests("all", data);

  // Añadir gusto
  document.getElementById("add-interest-btn").addEventListener("click", showInterestForm);
}

// Renderizar gustos con integración TMDB, RAWG y Google Books
async function renderInterests(filterCat, data) {
  if (!data.interests) return "<p>No tienes gustos registrados.</p>";
  let html = "<ul>";
  const cats = filterCat === "all" ? Object.keys(data.interests) : [filterCat];

  for (const cat of cats) {
    let items = data.interests[cat];
    if (items && !Array.isArray(items)) items = [items];
    html += `<li><strong>${cat}:</strong><ul>`;
    for (const item of items||[]) {
      if (cat === "Películas" || cat === "Series") {
        const info = await fetchFromTMDB(item.name, cat === "Series");
        if (info) {
          html += `
            <li>
              <strong>${info.title}</strong><br>
              ${item.reason?`<em>${item.reason}</em><br>`:""}
              ${info.overview?`<p>${info.overview}</p>`:""}
              ${info.poster_path?`<img src="https://image.tmdb.org/t/p/w300${info.poster_path}" style="max-width:100px;border-radius:6px;">`:""}
            </li>`;
          continue;
        }
      }
      if (cat === "Juegos") {
        const info = await fetchFromRAWG(item.name);
        if (info) {
          html += `
            <li>
              <strong>${info.name}</strong><br>
              ${item.reason?`<em>${item.reason}</em><br>`:""}
              ${info.released?`<small>Lanzado: ${info.released}</small><br>`:""}
              ${info.background_image?`<img src="${info.background_image}" style="max-width:100px;border-radius:6px;">`:""}
            </li>`;
          continue;
        }
      }
      if (cat === "Libros") {
        const info = await fetchFromBooks(item.name);
        if (info) {
          html += `
            <li>
              <strong>${info.title}</strong><br>
              ${item.reason?`<em>${item.reason}</em><br>`:""}
              ${info.description?`<p>${info.description}</p>`:""}
              ${info.thumbnail?`<img src="${info.thumbnail}" style="max-width:100px;border-radius:6px;">`:""}
            </li>`;
          continue;
        }
      }
      // Fallback
      html += `
        <li>
          ${item.name}
          ${item.reason?`<br><em>${item.reason}</em>`:""}
          ${item.image?`<br><img src="${item.image}" style="max-width:100px;border-radius:6px;">`:""}
        </li>`;
    }
    html += "</ul></li>";
  }
  return html + "</ul>";
}

// Formulario añadir gusto (igual que antes)
async function showInterestForm() {
  const container = document.getElementById("profile-display-content");
  if (document.getElementById("new-interest-form")) return;
  const snap = await getDoc(doc(db, "profiles", currentUser.uid));
  const data = snap.exists()? snap.data() : {};
  const cats = data.interests? Object.keys(data.interests): [];
  const defaults = ["Películas","Series","Juegos","Música","Libros","Hobbies"];
  const allCats = [...new Set([...defaults,...cats])];

  container.innerHTML += `
    <form id="new-interest-form" style="margin-top:1em;">
      <h4>Nuevo gusto</h4>
      <select id="new-cat">${allCats.map(c=>`<option>${c}</option>`).join("")}<option>otra</option></select>
      <div id="new-cat-oth" style="display:none"><input id="new-cat-text" placeholder="Categoría"/></div>
      <input id="new-name" placeholder="Nombre" required/><br>
      <textarea id="new-reason" placeholder="Por qué"></textarea><br>
      <input id="new-img" placeholder="URL imagen"/><br>
      <button>Guardar</button>
    </form>
  `;
  const sel = document.getElementById("new-cat");
  sel.addEventListener("change",()=> document.getElementById("new-cat-oth").style.display = sel.value==="otra"?"block":"none");

  document.getElementById("new-interest-form").addEventListener("submit", async e=>{
    e.preventDefault();
    const cat = sel.value==="otra"? document.getElementById("new-cat-text").value.trim() : sel.value;
    const item = {
      name: document.getElementById("new-name").value.trim(),
      reason: document.getElementById("new-reason").value.trim(),
      image: document.getElementById("new-img").value.trim()
    };
    if(!cat||!item.name) return alert("Categoría y nombre obligatorios");

    let interests = data.interests||{};
    let arr = interests[cat];
    if(arr && !Array.isArray(arr)) arr=[arr];
    if(!arr) arr=[];
    arr.push(item);
    interests[cat]=arr;

    await setDoc(doc(db,"profiles",currentUser.uid), {interests}, {merge:true});
    alert("¡Gusto añadido!");
    loadMyProfile();
  });
}

// Cargar lista de usuarios
async function loadUserList() {
  const cont = document.getElementById("user-list-container");
  cont.innerHTML = "";
  const snap = await getDocs(collection(db,"profiles"));
  snap.forEach(d=>{
    const u = d.id, data = d.data();
    const card = document.createElement("div");
    card.className="user-card";
    card.innerHTML = `
      <img src="${data.image||'https://placehold.co/100x100?text=👤'}"/>
      <span>${data.name}</span>
    `;
    card.onclick = ()=> showPublicProfile(u);
    cont.appendChild(card);
  });
}

// Mostrar perfil público
async function showPublicProfile(uid) {
  const cont = document.getElementById("public-profile-content");
  const snap = await getDoc(doc(db,"profiles",uid));
  if(!snap.exists()) return cont.innerHTML="<p>Perfil no encontrado</p>";
  const data = snap.data();
  const nameHTML = data.photoLink? `<a href="${data.photoLink}" target="_blank">${data.name}</a>`:data.name;
  let html = `
    <div class="profile-header">
      <img src="${data.image||'https://placehold.co/150x150?text=👤'}"/>
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description||""}</p>
    <h3>Gustos</h3>${await renderInterests("all",data)}
  `;
  cont.innerHTML = html;
  switchView("publicProfile");
}

// TMDB fetch (Películas/Series)
async function fetchFromTMDB(query, isSeries=false) {
  const base = isSeries? "tv": "movie";
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/${base}?query=${encodeURIComponent(query)}&language=es`, {
      headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNjhiM2M1ZWRkNTZlZmU4NmEzNmUzNWM0ZGM4OTFmYyIsIm5iZiI6MS43Mjg2OTExNTk5MTkwMDAxZSs5LCJzdWIiOiI2NzA5YmJkNzk1Njc4ZTM1M2Y3MjcxOGIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.TkJ4KsHatRgx_uvAGHvxkMnxCjlF9c-YOJMvUA_Vf6E` }
    });
    const json = await res.json();
    if (json.results?.length) {
      const top = json.results[0];
      return {
        title: isSeries? top.name: top.title,
        overview: top.overview,
        poster_path: top.poster_path
      };
    }
  } catch { /* ignore */ }
  return null;
}

// RAWG fetch (Juegos)
async function fetchFromRAWG(query) {
  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=3ce551945ab3430eacfdf48b55fa0dbc&search=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.results?.length) {
      return json.results[0]; // name, released, background_image
    }
  } catch { }
  return null;
}

// Google Books fetch (Libros)
async function fetchFromBooks(query) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.items?.length) {
      const info = json.items[0].volumeInfo;
      return {
        title: info.title,
        description: info.description,
        thumbnail: info.imageLinks?.thumbnail
      };
    }
  } catch { }
  return null;
}


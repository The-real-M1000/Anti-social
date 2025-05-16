import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { searchMedia } from "./api-handler.js";
import { askForDetails, initializeModule } from "./onboarding.js"; // Importar también initializeModule

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

// Inicializar el módulo de onboarding con las instancias de Firebase
initializeModule(db, auth);

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
      // Iniciar el proceso de onboarding aquí
      startOnboarding(user.uid);
      return;
    }
    switchView("myProfile");
  } else {
    switchView("explore");
  }
});

// Nueva función para iniciar el proceso de onboarding
function startOnboarding(uid) {
  // Categorías predeterminadas que queremos preguntar al usuario
  const categories = ["Películas", "Series", "Juegos", "Libros"];
  // Llamar a la función askForDetails de onboarding.js
  askForDetails(uid, categories);
}

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
  
  if (!currentUser) {
    container.innerHTML = `<p class="placeholder-text">Debes iniciar sesión para ver tu perfil.</p>`;
    return;
  }
  
  const profileSnap = await getDoc(doc(db, "profiles", currentUser.uid));
  if (!profileSnap.exists()) {
    container.innerHTML = `
      <div class="no-profile-container">
        <p class="placeholder-text">Aún no has creado tu perfil.</p>
        <button id="create-profile-btn" class="create-profile-button">Crear mi perfil</button>
      </div>
    `;
    
    // Agregar evento al botón para iniciar el proceso de onboarding
    document.getElementById("create-profile-btn").addEventListener("click", () => {
      startOnboarding(currentUser.uid);
    });
    
    return;
  }

  const data = profileSnap.data();
  let nameHTML = data.name || currentUser.displayName || "Usuario"; // Usar el nombre de Google si está disponible
  if (data.photoLink) nameHTML = `<a href="${data.photoLink}" target="_blank">${nameHTML}</a>`;

  const categories = data.interests ? Object.keys(data.interests) : [];
  const allBtn = `<button class="filter-btn active" data-cat="all">Todo</button>`;
  const catBtns = categories.map(cat => `<button class="filter-btn" data-cat="${cat}">${cat}</button>`).join("");

  function renderInterests(filterCat) {
    if (!data.interests) return "<p>No tienes gustos registrados.</p>";
    let html = "<div class='interests-grid'>";
    if (filterCat === "all") {
      for (const cat of categories) {
        let items = data.interests[cat];
        if (items && !Array.isArray(items)) items = [items];
        
        for (const item of items || []) {
          html += `
            <div class="interest-card">
              <div class="interest-image">
                <img src="${item.image || 'placeholder-interest.png'}" alt="${item.name}">
              </div>
              <div class="interest-info">
                <h4>${item.name}</h4>
                <span class="interest-category">${cat}</span>
                ${item.reason ? `<p class="interest-reason">${item.reason}</p>` : ''}
              </div>
            </div>`;
        }
      }
    } else {
      let items = data.interests[filterCat];
      if (items && !Array.isArray(items)) items = [items];
      
      for (const item of items || []) {
        html += `
          <div class="interest-card">
            <div class="interest-image">
              <img src="${item.image || 'placeholder-interest.png'}" alt="${item.name}">
            </div>
            <div class="interest-info">
              <h4>${item.name}</h4>
              <span class="interest-category">${filterCat}</span>
              ${item.reason ? `<p class="interest-reason">${item.reason}</p>` : ''}
            </div>
          </div>`;
      }  
    }
    html += "</div>";
    return html;
  }

  container.innerHTML = `
    <div class="profile-header">
      <img src="${data.image || currentUser.photoURL || "default-profile.png"}" />
      <h2>${nameHTML}</h2>
    </div>
    <p>${data.description || ""}</p>
    <div id="filters-container">${allBtn}${catBtns}</div>
    <div id="interests-list">${renderInterests("all")}</div>
    <button id="add-interest-btn">➕ Añadir otro gusto</button>
  `;

  const filtersContainer = document.getElementById("filters-container");
  const interestsList = document.getElementById("interests-list");
  filtersContainer.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filtersContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      interestsList.innerHTML = renderInterests(cat);
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
      <div id="api-search-result"></div>
      <label>¿Por qué te gusta?</label>
      <textarea id="new-reason"></textarea><br>
      
      <div>
        <label>Imagen (URL):</label>
        <div class="image-search-container">
          <input type="url" id="new-img" placeholder="URL de imagen o se buscará automáticamente">
          <button type="button" id="search-image-btn">Buscar imagen</button>
        </div>
        
        <div id="image-results-container" style="display:none; margin-top: 1em;">
          <h4>Selecciona una imagen:</h4>
          <div id="image-results-grid" class="image-results-grid"></div>
        </div>
        
        <div id="image-preview" class="image-preview" style="display:none;">
          <img id="preview-img" src="" alt="Vista previa">
        </div>
      </div>
      
      <button type="submit">Guardar</button>
    </form>
  `;

  const select = document.getElementById("new-category-select");
  const customField = document.getElementById("custom-category-field");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const nameInput = document.getElementById("new-name");
  const imageInput = document.getElementById("new-img");
  const imageResultsContainer = document.getElementById("image-results-container");
  const imageResultsGrid = document.getElementById("image-results-grid");
  
  select.addEventListener("change", () => {
    customField.style.display = select.value === "otra" ? "block" : "none";
  });

  // Función para mostrar las opciones de imagen
  function displayImageResults(results) {
    imageResultsGrid.innerHTML = '';
    
    results.forEach((item, index) => {
      if (item.imageUrl) {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-result-card';
        imageCard.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.title || 'Imagen ' + (index + 1)}">
          <div class="image-result-info">
            <p>${item.title || 'Sin título'}</p>
            ${item.year ? `<span>${item.year}</span>` : ''}
          </div>
        `;
        
        imageCard.addEventListener('click', () => {
          // Seleccionar esta imagen
          imageInput.value = item.imageUrl;
          previewImg.src = item.imageUrl;
          imagePreview.style.display = "block";
          imageResultsContainer.style.display = "none";
        });
        
        imageResultsGrid.appendChild(imageCard);
      }
    });
    
    if (imageResultsGrid.children.length > 0) {
      imageResultsContainer.style.display = "block";
    } else {
      document.getElementById("api-search-result").innerHTML = '<p class="error-msg">No se encontraron imágenes para este título.</p>';
    }
  }

  // Evento para buscar imagen automáticamente cuando se pierde el foco del campo nombre
  nameInput.addEventListener("blur", async () => {
    const title = nameInput.value.trim();
    const selectedCategory = select.value === "otra"
      ? document.getElementById("custom-category").value.trim()
      : select.value;
    
    if (title && selectedCategory && !imageInput.value) {
      try {
        document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imagen...</p>';
        const result = await searchMedia(selectedCategory, title);
        document.getElementById("api-search-result").innerHTML = '';
        
        if (result && result.found && result.results && result.results.length > 0) {
          displayImageResults(result.results);
        }
      } catch (error) {
        console.error("Error al buscar imagen:", error);
        document.getElementById("api-search-result").innerHTML = '<p class="error-msg">Error al buscar imagen. Intenta más tarde.</p>';
      }
    }
  });

  // Evento para el botón de búsqueda de imagen
  document.getElementById("search-image-btn").addEventListener("click", async () => {
    const title = nameInput.value.trim();
    const selectedCategory = select.value === "otra"
      ? document.getElementById("custom-category").value.trim()
      : select.value;
    
    if (!title) {
      alert("Por favor ingresa un nombre para buscar");
      return;
    }
    
    try {
      document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imagen...</p>';
      const result = await searchMedia(selectedCategory, title);
      document.getElementById("api-search-result").innerHTML = '';
      
      if (result && result.found && result.results && result.results.length > 0) {
        displayImageResults(result.results);
      } else {
        document.getElementById("api-search-result").innerHTML = '<p class="error-msg">No se encontró imagen. Intenta con otro título o añade la URL manualmente.</p>';
      }
    } catch (error) {
      console.error("Error al buscar imagen:", error);
      document.getElementById("api-search-result").innerHTML = '<p class="error-msg">Error al buscar imagen. Intenta más tarde.</p>';
    }
  });

  // Ver imagen en tiempo real cuando cambia la URL manualmente
  imageInput.addEventListener("input", () => {
    const url = imageInput.value.trim();
    if (url) {
      previewImg.src = url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }
  });

  document.getElementById("new-interest-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedCategory = select.value === "otra"
      ? document.getElementById("custom-category").value.trim()
      : select.value;

    const name = nameInput.value.trim();
    const reason = document.getElementById("new-reason").value.trim();
    const image = imageInput.value.trim();

    if (!selectedCategory || !name) {
      alert("La categoría y el nombre son obligatorios");
      return;
    }

    let interests = existingData.interests || {};

    // Verificamos si ya existe la categoría
    let catArray = interests[selectedCategory];
    if (!catArray) {
      catArray = [];
    } else if (!Array.isArray(catArray)) {
      catArray = [catArray];
    }
    
    catArray.push({ name, reason, image });
    interests[selectedCategory] = catArray;

    try {
      await setDoc(doc(db, "profiles", currentUser.uid), {
        interests,
        name: currentUser.displayName || "Usuario",  // Usar el nombre de Google si está disponible
        image: currentUser.photoURL || "",          // Usar la foto de Google si está disponible
        onboardingComplete: true                    // Asegurarse de que el onboarding esté marcado como completo
      }, { merge: true });

      alert("🎉 Gusto añadido correctamente");
      loadMyProfile();
    } catch (error) {
      console.error("Error al guardar el interés:", error);
      alert("Error al guardar. Intenta de nuevo más tarde.");
    }
  });
}

async function loadUserList() {
  const container = document.getElementById("user-list-container");
  container.innerHTML = "<p>Cargando usuarios...</p>";
  
  try {
    const querySnapshot = await getDocs(collection(db, "profiles"));
    
    if (querySnapshot.empty) {
      container.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }
    
    container.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;

      if (data.onboardingComplete) { // Solo mostrar perfiles completos
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
          <img src="${data.image || "default-profile.png"}" />
          <span>${data.name || "Usuario sin nombre"}</span>
        `;
        card.onclick = () => showPublicProfile(uid);
        container.appendChild(card);
      }
    });
    
    if (container.children.length === 0) {
      container.innerHTML = "<p>No hay usuarios con perfiles completos.</p>";
    }
  } catch (error) {
    console.error("Error al cargar la lista de usuarios:", error);
    container.innerHTML = "<p>Error al cargar usuarios. Intenta más tarde.</p>";
  }
}

async function showPublicProfile(userId) {
  const container = document.getElementById("public-profile-content");
  container.innerHTML = "<p>Cargando perfil...</p>";
  
  try {
    const profileSnap = await getDoc(doc(db, "profiles", userId));
    if (!profileSnap.exists()) {
      container.innerHTML = "<p>Perfil no encontrado.</p>";
      return;
    }

    const data = profileSnap.data();
    let nameHTML = data.name || "Usuario sin nombre";
    if (data.photoLink) nameHTML = `<a href="${data.photoLink}" target="_blank">${data.name}</a>`;

    // Obtener categorías para los filtros
    const categories = data.interests ? Object.keys(data.interests) : [];
    const allBtn = `<button class="filter-btn active" data-cat="all">Todo</button>`;
    const catBtns = categories.map(cat => `<button class="filter-btn" data-cat="${cat}">${cat}</button>`).join("");

    // Función para renderizar intereses según el filtro seleccionado
    function renderInterests(filterCat) {
      if (!data.interests) return "<p>Este usuario no tiene gustos registrados.</p>";
      let html = "<div class='interests-grid'>";
      if (filterCat === "all") {
        for (const cat of categories) {
          let items = data.interests[cat];
          if (items && !Array.isArray(items)) items = [items];
          
          for (const item of items || []) {
            html += `
              <div class="interest-card">
                <div class="interest-image">
                  <img src="${item.image || 'placeholder-interest.png'}" alt="${item.name}">
                </div>
                <div class="interest-info">
                  <h4>${item.name}</h4>
                  <span class="interest-category">${cat}</span>
                  ${item.reason ? `<p class="interest-reason">${item.reason}</p>` : ''}
                </div>
              </div>`;
          }
        }
      } else {
        let items = data.interests[filterCat];
        if (items && !Array.isArray(items)) items = [items];
        
        for (const item of items || []) {
          html += `
            <div class="interest-card">
              <div class="interest-image">
                <img src="${item.image || 'placeholder-interest.png'}" alt="${item.name}">
              </div>
              <div class="interest-info">
                <h4>${item.name}</h4>
                <span class="interest-category">${filterCat}</span>
                ${item.reason ? `<p class="interest-reason">${item.reason}</p>` : ''}
              </div>
            </div>`;
        }  
      }
      html += "</div>";
      return html;
    }

    container.innerHTML = `
      <div class="profile-header">
        <img src="${data.image || "default-profile.png"}" />
        <h2>${nameHTML}</h2>
      </div>
      <p>${data.description || ""}</p>
      <div id="public-filters-container">${allBtn}${catBtns}</div>
      <div id="public-interests-list">${renderInterests("all")}</div>
    `;

    // Agregar los event listeners para los filtros
    const filtersContainer = document.getElementById("public-filters-container");
    const interestsList = document.getElementById("public-interests-list");
    filtersContainer.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filtersContainer.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.getAttribute("data-cat");
        interestsList.innerHTML = renderInterests(cat);
      });
    });

    switchView("publicProfile");
  } catch (error) {
    console.error("Error al cargar el perfil público:", error);
    container.innerHTML = "<p>Error al cargar el perfil. Intenta más tarde.</p>";
  }
}
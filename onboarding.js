import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { searchMedia } from "./api-handler.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

const defaultCategories = ["Películas", "Series", "Juegos", "Música", "Libros", "Hobbies"];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
      showBasicInfoForm(user.uid);
    }
  }
});

// Paso 1: nombre y foto
function showBasicInfoForm(uid) {
  const container = document.getElementById("app-container");
  container.innerHTML = `
    <form id="basic-info-form" class="onboarding">
      <h2>👤 Personaliza tu perfil</h2>
      <label>Tu nombre público:</label>
      <input type="text" id="user-name" required />
      <label>Foto de perfil (URL):</label>
      <input type="url" id="user-image" placeholder="https://..." />
      <br><br>
      <button type="submit">Siguiente</button>
    </form>
  `;

  document.getElementById("basic-info-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("user-name").value.trim();
    const image = document.getElementById("user-image").value.trim();

    if (!name) return alert("Escribe tu nombre");

    await setDoc(doc(db, "profiles", uid), { name, image }, { merge: true });
    showCategorySelector(uid);
  });
}

// Paso 2: seleccionar categoría
function showCategorySelector(uid) {
  const container = document.getElementById("app-container");
  container.innerHTML = `
    <form id="onboarding-form" class="onboarding">
      <h2>🎯 ¿Qué te interesa compartir?</h2>
      <p>Selecciona una categoría para comenzar:</p>
      <select id="category-select">
        ${defaultCategories.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
        <option value="otra">Otra...</option>
      </select>
      <div id="custom-category" style="display:none; margin-top:1em;">
        <label>Escribe tu categoría:</label>
        <input type="text" id="custom-category-input" placeholder="Ej. Tecnología, Viajes..." />
      </div>
      <br><br>
      <button type="submit">Siguiente</button>
    </form>
  `;

  const select = document.getElementById("category-select");
  const customDiv = document.getElementById("custom-category");
  select.addEventListener("change", () => {
    customDiv.style.display = select.value === "otra" ? "block" : "none";
  });

  document.getElementById("onboarding-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = select.value === "otra"
      ? document.getElementById("custom-category-input").value.trim()
      : select.value;

    if (!selected) return alert("Por favor escribe una categoría");

    askForDetails(uid, [selected]);
  });
}

// Paso 3: ingresar gusto
function askForDetails(uid, categories, index = 0, interests = {}) {
  const current = categories[index];
  const container = document.getElementById("app-container");
  container.innerHTML = `
    <form id="interest-form" class="onboarding">
      <h2>💡 ${current}</h2>
      <div class="form-field">
        <label>¿Cuál es tu favorito?</label>
        <input type="text" id="fav-name" required />
        <button type="button" id="search-results-btn" class="search-btn">🔍 Buscar</button>
      </div>
      
      <div id="search-results-container" class="search-results"></div>
      
      <div id="details-container" style="display:none;">
        <div class="form-field">
          <label>¿Por qué te gusta?</label>
          <textarea id="fav-reason" rows="3"></textarea>
        </div>
        
        <div class="form-field">
          <label>Imagen:</label>
          <input type="url" id="fav-image" placeholder="URL de imagen">
        </div>
        
        <div id="image-preview" class="image-preview" style="display:none;">
          <img id="preview-img" src="" alt="Vista previa">
        </div>
        
        <button type="submit">Finalizar</button>
      </div>
    </form>
  `;

  const nameInput = document.getElementById("fav-name");
  const imageInput = document.getElementById("fav-image");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const searchBtn = document.getElementById("search-results-btn");
  const resultsContainer = document.getElementById("search-results-container");
  const detailsContainer = document.getElementById("details-container");

  // Configurar la vista previa de la imagen
  imageInput.addEventListener("input", () => {
    const url = imageInput.value.trim();
    if (url) {
      previewImg.src = url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }
  });

  // Buscar resultados al hacer clic en el botón
  searchBtn.addEventListener("click", async () => {
    const title = nameInput.value.trim();
    if (!title) {
      alert("Por favor ingresa un nombre para buscar");
      return;
    }
    
    try {
      resultsContainer.innerHTML = '<p class="searching-msg">Buscando resultados...</p>';
      const searchResult = await searchMedia(current, title);
      
      if (searchResult.found) {
        // Mostrar los resultados para que el usuario elija
        resultsContainer.innerHTML = `
          <div class="results-header">
            <h4>Resultados encontrados:</h4>
            <p>Selecciona una opción para continuar</p>
          </div>
          <div class="results-grid">
            ${searchResult.results.map(item => `
              <div class="result-card" data-image="${item.imageUrl || ''}" data-title="${item.title || ''}">
                <div class="result-image" style="background-image: url('${item.imageUrl || 'placeholder-interest.png'}')"></div>
                <div class="result-info">
                  <h4>${item.title || 'Sin título'}</h4>
                  ${item.year ? `<span class="result-year">${item.year}</span>` : ''}
                  <p class="result-overview">${item.overview ? item.overview.substring(0, 100) + (item.overview.length > 100 ? '...' : '') : 'Sin descripción'}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Agregar evento de clic a cada tarjeta de resultado
        document.querySelectorAll('.result-card').forEach(card => {
          card.addEventListener('click', () => {
            const selectedTitle = card.getAttribute('data-title');
            const selectedImage = card.getAttribute('data-image');
            
            // Actualizar los campos con el resultado seleccionado
            nameInput.value = selectedTitle;
            imageInput.value = selectedImage;
            
            if (selectedImage) {
              previewImg.src = selectedImage;
              imagePreview.style.display = "block";
            }
            
            // Mostrar el formulario de detalles y ocultar los resultados
            detailsContainer.style.display = "block";
            resultsContainer.innerHTML = `
              <div class="selected-result">
                <p>Has seleccionado: <strong>${selectedTitle}</strong></p>
                <button type="button" id="change-selection-btn">Cambiar selección</button>
              </div>
            `;
            
            // Agregar evento para volver a buscar
            document.getElementById("change-selection-btn").addEventListener('click', () => {
              resultsContainer.innerHTML = "";
              searchBtn.click();
            });
          });
        });
        
      } else {
        resultsContainer.innerHTML = `
          <div class="no-results">
            <p>No se encontraron resultados para "${title}".</p>
            <p>Puedes intentar con otro término o agregar los detalles manualmente.</p>
            <button type="button" id="add-manually-btn">Agregar manualmente</button>
          </div>
        `;
        
        document.getElementById("add-manually-btn").addEventListener('click', () => {
          detailsContainer.style.display = "block";
          resultsContainer.innerHTML = "";
        });
      }
    } catch (error) {
      console.error("Error al buscar:", error);
      resultsContainer.innerHTML = '<p class="error-msg">Error al buscar. Intenta más tarde.</p>';
    }
  });

  document.getElementById("interest-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("fav-name").value.trim();
    const reason = document.getElementById("fav-reason").value.trim();
    const image = document.getElementById("fav-image").value.trim();

    interests[current] = { name, reason, image };

    await setDoc(doc(db, "profiles", uid), {
      interests,
      onboardingComplete: true
    }, { merge: true });

    alert("✅ ¡Perfil configurado!");
    location.reload();
  });
}

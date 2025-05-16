import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { searchMedia, searchAnyImage } from "./api-handler.js";

// Instead of initializing Firebase here, we'll use the instances passed from script.js
let db = null;
let auth = null;

// Function to initialize the module with Firebase instances
function initializeModule(firestoreInstance, authInstance) {
  db = firestoreInstance;
  auth = authInstance;
}

// Nueva función para solicitar la biografía antes de comenzar con las categorías
async function askForBio(uid) {
  // Check if Firebase instances were properly initialized
  if (!db || !auth) {
    console.error("Firebase not initialized in onboarding module");
    return;
  }
  
  const container = document.getElementById("app-container");
  
  // Obtener datos del usuario actual de Google Auth
  const user = auth.currentUser;
  
  // Intentar obtener perfil existente
  const profileSnap = await getDoc(doc(db, "profiles", uid));
  const userData = profileSnap.exists() ? profileSnap.data() : {};
  
  // Crear o actualizar el documento básico del perfil
  if (user) {
    await setDoc(doc(db, "profiles", uid), {
      name: user.displayName || "Usuario",
      image: user.photoURL || "",
      email: user.email || "",
      onboardingComplete: false
    }, { merge: true });
  }
  
  container.innerHTML = `
    <form id="bio-form" class="onboarding">
      <h2>✨ Tu Biografía</h2>
      <p>Cuéntanos un poco sobre ti. Esta información aparecerá en tu perfil.</p>
      
      <label for="user-bio">Biografía:</label>
      <textarea id="user-bio" rows="5" placeholder="Escribe algo interesante sobre ti..." maxlength="500"></textarea>
      <p class="char-counter"><span id="char-count">0</span>/500 caracteres</p>
      
      <button type="submit">Siguiente</button>
    </form>
  `;

  const bioTextarea = document.getElementById("user-bio");
  const charCount = document.getElementById("char-count");
  
  // Actualizar contador de caracteres
  bioTextarea.addEventListener("input", () => {
    const count = bioTextarea.value.length;
    charCount.textContent = count;
  });

  document.getElementById("bio-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const bio = bioTextarea.value.trim();

    // Guardamos la biografía
    try {
      await setDoc(doc(db, "profiles", uid), {
        bio: bio
      }, { merge: true });
      
      // Continuamos con las categorías de intereses
      const categories = ["Películas", "Series", "Juegos", "Libros"];
      askForDetails(uid, categories);
      
    } catch (error) {
      console.error("Error al guardar la biografía:", error);
      alert("Error al guardar. Intenta de nuevo más tarde.");
    }
  });
}

async function askForDetails(uid, categories, index = 0, interests = {}) {
  // Check if Firebase instances were properly initialized
  if (!db || !auth) {
    console.error("Firebase not initialized in onboarding module");
    return;
  }
  
  const current = categories[index];
  const container = document.getElementById("app-container");
  
  // Obtener datos del usuario actual de Google Auth
  const user = auth.currentUser;
  
  // Intentar obtener perfil existente
  const profileSnap = await getDoc(doc(db, "profiles", uid));
  const userData = profileSnap.exists() ? profileSnap.data() : {};
  
  // Si es el primer paso (index 0), crear o actualizar el documento básico del perfil
  if (index === 0 && user) {
    await setDoc(doc(db, "profiles", uid), {
      name: user.displayName || "Usuario",
      image: user.photoURL || "",
      email: user.email || "",
      // Los intereses se añadirán en pasos posteriores
      onboardingComplete: false
    }, { merge: true });
  }
  
  container.innerHTML = `
    <form id="interest-form" class="onboarding">
      <h2>💡 ${current}</h2>
      <label>¿Cuál es tu favorito?</label>
      <input type="text" id="fav-name" required />
      <div id="api-search-result"></div>
      <label>¿Por qué te gusta?</label>
      <textarea id="fav-reason" rows="3"></textarea>
      
      <div>
        <div class="image-search-container">
          <input type="text" id="image-search-query" placeholder="Buscar imágenes de Google (opcional)" />
          <button type="button" id="search-image-btn">Buscar</button>
        </div>
        
        <div id="image-results-container" style="display:none; margin-top: 1em;">
          <h4>Selecciona una imagen:</h4>
          <div id="image-results-grid" class="image-results-grid"></div>
        </div>
        
        <div id="image-preview" class="image-preview" style="display:none;">
          <img id="preview-img" src="" alt="Vista previa">
          <button type="button" id="clear-image-btn" class="clear-image-btn">
            <i class="fas fa-times"></i> Quitar imagen
          </button>
        </div>
        <input type="hidden" id="fav-image" />
      </div>
      
      <br><br>
      <button type="submit">Siguiente</button>
    </form>
  `;

  const nameInput = document.getElementById("fav-name");
  const imageSearchInput = document.getElementById("image-search-query");
  const searchBtn = document.getElementById("search-image-btn");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const clearImageBtn = document.getElementById("clear-image-btn");
  const imageInput = document.getElementById("fav-image");
  const imageResultsContainer = document.getElementById("image-results-container");
  const imageResultsGrid = document.getElementById("image-results-grid");
  
  // Cambiar el texto del botón en el último paso
  if (index === categories.length - 1) {
    document.querySelector("#interest-form button[type='submit']").textContent = "Finalizar";
  }

  // Buscar imagen automáticamente cuando se pierde el foco del campo nombre
  nameInput.addEventListener("blur", async () => {
    const title = nameInput.value.trim();
    
    if (title && !imageInput.value) {
      try {
        document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imagen...</p>';
        const result = await searchMedia(current, title);
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

  // Función para mostrar las opciones de imagen
  function displayImageResults(results) {
    imageResultsGrid.innerHTML = '';
    
    results.forEach((item, index) => {
      if (item.imageUrl) {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-result-card';
        imageCard.innerHTML = `
          <img src="${item.thumbnailUrl || item.imageUrl}" alt="${item.title || 'Imagen ' + (index + 1)}">
          <div class="image-result-info">
            <p>${item.title || 'Sin título'}</p>
            ${item.year ? `<span>${item.year}</span>` : ''}
            ${item.source ? `<small>${item.source}</small>` : ''}
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

  // Evento para el botón de búsqueda de imagen
  searchBtn.addEventListener("click", async () => {
    const title = nameInput.value.trim();
    const searchQuery = imageSearchInput.value.trim() || title;
    
    if (!searchQuery) {
      alert("Por favor ingresa un término de búsqueda");
      return;
    }
    
    try {
      document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imágenes...</p>';
      
      let result;
      // Si hay un término de búsqueda específico, usamos la búsqueda genérica
      if (imageSearchInput.value.trim()) {
        result = await searchAnyImage(searchQuery);
      } else {
        // De lo contrario, usamos la búsqueda por categoría
        result = await searchMedia(current, title);
      }
      
      document.getElementById("api-search-result").innerHTML = '';
      
      if (result && result.found && result.results && result.results.length > 0) {
        displayImageResults(result.results);
      } else {
        document.getElementById("api-search-result").innerHTML = '<p class="error-msg">No se encontró imagen. Intenta con otro término de búsqueda.</p>';
      }
    } catch (error) {
      console.error("Error al buscar imagen:", error);
      document.getElementById("api-search-result").innerHTML = '<p class="error-msg">Error al buscar imagen. Intenta más tarde.</p>';
    }
  });

  // Limpiar imagen seleccionada
  clearImageBtn.addEventListener("click", () => {
    imageInput.value = "";
    imagePreview.style.display = "none";
  });

  document.getElementById("interest-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("fav-name").value.trim();
    const reason = document.getElementById("fav-reason").value.trim();
    const image = document.getElementById("fav-image").value.trim();

    if (!name) {
      alert("Por favor ingresa un nombre");
      return;
    }

    interests[current] = { name, reason, image };

    // Guardamos los intereses actualizados después de cada paso
    try {
      await setDoc(doc(db, "profiles", uid), {
        interests,
        // Solo marcamos onboardingComplete como true si es el último paso
        ...(index === categories.length - 1 ? { onboardingComplete: true } : {})
      }, { merge: true });
    } catch (error) {
      console.error("Error al guardar el interés:", error);
      alert("Error al guardar. Intenta de nuevo más tarde.");
      return;
    }

    // Verificar si hay más categorías
    if (index < categories.length - 1) {
      // Ir a la siguiente categoría
      askForDetails(uid, categories, index + 1, interests);
    } else {
      // Completar el proceso
      alert("✅ ¡Perfil configurado!");
      location.reload();
    }
  });
}

export { askForDetails, askForBio, initializeModule };

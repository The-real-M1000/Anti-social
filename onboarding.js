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
      <label>¿Cuál es tu favorito?</label>
      <input type="text" id="fav-name" required />
      <div id="api-search-result"></div>
      <label>¿Por qué te gusta?</label>
      <textarea id="fav-reason" rows="3"></textarea>
      <label>Imagen:</label>
      <div class="image-search-container">
        <input type="url" id="fav-image" placeholder="URL de imagen o se buscará automáticamente">
        <button type="button" id="search-image-btn">Buscar imagen</button>
      </div>
      <div id="image-preview" class="image-preview" style="display:none;">
        <img id="preview-img" src="" alt="Vista previa">
      </div>
      <br><br>
      <button type="submit">Finalizar</button>
    </form>
  `;

  const nameInput = document.getElementById("fav-name");
  const imageInput = document.getElementById("fav-image");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  // Buscar imagen automáticamente cuando se pierde el foco del campo nombre
  nameInput.addEventListener("blur", async () => {
    const title = nameInput.value.trim();
    
    if (title && !imageInput.value) {
      try {
        document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imagen...</p>';
        const result = await searchMedia(current, title);
        document.getElementById("api-search-result").innerHTML = '';
        
        if (result.found) {
          imageInput.value = result.imageUrl;
          previewImg.src = result.imageUrl;
          imagePreview.style.display = "block";
        }
      } catch (error) {
        console.error("Error al buscar imagen:", error);
      }
    }
  });

  // Evento para el botón de búsqueda de imagen
  document.getElementById("search-image-btn").addEventListener("click", async () => {
    const title = nameInput.value.trim();
    
    if (!title) {
      alert("Por favor ingresa un nombre para buscar");
      return;
    }
    
    try {
      document.getElementById("api-search-result").innerHTML = '<p class="searching-msg">Buscando imagen...</p>';
      const result = await searchMedia(current, title);
      
      if (result.found) {
        document.getElementById("api-search-result").innerHTML = '<p class="success-msg">¡Imagen encontrada!</p>';
        imageInput.value = result.imageUrl;
        previewImg.src = result.imageUrl;
        imagePreview.style.display = "block";
      } else {
        document.getElementById("api-search-result").innerHTML = '<p class="error-msg">No se encontró imagen. Intenta con otro título o añade la URL manualmente.</p>';
      }
    } catch (error) {
      console.error("Error al buscar imagen:", error);
      document.getElementById("api-search-result").innerHTML = '<p class="error-msg">Error al buscar imagen. Intenta más tarde.</p>';
    }
  });

  // Ver imagen en tiempo real cuando cambia la URL
  imageInput.addEventListener("input", () => {
    const url = imageInput.value.trim();
    if (url) {
      previewImg.src = url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
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

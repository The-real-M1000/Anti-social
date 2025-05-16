import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";

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
      <label>¿Por qué te gusta?</label>
      <textarea id="fav-reason" rows="3"></textarea>
      <label>Imagen (URL):</label>
      <input type="url" id="fav-image" placeholder="https://..." />
      <br><br>
      <button type="submit">Finalizar</button>
    </form>
  `;

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


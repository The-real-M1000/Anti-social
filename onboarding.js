import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";

// Config de Firebase (MISMA que en script.js)
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
      showOnboardingForm(user.uid);
    }
  }
});

function showOnboardingForm(uid) {
  const container = document.getElementById("app-container");
  container.innerHTML = `
    <form id="onboarding-form" class="onboarding">
      <h2>🎯 ¿Qué te interesa compartir?</h2>
      <label><input type="checkbox" value="Películas" /> Películas</label>
      <label><input type="checkbox" value="Series" /> Series</label>
      <label><input type="checkbox" value="Juegos" /> Juegos</label>
      <label><input type="checkbox" value="Música" /> Música</label>
      <label><input type="checkbox" value="Libros" /> Libros</label>
      <label><input type="checkbox" value="Hobbies" /> Hobbies</label>
      <br><br>
      <button type="submit">Siguiente</button>
    </form>
  `;

  document.getElementById("onboarding-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = Array.from(document.querySelectorAll("#onboarding-form input[type=checkbox]:checked")).map(i => i.value);
    if (selected.length === 0) {
      alert("Selecciona al menos una categoría");
      return;
    }
    askForDetails(uid, selected);
  });
}

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
      <button type="submit">${index === categories.length - 1 ? "Finalizar" : "Siguiente"}</button>
    </form>
  `;

  document.getElementById("interest-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("fav-name").value.trim();
    const reason = document.getElementById("fav-reason").value.trim();
    const image = document.getElementById("fav-image").value.trim();

    interests[current] = { name, reason, image };

    if (index < categories.length - 1) {
      askForDetails(uid, categories, index + 1, interests);
    } else {
      await setDoc(doc(db, "profiles", uid), {
        interests,
        onboardingComplete: true
      }, { merge: true });

      alert("✅ ¡Onboarding completado!");
      location.reload();
    }
  });
}

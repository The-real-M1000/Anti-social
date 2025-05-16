import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

let onboardingStep = 0;
let selectedCategories = [];
let userAnswers = {};
let onboardingContainer;
let nextBtn;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists() || !profileSnap.data().onboardingComplete) {
      showOnboarding(user.uid);
    }
  }
});

function showOnboarding(uid) {
  const app = document.getElementById("app-container");
  app.innerHTML = `
    <section id="onboarding" class="view-section">
      <h2>¡Cuéntanos qué te gusta!</h2>
      <div id="onboarding-container" class="onboarding-box"></div>
      <button id="next-step">Siguiente</button>
    </section>
  `;
  onboardingContainer = document.getElementById("onboarding-container");
  nextBtn = document.getElementById("next-step");
  nextBtn.addEventListener("click", () => handleNextStep(uid));
  renderStep0();
}

function renderStep0() {
  onboardingStep = 0;
  onboardingContainer.innerHTML = `
    <p>¿Qué te interesa? (marca todo lo que te guste)</p>
    <label><input type="checkbox" value="películas"> Películas</label><br>
    <label><input type="checkbox" value="series"> Series</label><br>
    <label><input type="checkbox" value="música"> Música</label><br>
    <label><input type="checkbox" value="juegos"> Juegos</label><br>
    <label><input type="checkbox" value="libros"> Libros</label><br>
    <label><input type="checkbox" value="hobbies"> Hobbies</label><br>
  `;
}

function renderCategoryStep(category) {
  onboardingContainer.innerHTML = `
    <p>Cuéntanos tus gustos en <strong>${category}</strong></p>
    <label>Nombre de tu favorito:</label><br>
    <input type="text" id="fav-name" required><br><br>
    <label>¿Por qué te gusta?</label><br>
    <textarea id="fav-reason" rows="3"></textarea><br><br>
    <label>URL de imagen (opcional):</label><br>
    <input type="url" id="fav-image"><br>
  `;
}

async function handleNextStep(uid) {
  if (onboardingStep === 0) {
    const checks = document.querySelectorAll('#onboarding-container input[type="checkbox"]:checked');
    if (checks.length === 0) {
      alert("Selecciona al menos una categoría");
      return;
    }
    selectedCategories = [...checks].map(c => c.value);
    onboardingStep++;
    renderCategoryStep(selectedCategories[0]);
  } else if (onboardingStep <= selectedCategories.length) {
    const cat = selectedCategories[onboardingStep - 1];
    const name = document.getElementById("fav-name").value.trim();
    const reason = document.getElementById("fav-reason").value.trim();
    const image = document.getElementById("fav-image").value.trim();

    if (!name) {
      alert("Por favor escribe al menos un nombre.");
      return;
    }

    userAnswers[cat] = { name, reason, image };
    onboardingStep++;

    if (onboardingStep > selectedCategories.length) {
      await saveOnboardingData(uid);
    } else {
      renderCategoryStep(selectedCategories[onboardingStep - 1]);
    }
  }
}

async function saveOnboardingData(uid) {
  const profileRef = doc(db, "profiles", uid);
  await setDoc(profileRef, {
    onboardingComplete: true,
    interests: userAnswers
  }, { merge: true });

  document.getElementById("app-container").innerHTML = `
    <p class="placeholder-text">¡Gracias! Tu perfil ha sido configurado.</p>
  `;

  setTimeout(() => location.reload(), 1000);
}

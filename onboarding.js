// Modificación para onboarding.js
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
      
      <div>
        <label>Imagen:</label>
        <div class="image-search-container">
          <input type="url" id="fav-image" placeholder="URL de imagen o se buscará automáticamente">
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
      
      <br><br>
      <button type="submit">Finalizar</button>
    </form>
  `;

  const nameInput = document.getElementById("fav-name");
  const imageInput = document.getElementById("fav-image");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const imageResultsContainer = document.getElementById("image-results-container");
  const imageResultsGrid = document.getElementById("image-results-grid");

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

    try {
      await setDoc(doc(db, "profiles", uid), {
        interests,
        onboardingComplete: true
      }, { merge: true });

      alert("✅ ¡Perfil configurado!");
      location.reload();
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      alert("Error al guardar. Intenta de nuevo más tarde.");
    }
  });
}

// Modificación para script.js - función showInterestForm
function showInterestForm() {
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
        interests
      }, { merge: true });

      alert("🎉 Gusto añadido correctamente");
      loadMyProfile();
    } catch (error) {
      console.error("Error al guardar el interés:", error);
      alert("Error al guardar. Intenta de nuevo más tarde.");
    }
  });
}

// Estilos CSS adicionales para las tarjetas de resultado de imagen
const additionalCSS = `
.image-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.image-result-card {
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}

.image-result-card:hover {
  border-color: #4A90E2;
  transform: translateY(-2px);
}

.image-result-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.image-result-info {
  padding: 0.5rem;
  background-color: #f8f9fa;
  font-size: 0.85rem;
}

.image-result-info p {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.image-result-info span {
  font-size: 0.75rem;
  color: #6c757d;
}
`;

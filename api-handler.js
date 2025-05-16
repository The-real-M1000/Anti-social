
const TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNjhiM2M1ZWRkNTZlZmU4NmEzNmUzNWM0ZGM4OTFmYyIsIm5iZiI6MS43Mjg2OTExNTk5MTkwMDAxZSs5LCJzdWIiOiI2NzA5YmJkNzk1Njc4ZTM1M2Y3MjcxOGIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.TkJ4KsHatRgx_uvAGHvxkMnxCjlF9c-YOJMvUA_Vf6E";
const RAWG_API_KEY = "3ce551945ab3430eacfdf48b55fa0dbc";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const RAWG_BASE_URL = "https://api.rawg.io/api";
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

// Función genérica para hacer peticiones fetch
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error al hacer fetch:", error);
    return null;
  }
}

// Buscar imágenes de películas en TMDB
export async function searchMovieImage(title) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_API_KEY}`
    }
  };

  const searchUrl = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(title)}&language=es-ES`;
  const data = await fetchData(searchUrl, options);

  if (data && data.results && data.results.length > 0) {
    const posterPath = data.results[0].poster_path;
    if (posterPath) {
      return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
    }
  }
  return null;
}

// Buscar imágenes de series de TV en TMDB
export async function searchTVShowImage(title) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_API_KEY}`
    }
  };

  const searchUrl = `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(title)}&language=es-ES`;
  const data = await fetchData(searchUrl, options);

  if (data && data.results && data.results.length > 0) {
    const posterPath = data.results[0].poster_path;
    if (posterPath) {
      return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
    }
  }
  return null;
}

// Buscar imágenes de juegos en RAWG
export async function searchGameImage(title) {
  const searchUrl = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`;
  const data = await fetchData(searchUrl);

  if (data && data.results && data.results.length > 0) {
    return data.results[0].background_image;
  }
  return null;
}

// Buscar imágenes de libros en Google Books
export async function searchBookImage(title) {
  const searchUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(title)}`;
  const data = await fetchData(searchUrl);

  if (data && data.items && data.items.length > 0) {
    const imageLinks = data.items[0].volumeInfo.imageLinks;
    if (imageLinks) {
      return imageLinks.thumbnail || imageLinks.smallThumbnail;
    }
  }
  return null;
}

// Función principal que determina qué API usar según la categoría
export async function getImageForInterest(category, title) {
  if (!title) return null;
  
  category = category.toLowerCase();
  
  if (category === "películas" || category === "peliculas") {
    return await searchMovieImage(title);
  } else if (category === "series") {
    return await searchTVShowImage(title);
  } else if (category === "juegos" || category === "videojuegos") {
    return await searchGameImage(title);
  } else if (category === "libros") {
    return await searchBookImage(title);
  }
  
  return null;
}

// Función de búsqueda general para el formulario de intereses
export async function searchMedia(category, title) {
  const imageUrl = await getImageForInterest(category, title);
  return {
    found: !!imageUrl,
    imageUrl: imageUrl || ""
  };
}

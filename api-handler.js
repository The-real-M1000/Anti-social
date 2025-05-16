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

// Buscar imágenes de películas en TMDB (ahora devuelve múltiples resultados)
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
    // Devolver los primeros 3 resultados (o menos si no hay suficientes)
    return data.results.slice(0, 3).map(movie => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.substring(0, 4) : '',
      imageUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      overview: movie.overview
    }));
  }
  return [];
}

// Buscar imágenes de series de TV en TMDB (ahora devuelve múltiples resultados)
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
    // Devolver los primeros 3 resultados (o menos si no hay suficientes)
    return data.results.slice(0, 3).map(show => ({
      id: show.id,
      title: show.name,
      year: show.first_air_date ? show.first_air_date.substring(0, 4) : '',
      imageUrl: show.poster_path ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` : null,
      overview: show.overview
    }));
  }
  return [];
}

// Buscar imágenes de juegos en RAWG (ahora devuelve múltiples resultados)
export async function searchGameImage(title) {
  const searchUrl = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(title)}`;
  const data = await fetchData(searchUrl);

  if (data && data.results && data.results.length > 0) {
    // Devolver los primeros 3 resultados (o menos si no hay suficientes)
    return data.results.slice(0, 3).map(game => ({
      id: game.id,
      title: game.name,
      year: game.released ? game.released.substring(0, 4) : '',
      imageUrl: game.background_image,
      overview: game.description || ''
    }));
  }
  return [];
}

// Buscar imágenes de libros en Google Books (ahora devuelve múltiples resultados)
export async function searchBookImage(title) {
  const searchUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(title)}`;
  const data = await fetchData(searchUrl);

  if (data && data.items && data.items.length > 0) {
    // Devolver los primeros 3 resultados (o menos si no hay suficientes)
    return data.items.slice(0, 3).map(book => {
      const volumeInfo = book.volumeInfo || {};
      return {
        id: book.id,
        title: volumeInfo.title || 'Sin título',
        year: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : '',
        imageUrl: volumeInfo.imageLinks ? (volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail) : null,
        overview: volumeInfo.description || ''
      };
    });
  }
  return [];
}

// Función principal que determina qué API usar según la categoría
export async function getImageForInterest(category, title) {
  if (!title) return [];
  
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
  
  return [];
}

// Función de búsqueda general para el formulario de intereses
export async function searchMedia(category, title) {
  const results = await getImageForInterest(category, title);
  return {
    found: results.length > 0,
    results: results
  };
}

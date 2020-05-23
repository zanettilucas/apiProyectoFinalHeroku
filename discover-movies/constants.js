const movieGenres = [
  { id: 28, name: 'Accion' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animacion' },
  { id: 16, name: 'Animated' },
  { id: 35, name: 'Comedia' },
  { id: 80, name: 'Crimen' },
  { id: 99, name: 'Documental' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantacia' },
  { id: 36, name: 'Historia' },
  { id: 27, name: 'Terror' },
  { id: 10402, name: 'Musical' },
  { id: 9648, name: 'Misterio' },
  { id: 10749, name: 'Romance' },
  { id: 10749, name: 'Romantic' },
  { id: 878, name: 'Science Fiction' },
  { id: 878, name: 'Sci-Fi' },
  { id: 878, name: 'Sci Fi' },
  { id: 878, name: 'ciencia-ficcion' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Suspenso' },
  { id: 10752, name: 'Belica' },
  { id: 37, name: 'Western' },
];

function getGenreId(genre) {
  const row = movieGenres.find(function(elem) {
    return elem.name.toLowerCase() === genre.toLowerCase();
  });

  if (row) {
    return row.id;
  }
  return null;
}

module.exports = {
  movieGenres,
  getGenreId,
};

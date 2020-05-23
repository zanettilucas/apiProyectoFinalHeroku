const axios = require('axios');
const config = require('../config');

Array.prototype.shuffle = function () {
  for (let i = this.length; i; i--) {
    const j = Math.floor(Math.random() * i);
    [this[i - 1], this[j]] = [this[j], this[i - 1]]
  }
  return this
}

const discoverMovie = ({ genreId, isoCode, year, interval }) => {
  return moviedbApiCall('movie', {
    with_genres: genreId,
    primary_release_year: year,
    //with_original_language: isoCode,
    'primary_release_date.gte': (interval || {}).begin,
    'primary_release_date.lte': (interval || {}).end,
  })
    .then((response) => apiResultToCarousselle(response, 'movie'))
}

const discoverTv = ({ genreId, isoCode, year, interval }) => {
  return moviedbApiCall('tv', {
    with_genres: genreId,
    first_air_date_year: year,
    //with_original_language: isoCode,
    'air_date.gte': (interval || {}).begin,
    'air_date.lte': (interval || {}).end,
  })
    .then((response) => apiResultToCarousselle(response, 'tv'))
}

const moviedbApiCall = (kind, params) => {
  console.log("==== parametros ====");
  console.log(params);
  return Promise.all(
    [1, 2, 3].map(page => axios.get(`https://api.themoviedb.org/3/discover/${kind}`, {
      params: Object.assign({}, {
        api_key: config.MOVIEDB_TOKEN,
        sort_by: 'popularity.desc',
        language: 'es',
        include_adult: false,
        page,
      }, params),
    }))
  ).then(res => res.reduce((sum, currentElem) => sum.concat(currentElem.data.results), []))
}

const findMovieSimilarTo = (movie) => {
  return movieDbSearch('movie', { query: movie })
    .then(elems => {
      if (elems.length === 0) {
        return [{
          type: 'quickReplies',
          content: {
            title: 'Perdon, pero no pude encontrar ningún resultado para tu solicitud :(',
            buttons: [{ title: 'Volver a empezar', value: 'volver a empezar' }],
          },
        }]

      }
      return movieDbGetRecommendations(elems[0].id, 'movie')
        .then((res) => apiResultToCarousselle(res, 'movie'))
    })
}

const findShowSimilarTo = (movie) => {
  return movieDbSearch('tv', { query: movie })
    .then(elems => {
      if (elems.length === 0) {
        return [{
          type: 'quickReplies',
          content: {
            title: 'Perdon, pero no pude encontrar ningún resultado para tu solicitud :(',
            buttons: [{ title: 'Volver a empezar', value: 'volver a empezar' }],
          },
        }]

      }
      return movieDbGetRecommendations(elems[0].id, 'tv')
        .then((res) => apiResultToCarousselle(res, 'tv'))
    })
}

const movieDbSearch = (kind, params = {}) => {
  return axios.get(`https://api.themoviedb.org/3/search/${kind}`, {
    params: Object.assign({}, {
      api_key: config.MOVIEDB_TOKEN,
      include_adult: false,
      page: 1,
    }, params),
  })
    .then(res => res.data.results)
}

const movieDbGetRecommendations = (id, kind, params = {}) => {
  return Promise.all(
    [1, 2, 3].map(page => axios.get(`https://api.themoviedb.org/3/${kind}/${id}/recommendations`, {
      params: Object.assign({}, {
        api_key: config.MOVIEDB_TOKEN,
        page,
      }, params),
    }))
  ).then(res => res.reduce((sum, currentElem) => sum.concat(currentElem.data.results), []))

}

const apiResultToCarousselle = (results, kind) => {
  const cards = results.shuffle()
    .slice(0, 5)
    .map(e => ({
      title: e.title || e.name,
      subtitle: e.overview,
      imageUrl: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${e.poster_path}`,
      buttons: [{
        type: 'web_url',
        value: `https://www.themoviedb.org/${kind}/${e.id}`,
        title: 'Ver Mas',
      }],
    }))

  if (cards.length === 0) {
    return [{
      type: 'quickReplies',
      content: {
        title: 'Perdon, pero no pude encontrar ningún resultado para tu solicitud :(',
        buttons: [{ title: 'Volver a empezar', value: 'volver a empezar' }],
      },
    }]
  }

  const lastMessage = [
    'Espero que te guste lo que encontré para vos',
    'Esto es lo que encontre',
    'Espero que te guste!'
  ]

  return [
    {
      type: 'text',
      content: lastMessage.shuffle()[0],
    },
    { type: 'carousel', content: cards },
  ];
}

module.exports = {
  discoverMovie,
  discoverTv,
  findMovieSimilarTo,
  findShowSimilarTo,
};

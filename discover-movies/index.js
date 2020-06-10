const config = require('../config');
const movieApi = require('./movieApi.js');
const constants = require('./constants');
const moment = require('moment');
const admin = require("firebase-admin");

var serviceAccount = require(config.FIREBASE_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://movieadvice-43292.firebaseio.com"
});

const db = admin.database();

function loadMovieRoute(app) {
  app.post('/discover-movies', function(req, res) {
    console.log('[GET] /discover-movies');
    const conversation = req.body.conversation;
    const nlp = req.body.nlp;
    console.log('==================SKILL====================')
    console.log(`Skill: ${conversation.skill}`)
    console.log('==================USER ID====================')
    console.log(`userId: ${conversation.memory.userId}`)
    console.log('==================JSON REQUEST====================')
    console.log(conversation)
    console.log('======================================')

    const userId = conversation.memory.userId

    if (conversation.skill === 'anything') {
      //búsqueda sin criterios.
      return movieApi.discoverMovie({})
        .then(function(carouselle) {
          if (carouselle[1]) {
            let arrPeliculas = formatResponse(carouselle[1]["content"]);
            db.ref('usuarios/' + userId + '/ultimaRecomendacion').set({arrPeliculas})
          }
          res.json({
            replies: carouselle,
          });
        })
        .catch(function(err) {
          console.error('movieApi::discoverMovie error: ', err);
        });
    } else if (conversation.skill === 'discover') {
      //Obtener variables 
      const type = conversation.memory.recording.type;
      const kind = type == 'pelicula' ? 'movie' : 'tv';

      const genre = conversation.memory['genre'];
      const genreId = constants.getGenreId(genre.value);

      const language = conversation.memory['language'];
      const nationality = conversation.memory['nationality'];
      const isoCode = "";
      //const isoCode = language
      //  ? language.short.toLowerCase()
      //  : nationality.short.toLowerCase();

      const dateInterval = conversation.memory['interval']
      const date = conversation.memory['datetime']
      let year = null
      let interval = null
      let desde = null 
      let hasta = null

      if (date) {
        if(date.raw.length == 4 || date.raw.toLowerCase() == "este año") {
          if(!isNaN(date.iso.slice(0,4))) {
            year = date.iso.slice(0,4)
           }
        } else { 
          if(!isNaN(date.raw.slice(0,4))) {
            desde = date.raw.slice(0,4)
           }

          if(!isNaN(date.raw.slice(7,11))) {
            hasta = date.raw.slice(7,11)
          }

          interval = {
            begin: moment(new Date(desde)).format('YYYY-MM-DD'),
            end: moment(new Date(hasta)).format('YYYY-MM-DD'),
          }
        }
      }

      if (dateInterval) {
        interval = {
          begin: moment(new Date(dateInterval.begin)).format('YYYY-MM-DD'),
          end: moment(new Date( dateInterval.end)).format('YYYY-MM-DD'),
        }
      }

      if (kind === 'movie') {
        console.log('======================================')
        console.log('Descubrir pelicula')
        console.log('======================================')
        return movieApi.discoverMovie({ genreId, isoCode, year, interval })
          .then(function(carouselle) {
            if (carouselle[1]) {
              let arrPeliculas = formatResponse(carouselle[1]["content"]);
              db.ref('usuarios/' + userId + '/ultimaRecomendacion').set({arrPeliculas})
            }
            res.json({
              replies: carouselle,
            });
          })
          .catch(function(err) {
            console.error('movieApi::discoverMovie error: ', err);
          });
      }
      console.log('======================================')
      console.log('Descubrir tv')
      console.log('======================================')
      return movieApi.discoverTv({ genreId, isoCode, year, interval })
        .then(function(carouselle) {
          if (carouselle[1]) {
            let arrPeliculas = formatResponse(carouselle[1]["content"]);
            db.ref('usuarios/' + userId + '/ultimaRecomendacion').set({arrPeliculas})
          }
          res.json({
            replies: carouselle,
          });
        })
        .catch(function(err) {
          console.error('movieApi::discoverMovie error: ', err);
        });
    } else if (conversation.skill === 'such-as' && nlp.entities['movie-name']) {
      if (nlp.entities.tv) {
        console.log('======================================')
        console.log('Serie')
        console.log('======================================')
        return movieApi.findShowSimilarTo(nlp.entities['movie-name'][0].value)
          .then(function(carouselle) {
            if (carouselle[1]) {
              let arrPeliculas = formatResponse(carouselle[1]["content"]);
              db.ref('usuarios/' + userId + '/ultimaRecomendacion').set({arrPeliculas})
            }
            res.json({
              replies: carouselle,
            });
          })
          .catch(function(err) {
            console.error('movieApi::discoverMovie error: ', err);
          });
      }
      console.log('======================================')
      console.log('Pelicula')
      console.log('======================================')
      return movieApi.findMovieSimilarTo(nlp.entities['movie-name'][0].value)
        .then(function(carouselle) {
          if (carouselle[1]) {
            let arrPeliculas =  formatResponse(carouselle[1]["content"]);
            db.ref('usuarios/' + userId + '/ultimaRecomendacion').set({arrPeliculas})
          }
        res.json({
          replies: carouselle,
        });
      })
      .catch(function(err) {
        console.error('movieApi::discoverMovie error: ', err);
      });
    } else if (conversation.skill === 'home') {
      return movieApi.discoverHome()
          .then(function(carouselle) {
            res.json({
              replies: carouselle,
            });
          })
          .catch(function(err) {
            console.error('movieApi::discoverMovie error: ', err);
          });
    } else {
      return res.json({
        replies: [{type: 'text', content: 'No puedo ayudarte con esto :/'}],
      });
    }
  });
}

function formatResponse(arrPeliculas) {
  let copyArrPeliculas = [];

  for (let i = 0; i < arrPeliculas.length; i++) {
    copyArrPeliculas[i] = Object.assign({}, arrPeliculas[i]);
  }

  for (let i = 0; i < copyArrPeliculas.length; i++) {
    let pelicula = copyArrPeliculas[i];
    delete pelicula.buttons;
  }
  console.log("arrPeliculas", arrPeliculas);
  console.log("copyArrPeliculas", copyArrPeliculas);
  return copyArrPeliculas
}

module.exports = loadMovieRoute;

const config = require('../config');
const movieApi = require('./movieApi.js');
const constants = require('./constants');
const moment = require('moment');


function loadMovieRoute(app) {
  app.post('/discover-movies', function(req, res) {
    console.log('[GET] /discover-movies');
    const conversation = req.body.conversation;
    const nlp = req.body.nlp;
    console.log('======================================')
    console.log(`Skill: ${conversation.skill}`)
    console.log('======================================')

    console.log('==================JSON REQUEST====================')
    console.log(conversation)
    console.log('======================================')

    if (conversation.skill === 'anything') {
      //búsqueda sin criterios.
      return movieApi.discoverMovie({})
        .then(function(carouselle) {
          res.json({
            replies: carouselle,
          });
        })
        .catch(function(err) {
          console.error('movieApi::discoverMovie error: ', err);
        });
    } else if (conversation.skill === 'discover') {
      //Obtener variables 
      const movie = conversation.memory['movie'];
      const tv = conversation.memory['tv'];
      const kind = tv ? 'tv' : 'movie';

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
        if(date.raw.length == 4 || date.raw.toLowerCase() == "this year" || date.raw.toLowerCase() == "este año") {
          year = date;
        } else { 
          if(!isNaN(json.datetime.raw.slice(0,4))) {
            desde = json.datetime.raw.slice(0,4)
           }

          if(!isNaN(json.datetime.raw.slice(7,11))) {
            hasta = json.datetime.raw.slice(7,11)
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
        console.log('Such as in tv')
        console.log('======================================')
        return movieApi.findShowSimilarTo(nlp.entities['movie-name'][0].value)
          .then(function(carouselle) {
            res.json({
              replies: carouselle,
            });
          })
          .catch(function(err) {
            console.error('movieApi::discoverMovie error: ', err);
          });
      }
      console.log('======================================')
      console.log('Such as in movie')
      console.log('======================================')
      return movieApi.findMovieSimilarTo(nlp.entities['movie-name'][0].value)
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
        replies: [{type: 'text', content: 'Can not help you with this right now'}],
      });
    }
  });
}

module.exports = loadMovieRoute;

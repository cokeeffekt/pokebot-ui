window.eventLog = {};
var pokeBot = new Vue({
  data: {
    trainer: {
      username: '...',
      auth: false,
      evolutions: null,
      poke_stop_visits: 0,
      currency: [],
      pokeballs_thrown: 0,
      experience: 0,
      pokemon_deployed: null,
      next_level_xp: 0,
      item_storage: 0,
      level: 0,
      km_walked: 0,
      poke_storage: 0,
      pokemons_captured: 0,
      pokemons_encountered: 0,
      prev_level_xp: 0,
      team: null,
      unique_pokedex_entries: 0,
    },
    inventory: [],
    pokemon: []
  },
  components: {
    pokemap: require('modules/pokemap/map'),
    login: require('modules/login/login'),
    controls: require('modules/controls/panel'),
  },
  created: function () {
    var $cope = this;
    console.log('[i] App Created');
    this.socket = io();

    this.socket.on('connect', function () {
      console.log('[i] WS connection established');
    });

    // socket events
    this.socket.on('Evnt', function (eventType, obj) {
      $cope.$broadcast(eventType, obj);
      $cope.$emit(eventType, obj);
      // for debuging in browser console.

      window.eventLog[eventType] = {
        time: Date(),
        obj: obj
      };
    });

    this.socket.on('disconnect', function () {
      console.warn('[!] Socket Disconnected');
      location.reload();
    });

    this.socket.on('consoleMsg', function (text, obj) {
      console.log(text, obj);
      alertify.log(text);
    });
  },

  // app events
  events: {
    emit: function (evnt, obj) {
      this.socket.emit(evnt, obj);
    },
    // give server login information
    login: function (obj) {
      this.socket.emit('login', obj);
    },
    loginSuccess: function () {
      this.trainer.auth = true;
    },
    trainerProfile: function (obj) {
      _.assign(this.trainer, obj);
    },
    trainerStats: function (obj) {
      _.assign(this.trainer, obj);
    },
    pokemonList: function (list) {
      var $cope = this;
      // remove old pokemon from clients list
      _.each(this.pokemon, function (p) {
        var stillExist = _.find(list, {
          sid: p.sid
        });
        if (!stillExist)
          $cope.pokemon.$remove(p);
      });
      // upsert pokemon
      _.each(list, function (p) {
        var exist = _.find($cope.pokemon, {
          sid: p.sid
        });
        if (exist)
          _.assign(exist, p);
        else
          $cope.pokemon.push(p);
      });
    }
  }
});

$(function () {
  console.log('(-)');
  pokeBot.$mount('#pokeBot');
});

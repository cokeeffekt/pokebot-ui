var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var async = require('async');
var geocoder = require('geocoder');

var PokemonGO = require('pokemon-go-node-api');
var trainer = new PokemonGO.Pokeio();

var sGeo = require('./spatial');

app.use(express.static('public'));

io.on('connection', function (socket) {
  console.log('[i] Client connected to WS');
  trainer.socket = socket;
  trainer.playerInfo.debug = false;
  trainer.walkingPath = [];
  // login from client
  socket.on('login', function (obj) {
    trainer.loginObj = obj;
    trainer.init(obj.username, obj.password, locObj(obj.location), obj.provider, trainerInit);
  });

  socket.on('disconnect', function () {
    console.log('[!] Client disconnected to WS');
    // clean up
    trainer = undefined;
    trainer = new PokemonGO.Pokeio();
  });

  // tools events
  socket.on('killPath', function (obj) {

  });

  socket.on('farmZone', function (obj) {
    if (trainer.walkingPath.length > 0)
      return console.sck('[i] Already walking a path');

    var spD = sGeo.spiralSquare(trainer.playerInfo.latitude, trainer.playerInfo.longitude, 25, obj.loops * 2);
    var fullpath = [];
    _.each(spD, function (point, key) {
      if (spD[key + 1])
        fullpath = _.concat(fullpath, sGeo.walkPoints(point[0], point[1], spD[key + 1][0], spD[key + 1][1], obj.speed * 3));
      else
        fullpath = _.concat(fullpath, sGeo.walkPoints(point[0], point[1], trainer.playerInfo.latitude, trainer.playerInfo.longitude, obj.speed * 3));
    });
    socket.emit('Evnt', 'drawPath', {
      path: fullpath
    });

    trainer.walkingPath = fullpath;

    walkTrainerPath();

  });

  socket.on('walkTo', function (obj) {
    if (trainer.walkingPath.length > 0)
      return console.sck('[i] Already walking a path');

    console.sck('[i] Building Walk Path');
    var loc = locObj(obj.location);

    var bp = function (lat, lng) {
      var brng = sGeo.bearing(trainer.playerInfo.latitude, trainer.playerInfo.longitude, lat, lng);
      var dstnc = sGeo.distance(trainer.playerInfo.latitude, trainer.playerInfo.longitude, lat, lng);
      console.sck('[i] Walking to ' + lat + ', ' + lng + ', ' + '; deg:' + brng + '; dis:' + dstnc);

      // path tasker will run at 3 second intervals so multiply m/s (speed by 3)
      trainer.walkingPath = sGeo.walkPoints(trainer.playerInfo.latitude, trainer.playerInfo.longitude, lat, lng, obj.speed * 3);

      walkTrainerPath();
    };

    if (loc.type == 'name') {
      geocoder.geocode(loc.name, function (err, data) {
        if (err || data.status === 'ZERO_RESULTS') {
          return console.sck('[!] Location look up failed!');
        }
        var _data$results$0$geome = data.results[0].geometry.location;
        var lat = _data$results$0$geome.lat;
        var lng = _data$results$0$geome.lng;
        bp(lat, lng);
      });
    }
    if (loc.type == 'coords') {
      bp(loc.coords.latitude, loc.coords.longitude);
    }
  });
});

// keep the client up to date with trainer status, dont need to do this too often
setInterval(function () {
  if (!trainer.isAlive) return;
  trainerLocation();
  trainerProfile();
  trainerInventory();
}, 30000);


// run on login
function trainerInit(err) {
  if (err) {
    console.sck('[!] ' + err);
    trainer.socket.emit('Evnt', 'loginFail', err);
    trainer.isAlive = true;
    trainer = undefined;
    trainer = new PokemonGO.Pokeio();
    return;
  }
  trainer.socket.emit('Evnt', 'loginSuccess');
  console.sck('[i] Trainer Logged in!');
  trainer.isAlive = true;

  // tell the client about things
  trainerLocation();
  trainerProfile();
  trainerInventory();
  heartbeat();
}

// perform heartbeat

function heartbeat(callback) {
  if (typeof callback != 'function') callback = function () {};
  trainer.Heartbeat(function (err, hb) {
    if (err) {
      console.sck('[!] heartbeat error: ', err);
    }

    // scan cells
    async.eachSeries(hb.cells, function (cell, doneCell) {

        var cellComplete = 0;
        var checkComplete = function () {
          if (cellComplete === 2)
            doneCell();
        };

        async.eachSeries(cell.Fort, function (fort, doneFort) {
            if (fort.FortType == 1 && fort.Enabled) {
              // might send more info here later
              trainer.socket.emit('Evnt', 'fortLocation', _.pick(fort, ['FortId', 'Latitude', 'Longitude']));
              var d = sGeo.distance(
                trainer.playerInfo.latitude, trainer.playerInfo.longitude,
                fort.Latitude, fort.Longitude
              );
              if (d < 40) {
                trainer.GetFort(fort.FortId, fort.Latitude, fort.Longitude, function (err, fortresponse) {
                  if (err || !fortresponse.result) {
                    console.sck('[!] FORT ERROR: ', err, fortresponse);
                    return doneFort();
                  }
                  var status = ['Unexpected error', 'Pokestop Pillaged', 'Cant reach Pokestop', 'Pokestop Depleted'];
                  console.sck('[+] ' + status[fortresponse.result]);
                  doneFort();
                });
              } else {
                doneFort();
              }
            } else {
              doneFort();
            }
          },
          function () {
            cellComplete++;
            checkComplete();
          });

        // near by pokemons; pretty sure this is useless for us...
        //        _.each(cell.NearbyPokemon, function () {
        //          console.log(arguments);
        //        });

        // catch da pokemons
        async.eachSeries(cell.MapPokemon, function (pkmn, donePkm) {
            var pokedexInfo = trainer.pokemonlist[parseInt(pkmn.PokedexTypeId) - 1];
            console.log('[+] There is a ' + pokedexInfo.name + ' near!! I can try to catch it!');
            trainer.EncounterPokemon(pkmn, function (err, dat) {
              if (err) {
                console.sck('[!] Hard fail encounter', err);
                return donePkm();
              }
              trainer.CatchPokemon(pkmn, 1, 1.950, 1, 1, function (err, xdat) {
                if (err) {
                  console.sck('[!] Hard fail catch', err);
                  return donePkm();
                }
                var status = ['Unexpected error', 'Successful Catch!', 'Catch Escape', 'Catch Flee', 'Missed Catch'];
                console.sck('[+] ' + status[xdat.Status] + ' ' + pokedexInfo.name);
                return donePkm();
              });
            });
          },
          function () {
            cellComplete++;
            checkComplete();
          });


      },
      function () {
        //        console.sck('[i] Completed location: ' + trainer.playerInfo.locationName);
        trainerInventory();
        callback();
      });
  });
}

function trainerLocation() {
  trainer.socket.emit('Evnt', 'trainerLocation', _.pick(trainer.playerInfo, ['locationName', 'latitude', 'longitude']));
}

function trainerInventory() {
  trainer.GetInventory(function (err, inventory) {
    if (err) return console.log('[!] Inventory Error', err);
    var stats = _.chain(inventory.inventory_delta.inventory_items)
      .map('inventory_item_data')
      .reject({
        player_stats: null
      })
      .value()[0].player_stats;

    stats = _.pick(stats, [
      'level',
      'experience',
      'prev_level_xp',
      'next_level_xp',
      'km_walked',
      'pokemons_encountered',
      'unique_pokedex_entries',
      'pokemons_captured',
      'evolutions',
      'poke_stop_visits',
      'pokeballs_thrown',
      'pokemon_deployed'
    ]);
    stats.experience = parseInt(stats.experience.toString());
    stats.prev_level_xp = parseInt(stats.prev_level_xp.toString());
    stats.next_level_xp = parseInt(stats.next_level_xp.toString());

    trainer.socket.emit('Evnt', 'trainerStats', stats);

    var pokemon = _.chain(inventory.inventory_delta.inventory_items)
      .map('inventory_item_data')
      .reject({
        pokemon: null
      }).map('pokemon')
      .map(function (p) {
        p.sid = p.id.toString();
        if (!p.is_egg)
          p.pokedexInfo = trainer.pokemonlist[parseInt(p.pokemon_id) - 1];
        if (p.is_egg)
          p.pokedexInfo = {
            id: '0',
            num: '000',
            name: p.egg_km_walked_target + 'km Egg',
            img: 'http://cdn.bulbagarden.net/upload/d/de/GO_Egg.png',
            type: 'Egg',
          };
        return p;
      })
      .value();

    trainer.socket.emit('Evnt', 'pokemonList', pokemon);

  });
}

function trainerProfile() {
  trainer.GetProfile(function (err, profile) {
    if (err) return console.log('[!] Profile Error', err);
    trainer.socket.emit('Evnt', 'trainerProfile', _.pick(profile, ['username', 'team', 'poke_storage', 'item_storage', 'currency']));
  });
}

function walkTrainerPath() {
  if (trainer.walkingPath.length < 1) {
    socket.emit('Evnt', 'clearPolyMap');
    console.sck('[i] Path Complete');
    return;
  }
  var dest = trainer.walkingPath.shift();
  trainer.SetLocation({
    type: 'coords',
    coords: {
      latitude: dest[0],
      longitude: dest[1]
    }
  }, function (err, resp) {
    trainerLocation();
    heartbeat(function () {
      setTimeout(walkTrainerPath, 3000);
    });
  });
}

console.sck = function () {
  console.log.apply(null, arguments);
  trainer.socket.emit('consoleMsg', arguments[0], arguments[1]);
};

http.listen(5000, function () {
  console.log('listening on *:5000');
});


function locObj(input) {
  var t = input.match(/([\-0-9]+\.[\-0-9]+)\W+([\-0-9]+\.[\-0-9]+)/);
  if (t) {
    return {
      type: 'coords',
      coords: {
        latitude: parseFloat(t[1]),
        longitude: parseFloat(t[2])
      }
    };
  } else {
    return {
      type: 'name',
      name: input
    };
  }
}

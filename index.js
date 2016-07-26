var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PokemonGO = require('pokemon-go-node-api');
var trainer = new PokemonGO.Pokeio();
var _ = require('lodash');

app.use(express.static('public'));

io.on('connection', function (socket) {
  console.log('[i] Client connected to WS');
  trainer.socket = socket;
  trainer.playerInfo.debug = false;
  // login from client
  socket.on('login', function (obj) {
    trainer.loginObj = obj;
    trainer.init(obj.username, obj.password, {
      type: 'name',
      name: obj.location
    }, obj.provider, trainerInit);
  });

  socket.on('disconnect', function () {
    console.log('[!] Client disconnected to WS');
    // clean up
    delete trainer;
    trainer = new PokemonGO.Pokeio();
  });

});

// keep the client up to date with trainer status
setInterval(function () {
  if (!trainer.isAlive) return;
  locationPoint();
  trainerProfile();
  trainerInventory();
}, 10000);

// run on login
function trainerInit(err) {
  if (err) {
    console.log('[i] ' + err);
    trainer.socket.emit('consoleMsg', '[i] ' + err);
    trainer.socket.emit('Evnt', 'loginFail', err);
    trainer.isAlive = true;
    delete trainer;
    trainer = new PokemonGO.Pokeio();
    return;
  }
  trainer.socket.emit('Evnt', 'loginSuccess');
  trainer.socket.emit('consoleMsg', '[i] Trainer Logged in!');
  trainer.isAlive = true;

  // tell the client about things
  locationPoint();
  trainerProfile();
  trainerInventory();
}

function locationPoint() {
  trainer.socket.emit('Evnt', 'locationPoint', trainer.GetLocationCoords());
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

    trainer.socket.emit('Evnt', 'trainerInventory', stats);
  });
}

function trainerProfile() {
  trainer.GetProfile(function (err, profile) {
    if (err) return console.log('[!] Profile Error', err);
    trainer.socket.emit('Evnt', 'trainerProfile', _.pick(profile, ['username', 'team', 'poke_storage', 'item_storage', 'currency']));
  });
}

http.listen(5000, function () {
  console.log('listening on *:5000');
});

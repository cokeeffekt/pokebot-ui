module.exports = {
  partials: {
    pokemon: require('modules/controls/pokemon.tpl.html'),
  },
  computed: {
    pkmonList: function () {

      var list = _.chain(this.pokemon)
        .groupBy('pokemon_id')
        .map(function (group) {
          return _.chain(group)
            .map(function (p) {
              p.qty = group.length;
              return p;
            })
            .sortBy('cp').value().reverse()[0];
        })
        .value();

      return list;
    }
  }
};

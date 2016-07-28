module.exports = {
  data: function () {
    return {
      walkTo: {
        open: false,
        locaion: null,
        speed: 4
      },
      farmZone: {
        open: false,
        speed: 4,
        loops: 5
      }
    };
  },
  partials: {
    tools: require('modules/controls/tools.tpl.html'),
  },
  methods: {
    openTool: function (tool) {
      if (typeof this[tool] == 'object')
        this[tool].open = (this[tool].open ? false : true);
    },
    submitWalkTo: function () {
      this.$dispatch('emit', 'walkTo', this.walkTo);
    },
    submitFarmZone: function () {
      this.$dispatch('emit', 'farmZone', this.farmZone);
    }
  }
};

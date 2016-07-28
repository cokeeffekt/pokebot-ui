module.exports = Vue.extend({
  props: ['trainer', 'inventory', 'pokemon'],
  template: require('modules/controls/panel.tpl'),
  mixins: [
    require('modules/controls/pokemon.mixin'),
    require('modules/controls/tools.mixin')
  ],
  partials: {
    items: require('modules/controls/items.tpl.html')
  },
  data: function () {
    return {
      showingPanel: 'pokemon',
    };
  },
  ready: function () {
    console.log('[i] Control Panel Ready', this.$el);
  },
  computed: {
    xpPercent: function () {
      var xp = Math.ceil(((this.trainer.experience - xpTable[this.trainer.level - 1]) / (xpTable[this.trainer.level] - xpTable[this.trainer.level - 1])) * 100);
      return (xp ? xp : 0);
    }
  },
  methods: {
    setTab: function (panel) {
      this.showingPanel = panel;
    }
  }
});

// surely there is a better way to do this and i missed it....
var xpTable = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 65000, 75000, 85000, 100000, 120000, 140000, 160000, 185000, 210000, 260000, 335000, 435000, 560000, 710000, 900000, 1100000, 1350000, 1650000, 2000000, 2500000, 3000000, 3750000, 4750000, 6000000, 7500000, 9500000, 12000000, 15000000, 20000000];

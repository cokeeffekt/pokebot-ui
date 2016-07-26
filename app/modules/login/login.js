module.exports = Vue.extend({
  template: require('modules/login/login.tpl'),
  data: function () {
    return {
      username: localStorage.getItem('_username'),
      password: null,
      provider: localStorage.getItem('_provider'),
      location: localStorage.getItem('_location'),
      loading: false
    };
  },
  ready: function () {
    console.log('[i] Waiting for login', this.$el);
  },
  methods: {
    login: function () {
      if (this.loading) return;
      this.$dispatch('login', {
        username: this.username,
        password: this.password,
        provider: this.provider,
        location: this.location
      });
      localStorage.setItem('_username', this.username);
      localStorage.setItem('_provider', this.provider);
      localStorage.setItem('_location', this.location);
      this.loading = true;
    }
  }
});

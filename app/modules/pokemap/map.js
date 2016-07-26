module.exports = Vue.extend({
  template: require('modules/pokemap/map.tpl'),
  data: function () {
    return {
      map: null,
      startLoc: null,
      trainerMarker: null
    };
  },
  ready: function () {

    console.log('[i] Maps Ready', this.$el);
    this.map = new google.maps.Map(this.$el, {
      center: new google.maps.LatLng(33.808678, -117.918921),
      zoom: 18,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    this.trainerMarker = createMarker({
      position: new google.maps.LatLng(33.808678, -117.918921),
      map: this.map,
      icon: '/img/trainer.png'
    }, 'Player');

  },
  events: {
    locationPoint: function (obj) {
      if (!this.startLoc) {
        this.map.setCenter(new google.maps.LatLng(obj.latitude, obj.longitude));
        this.startLoc = [obj.latitude, obj.longitude];
      }
      this.trainerMarker.setPosition(new google.maps.LatLng(obj.latitude, obj.longitude));
    }
  }
});

// some gapi stuff
var infoWindow = new google.maps.InfoWindow();

function createMarker(options, html) {
  var marker = new google.maps.Marker(options);
  if (html) {
    google.maps.event.addListener(marker, 'click', function () {
      infoWindow.setContent(html);
      infoWindow.open(options.map, this);
    });
  }
  return marker;
}

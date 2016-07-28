module.exports = Vue.extend({
  template: require('modules/pokemap/map.tpl'),
  data: function () {
    return {
      map: null,
      startLoc: null,
      trainerMarker: null,
      walkPoly: false,
      markers: {},
      forts: {}
    };
  },
  ready: function () {

    console.log('[i] Maps Ready', this.$el);
    this.map = new google.maps.Map(this.$el, {
      center: new google.maps.LatLng(35.0735877, -79.0578227),
      zoom: 18,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    this.trainerMarker = createMarker({
      position: new google.maps.LatLng(35.0735877, -79.0578227),
      map: this.map,
      icon: '/img/trainer.png'
    }, 'Player');

  },
  events: {
    makeMarker: function (obj) {
      this.markers[obj.name] = createMarker({
        position: new google.maps.LatLng(obj.latitude, obj.longitude),
        map: this.map
      }, obj.name);
    },
    clearPolyMap: function () {
      if (this.walkPoly) {
        this.walkPoly.setMap(null);
        this.walkPoly = false;
      }
    },
    drawPath: function (obj) {
      if (this.walkPoly) {
        this.walkPoly.setMap(null);
        this.walkPoly = false;
      }
      var walkPath = obj.path.map(function (c) {
        return {
          lat: c[0],
          lng: c[1]
        };
      });
      this.walkPoly = new google.maps.Polyline({
        path: walkPath,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.2,
        strokeWeight: 2
      });
      this.walkPoly.setMap(this.map);
    },
    trainerLocation: function (obj) {
      if (!this.startLoc) {
        this.map.setCenter(new google.maps.LatLng(obj.latitude, obj.longitude));
        this.startLoc = [obj.latitude, obj.longitude];
      }
      localStorage.setItem('_location', obj.locationName);
      this.trainerMarker.setPosition(new google.maps.LatLng(obj.latitude, obj.longitude));
    },
    fortLocation: function (obj) {
      if (!this.forts[obj.FortId])
        this.forts[obj.FortId] = createMarker({
          position: new google.maps.LatLng(obj.Latitude, obj.Longitude),
          map: this.map,
          icon: '/img/pokestop.png'
        }, 'PokeStop');
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

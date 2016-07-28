// most of this comes from http://www.movable-type.co.uk/scripts/latlong.html

module.exports = {
  walkPoints: walkPoints,
  distance: distance,
  bearing: bearing,
  createCoord: createCoord,
  spiralSquare: spiralSquare
};

Number.prototype.toRad = function () {
  return this * Math.PI / 180;
};

Number.prototype.toDeg = function () {
  return this * 180 / Math.PI;
};

// start, end, distance between points on returned path.
function walkPoints(lat1, lon1, lat2, lon2, intvl) {
  intvl = (intvl ? intvl : 5);
  var dist = distance(lat1, lon1, lat2, lon2);
  var steps = dist / intvl;
  var frame = 1;
  var path = [[lat1, lon1]];
  var b = bearing(lat1, lon1, lat2, lon2);
  while (frame < steps) {
    path.push(createCoord(lat1, lon1, b, intvl * frame));
    frame++;
  }
  return path;
}

function distance(lat1, lon1, lat2, lon2) {
  var earthRadius = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();
  lat1 = lat1.toRad();
  lat2 = lat2.toRad();
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = earthRadius * c;
  return (Math.round(d * Math.pow(10, 3)) / Math.pow(10, 3)) * 1000;
}


function bearing(lat1, lon1, lat2, lon2) {
  //  var y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  //  var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  //  return (Math.atan2(y, x).toDeg() + 180) % 360;


  var l1 = lat1.toRad();
  var l2 = lat2.toRad();
  var o1 = (lon2 - lon1).toRad();

  // see http://mathforum.org/library/drmath/view/55417.html
  var y = Math.sin(o1) * Math.cos(l2);
  var x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(o1);
  var θ = Math.atan2(y, x);

  return (θ.toDeg() + 360) % 360;
}

function createCoord(lat1, lon1, bearing, distance) {
  var radius = 6371 * 1000;
  // see http://williams.best.vwh.net/avform.htm#LL

  var δ = Number(distance) / radius; // angular distance in radians
  var θ = Number(bearing).toRad();
  var φ1 = lat1.toRad();
  var λ1 = lon1.toRad();

  var φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  var x = Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2);
  var y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  var λ2 = λ1 + Math.atan2(y, x);

  return [φ2.toDeg(), (λ2.toDeg() + 540) % 360 - 180]; // normalise to −180..+180°
}

// start, distance between loops, # of loops
function spiralSquare(lat1, lon1, tight, loops) {
  var list = [tight, tight];
  while (list.length < loops * 2) {
    var t = list[list.length - 1];
    if (list.length % 2 === 0)
      t = t + tight;
    list.push(t);
  }

  var b = 0;
  var last = [lat1, lon1];
  var totalDistance = 0;
  list = list.map(function (d) {
    totalDistance = totalDistance + d;
    last = createCoord(last[0], last[1], b, d);
    b = ((b + 90) % 360);
    return last;
  });
  totalDistance = totalDistance + distance(list[0][0], list[0][1], lat1, lon1);
  totalDistance = totalDistance + distance(list[list.length - 1][0], list[list.length - 1][1], lat1, lon1);
  console.log(totalDistance, (totalDistance / 3) / 60, 'DISNT'); // human walk speed = 1.4m/s (doubles it for fast pace)
  list.unshift([lat1, lon1]);
  list.push([lat1, lon1]);
  return list;
}

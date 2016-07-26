console.log('Server Init');
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;



var peer = new Peer('megaport-tuna-server', {
  key: 'rx1g1udef1ypsyvi'
});

peer.on('connection', function (conn) {
  console.log('peer wants music!', conn);
  $('#mpTuna-server').append('<h2> - ' + conn.peer + '</h2>');
  peer.call(conn.peer, window.localStream);
});

peer.on('open', function (id) {
  console.log('My peer ID is: ' + id);
});

$(function () {
  navigator.getUserMedia({
    audio: true
  }, function (stream) {
    window.localStream = stream;
    console.log('local stream found.');
  }, function () {
    console.log('cant get audio source.');
  });
});

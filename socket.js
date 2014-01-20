/**
 * Socket module.
 */
var roomSocks = {},
    roomOfSock = {},
    roomCount = {};

exports.doSocket = function(socket) {
  socket.on('join', function(room, ack) {
    if (!roomSocks[room]) {
      roomSocks[room] = [];
      roomCount[room] = 0;
    }
    roomCount[room]++;
    roomOfSock[socket.id] = room;
    roomSocks[room].push(socket);
    ack(true);
    console.log('User joined ' + room + '. Count: ' + roomCount[room]);
  });

  socket.on('add', function(item, previousItem) {
    var room = roomOfSock[socket.id];
    console.log('Adding ' + item.title + ' (' + item.videoId + ') to ' + room);
    roomSocks[room].forEach(function(sock, index) {
      if (sock.id !== socket.id) {
        sock.emit('add', item, previousItem);
      }
    });
  });

  socket.on('remove', function(item) {
    var room = roomOfSock[socket.id];
    console.log('Removing ' + item.title + ' (' + item.videoId + ') from ' + room);
    roomSocks[room].forEach(function(sock, index) {
      if (sock.id !== socket.id) {
        sock.emit('remove', item);
      }
    });
  });

  socket.on('disconnect', function() {
    var room = roomOfSock[socket.id];

    // Remove the socket from the list of sockets associated with this
    // particular room.
    if (roomSocks[room]) {
      roomSocks[room].forEach(function(sock, index) {
        if (sock.id === socket.id) {
          roomSocks[room].splice(index, 1);
          roomCount[room]--;
          console.log('User left ' + room + '. Count: ' + roomCount[room]);
        }
      });
    }
  });
};
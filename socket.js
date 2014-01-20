/**
 * Socket module.
 */
var db = require('./db');

var roomSocks = {},
    roomOfSock = {},
    roomCount = {};

exports.doSocket = function(socket) {
  socket.on('join', function(room, callback) {
    if (!roomSocks[room]) {
      roomSocks[room] = [];
      roomCount[room] = 0;
    }
    roomCount[room]++;
    roomOfSock[socket.id] = room;
    roomSocks[room].push(socket);
    console.log('User joined ' + room + '. Count: ' + roomCount[room]);

    db.getRoom(room, function(err, items) {
      if (err) {
        callback(err);
      } else {
        callback(items);
      }
    });
  });

  socket.on('add', function(item, previousItem) {
    var room = roomOfSock[socket.id];

    if (!roomSocks[room]) return;
    console.log('Adding ' + item.title + ' (' + item.videoId + ') to ' + room);

    db.addItem(room, item);
    roomSocks[room].forEach(function(sock, index) {
      if (sock.id !== socket.id) {
        sock.emit('add', item, previousItem);
      }
    });
  });

  socket.on('remove', function(item) {
    var room = roomOfSock[socket.id];

    if (!roomSocks[room]) return;
    console.log('Removing ' + item.title + ' (' + item.videoId + ') from ' + room);

    db.removeItem(room, item);
    roomSocks[room].forEach(function(sock, index) {
      if (sock.id !== socket.id) {
        sock.emit('remove', item);
      }
    });
  });

  socket.on('disconnect', function() {
    var room = roomOfSock[socket.id];
    if (!roomSocks[room]) return;

    // Remove the socket from the list of sockets associated with this
    // particular room.
    roomSocks[room].forEach(function(sock, index) {
      if (sock.id === socket.id) {
        roomSocks[room].splice(index, 1);
        roomCount[room]--;
        console.log('User left ' + room + '. Count: ' + roomCount[room]);
      }
    });
  });
};
var sqlite3 = require('sqlite3'),
    yousynDB = new sqlite3.Database("yousyn.db");

exports.getRoom = function(room, callback) {
  if (!room || !callback) {
    console.error('Insufficient params to get rooms.');
    return;
  }

  var items = [];
  yousynDB.serialize(function() {
    yousynDB.get('SELECT id FROM rooms WHERE room="' + room + '"', function(err, row) {
      if (err) {
        callback(err);

      } else if (row) {
        yousynDB.each("SELECT * FROM room_items WHERE room_id=" + row.id, function(err, row) {
          if (!err) {
            items.push(row);
          }
        }, function(err, count) {
          if (err) {
            callback(err);
          } else {
            callback(undefined, items);
          }
        });

      } else {
        callback('Room does not exist.');
      }
    });
  });
};

var addRoom = function(room, callback) {
  var some = yousynDB.run('INSERT INTO rooms(room) VALUES("' + room + '")', function(err, res) {
    console.log('Added room:', room, this.lastID);
    callback(this.lastID);
  });
};

var addItem = function(roomId, item) {
  console.log('Adding item: ', arguments);
  yousynDB.run('INSERT INTO room_items VALUES (?, ?, ?, ?)', roomId, item.videoId, item.duration, item.title);
};

exports.addItem = function(room, item) {
  yousynDB.serialize(function() {
    yousynDB.get('SELECT id FROM rooms WHERE room="' + room + '"', function(err, row) {
      if (err) {
        console.error(err);
        return;
      }
      if (row) {
        addItem(row.id, item);
      } else {
        addRoom(room, function(roomId) {
          addItem(roomId, item);
        });
      }
    });
  });
};

var removeItem = function(roomId, item) {
  console.log('Removing item: ', arguments);
  yousynDB.run('delete from room_items where room_id=? and video_id=?', roomId, item.videoId);
};

exports.removeItem = function(room, item) {
  yousynDB.serialize(function() {
    yousynDB.get('SELECT id FROM rooms WHERE room="' + room + '"', function(err, row) {
      if (err) {
        console.error(err);
        return;
      }
      if (row) {
        removeItem(row.id, item);
      }
    });
  });
};
var sqlite3 = require('sqlite3'),
    yousynDB = new sqlite3.Database("yousyn.db");


yousynDB.serialize(function() {
  yousynDB.run("CREATE TABLE rooms(id INTEGER PRIMARY KEY AUTOINCREMENT, room CHAR(50))")
  yousynDB.run("CREATE TABLE room_items(room_id INTEGER NOT NULL, video_id CHAR(20), duration CHAR(12), title TEXT)")
});
yousynDB.close();
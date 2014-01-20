alf.event.on(document.getElementById('roll-up'), 'click', function() {
    document.getElementById('playlist').classList.toggle('hidden');
    document.getElementById('search').classList.toggle('hidden');
});

(function(window, undefined) {
  var socket = io.connect('http://localhost:8000');
  console.log('Joining room...');
  socket.emit('join', window.location.pathname, function(state) {
    if (state) {
      console.log('Joined:', window.location.pathname);
    } else {
      console.error('Could not join: ', window.location.pathname);
    }
  });

  socket.on('add', function(item, previousItem) {
    IMCoop.playlist.add(item, {
      previousItem: previousItem,
      isSocket: true
    });
  });

  alf.subscribe('playlist:add', function(itemObj, opts) {
    if (!opts) opts = {};
    if (!opts.isSocket) {
      var item = itemObj.getProps(),
          previous = itemObj.getPrevious() ? itemObj.getPrevious().getProps() : undefined;
      socket.emit('add', item, previous);
    }
  });

  socket.on('remove', function(item) {
    IMCoop.playlist.remove(item, { isSocket: true });
  });

  alf.subscribe('playlist:remove', function(itemObj, opts) {
    if (!opts) opts = {};
    if (!opts.isSocket) {
      var item = itemObj.getProps();
      socket.emit('remove', item);
    }
  });
})(window);
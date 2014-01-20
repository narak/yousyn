alf.event.on(document.getElementById('roll-up'), 'click', function() {
    document.getElementById('playlist').classList.toggle('hidden');
    document.getElementById('search').classList.toggle('hidden');
});

(function(window, undefined) {
  var sockOpts = document.body.dataset.rootPath ?
        { resource: document.body.dataset.rootPath.substring(1) } :
        undefined,
      socket = io.connect(window.location.origin, sockOpts),
      room = window.location.pathname.substring(document.body.dataset.rootPath.length);

  console.log('Joining room...');
  socket.emit('join', room, function(items) {
    if (items) {
      console.log('Joined:', room);
      if (alf.util.isArray(items)) {
        IMCoop.playlist.load(items, { isSocket: true });
      }
    } else {
      console.error('Could not join: ', room);
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
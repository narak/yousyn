var IMCoop = IMCoop || {};

IMCoop.playlist = (function() {
  /**
   * Event subscriptions.
   */
  var videoIdIndex = {},
      playlist = {},
      plHead, plTail, plCurrent,
      addToPlaylistView, doEventsFn,
      pollTimer,
      length = 0;

  /**
   * Private.
   */
  doEventsFn = function() {
    alf.event.on(IMCoopConfig.el.btnRemoveAll, 'click', function(evt) {
      evt.preventDefault();

      IMCoopConfig.el.playlist.innerHTML = '';
      plTail = plCurrent = plHead = undefined;
      length = 0;
      window.localStorage.clear('playlist');
      return false;
    });

    alf.event.on(IMCoopConfig.el.playlist, 'click', '.list a', function(evt) {
      var videoId = this.getAttribute('href').substring(1);
      if (videoId && videoIdIndex[videoId]) {
        plCurrent = videoIdIndex[videoId];
        alf.publish('playlist:play');
      }
    });
  };

  alf.subscribe('playlist:play', function(videoId) {
    console.log('Playing: ', plCurrent.title, plCurrent.videoId);
    IMCoop.youtube.play(plCurrent.videoId);
    plCurrent.el.classList.add('playing');

    if (!pollTimer) {
      pollTimer = window.setInterval(function() {
        var props = IMCoop.youtube.getProps();

        if (props.totalTime === 0) return;

        if (props.currentTime === props.totalTime ||
            props.currentTime > props.totalTime - 2) {

          if (plCurrent && plCurrent.next()) {
            plCurrent.el.classList.remove('playing');
            plCurrent = plCurrent.next();
            alf.publish('playlist:play');
            alf.publish('playlist:next');

          } else {
            alf.publish('playlist:stop');
          }
        }
      }, 1000);
    }
  });

  alf.subscribe('playlist:stop', function(videoId) {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  });

  /**
   * Play list item object.
   */
  var Item = function(item) {
    this.videoId = item.videoId;
    this.title = item.title;
    this.duration = item.duration;
    return this;
  };
  Item.prototype.next = function(item) {
    if (item) {
      this._nextItem = item;
    }
    return this._nextItem;
  };
  Item.prototype.previous = function(item) {
    if (item) {
      this._previousItem = item;
    }
    return this._previousItem;
  };

  addToPlaylistView = function(itemObj) {
    var html = alf.dom.parseHTML(IMCoopConfig.template.playlistItem(itemObj))[0];
    itemObj.el = html;
    IMCoopConfig.el.playlist.appendChild(html);
  };
  alf.subscribe('playlist:add', addToPlaylistView);

  /**
   * Public.
   */
  playlist = {
    add: function(item) {
      var itemObj = new Item(item);
      if (!plHead) {
        plHead = plTail = itemObj;
      } else {
        itemObj.previous(plTail);
        plTail.next(itemObj);
        plTail = itemObj;
      }
      videoIdIndex[itemObj.videoId] = itemObj;

      alf.publish('playlist:add', itemObj);
      return length++;
    },

    remove: function(item) {
      var previous,
          next;
      previous = item.previous();
      next = item.next();
      if (previous) {
        previous.next(next);
      }
      if (next) {
        next.previous(previous);
      }

      alf.publish('playlist:remove', itemObj);
      return length--;
    },

    next: function() {
      var retVal;
      if (!plCurrent) {
        plCurrent = plHead;
        retVal = plCurrent;
      } else {
        retVal = plCurrent.next();
      }

      alf.publish('playlist:next', retVal);
      return retVal;
    },

    previous: function() {
      var retVal;
      if (!plCurrent) {
        plCurrent = plTail;
        retVal = plCurrent;
      } else {
        retVal = plCurrent.previous();
      }

      alf.publish('playlist:previous', retVal);
      return retVal;
    }
  };

  /**
   * Load playlist from local storage.
   */
  (function() {
    var items = window.localStorage.getItem('playlist');
    if (!items) return;

    JSON.parse(items).forEach(function(item) {
      playlist.add(item);
    });
  })();

  /**
   * Save playlist to local storage everytime something is added to it.
   */
  alf.subscribe('playlist:add', function() {
    var item = plHead,
        marshalled = [];

    while(item) {
      marshalled.push({
        videoId: item.videoId,
        title: item.title,
        duration: item.duration
      });
      item = item.next();
    }
    window.localStorage.setItem('playlist', JSON.stringify(marshalled));
  });

  doEventsFn();
  return playlist;
})();
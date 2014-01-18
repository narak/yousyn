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

    alf.event.on(IMCoopConfig.el.btnPlayPause, 'click', function(evt) {
      alf.publish('playlist:play');
    });
    alf.event.on(IMCoopConfig.el.btnStop, 'click', function(evt) {
      alf.publish('playlist:stop');
    });
    alf.event.on(IMCoopConfig.el.btnNext, 'click', function(evt) {
      alf.publish('playlist:next');
    });
    alf.event.on(IMCoopConfig.el.btnPrevious, 'click', function(evt) {
      alf.publish('playlist:previous');
    });
  };

  alf.subscribe('playlist:play', function(videoId) {
    if (!plCurrent) {
      plCurrent = plHead;
    }

    console.log('Playing: ', plCurrent.title, plCurrent.videoId);
    IMCoop.youtube.play(plCurrent.videoId);
    plCurrent.el.classList.add('playing');

    if (!pollTimer) {
      pollTimer = window.setInterval(function() {
        var props = IMCoop.youtube.getProps();

        if (props.totalTime === 0) return;

        if (props.currentTime === props.totalTime ||
            props.currentTime > props.totalTime - 2) {
          alf.publish('playlist:next');
        }
      }, 1000);
    }
  });

  alf.subscribe('playlist:stop', function() {
    IMCoop.youtube.stop();
    window.clearInterval(pollTimer);
    pollTimer = undefined;
    plCurrent.el.classList.remove('playing');
  });

  alf.subscribe('playlist:next', function() {
    if (!plCurrent) {
      plCurrent = plHead;
    }
    plCurrent.el.classList.remove('playing');

    if (plCurrent.next()) {
      plCurrent = plCurrent.next();
    } else {
      plCurrent = plHead;
    }
    alf.publish('playlist:play');
  });

  alf.subscribe('playlist:previous', function() {
    if (!plCurrent) {
      plCurrent = plTail;
    }
    plCurrent.el.classList.remove('playing');

    if (plCurrent.previous()) {
      plCurrent = plCurrent.previous();
    } else {
      plCurrent = plTail;
    }
    alf.publish('playlist:play');
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
      return itemObj;
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
      return itemObj;
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
    var localItems = window.localStorage.getItem('playlist'),
        items = JSON.parse(localItems);
    if (!items) return;

    items.forEach(function(item) {
      var itemObj = playlist.add(item);
      if (!plHead) {
        plHead = itemObj
      }
      plTail = itemObj;
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
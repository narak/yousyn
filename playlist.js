var IMCoop = IMCoop || {};

IMCoop.playlist = (function() {
  /**
   * Event subscriptions.
   */
  var videoIdIndex = {},
      videoIds = [],
      playlist = {},
      plHead, plTail, plCurrent, plOldCurr,
      addToPlaylistView, doEventsFn, timeFromSexFn,
      pollTimer, isRepeatOn = false, isRandomOn = false,
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
    });

    alf.event.on(IMCoopConfig.el.playlist, 'click', '.list .remove', function(evt) {
      evt.preventDefault();
      var videoId = this.getAttribute('href').substring(1),
          item = videoIdIndex[videoId];
      if (videoId && item) {
        playlist.remove(item);
      }
    });

    alf.event.on(IMCoopConfig.el.playlist, 'click', '.list .play', function(evt) {
      evt.preventDefault();
      var videoId = this.getAttribute('href').substring(1);
      if (videoId && videoIdIndex[videoId]) {
        plCurrent = videoIdIndex[videoId];
        alf.publish('playlist:play');
      }
    });

    alf.event.on(IMCoopConfig.el.btnPlay, 'click', function(evt) {
      evt.preventDefault();
      alf.publish('playlist:play');
    });

    alf.event.on(IMCoopConfig.el.btnPause, 'click', function(evt) {
      evt.preventDefault();
      alf.publish('playlist:pause');
    });

    alf.event.on(IMCoopConfig.el.btnStop, 'click', function(evt) {
      evt.preventDefault();
      alf.publish('playlist:stop');
    });

    alf.event.on(IMCoopConfig.el.btnNext, 'click', function(evt) {
      evt.preventDefault();
      alf.publish('playlist:next');
    });

    alf.event.on(IMCoopConfig.el.btnPrevious, 'click', function(evt) {
      evt.preventDefault();
      alf.publish('playlist:previous');
    });

    alf.event.on(IMCoopConfig.el.btnRepeat, 'click', function(evt) {
      evt.preventDefault();
      if (isRepeatOn) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
      }
      isRepeatOn = !isRepeatOn;
    });

    alf.event.on(IMCoopConfig.el.btnRandom, 'click', function(evt) {
      evt.preventDefault();
      if (isRandomOn) {
        this.classList.remove('active');
        isRepeatOn = false;
        IMCoopConfig.el.btnRepeat.classList.remove('active');
      } else {
        this.classList.add('active');
        isRepeatOn = true;
        IMCoopConfig.el.btnRepeat.classList.add('active');
      }
      isRandomOn = !isRandomOn;
    });
  };

  alf.subscribe('playlist:play', function(videoId) {
    IMCoopConfig.el.btnPlay.style.display = 'none';
    IMCoopConfig.el.btnPause.style.display = '';

    if (!plCurrent) {
      plCurrent = plHead;
    }

    console.log('Playing: ', plCurrent.title, plCurrent.videoId);
    IMCoop.youtube.play(!plCurrent.isPaused ? plCurrent.videoId : undefined);
    delete plCurrent.isPaused;

    if (plOldCurr && !plCurrent.isPaused) {
      plOldCurr.el.classList.remove(IMCoopConfig.playingClass);
    }
    plOldCurr = plCurrent;
    plCurrent.el.classList.add(IMCoopConfig.playingClass);

    document.title = '\u266B ' + plCurrent.title;

    if (!pollTimer) {
      pollTimer = window.setInterval(function() {
        var props = IMCoop.youtube.getProps();

        if (props.totalTime === 0) return;

        if (props.currentTime === props.totalTime ||
            props.currentTime > props.totalTime - 2) {
          alf.publish('playlist:next');
        } else {
          plCurrent.elElapsedTime.innerHTML = timeFromSexFn(props.currentTime);
        }
      }, 1000);
    }
  });

  timeFromSexFn = function(sex) {
    var hours, mins, secs, res;
    res = sex / 60;
    mins = Math.floor(res);
    secs = Math.round((res % 1) * 60);
    if (secs < 10) {
      str = mins + ':0' + secs;
    } else {
      str = mins + ':' + secs;
    }

    if (sex > 3600) {
      alert('Progressive shit jeah!!!');
      hours = Math.floor(sex / 3600);
      str = hours + ':' + str;
    }
    return str;
  };

  alf.subscribe('playlist:pause', function() {
    IMCoopConfig.el.btnPlay.style.display = '';
    IMCoopConfig.el.btnPause.style.display = 'none';
    IMCoop.youtube.pause();
    plCurrent.isPaused = true;
    window.clearInterval(pollTimer);
    pollTimer = undefined;
  });

  alf.subscribe('playlist:stop', function() {
    IMCoopConfig.el.btnPlay.style.display = '';
    IMCoopConfig.el.btnPause.style.display = 'none';
    IMCoop.youtube.stop();
    window.clearInterval(pollTimer);
    plOldCurr.el.classList.remove(IMCoopConfig.playingClass);
    pollTimer = undefined;
  });

  var getRandomNum = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };
  alf.subscribe('playlist:next', function() {
    if (!plCurrent) {
      plCurrent = plHead;
    }

    if (isRandomOn) {
      plCurrent = videoIdIndex[videoIds[getRandomNum(0, videoIds.length-1)]];
    } else {
      plCurrent = plCurrent.next();
      if (!plCurrent && isRepeatOn) {
        plCurrent = plHead;
      }
    }

    if (plCurrent) {
      alf.publish('playlist:play');
    } else {
      alf.publish('playlist:stop');
    }
  });

  alf.subscribe('playlist:previous', function() {
    if (!plCurrent) {
      plCurrent = plTail;
    }

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
    var newItem = new Item(itemObj),
        html;
    newItem.elapsedTime = '<span class="elapsedTimePlaceholder"></span>';
    html = alf.dom.parseHTML(IMCoopConfig.template.playlistItem(newItem))[0];

    itemObj.el = html;
    itemObj.elElapsedTime = itemObj.el.querySelector('.elapsedTimePlaceholder');
    IMCoopConfig.el.playlist.appendChild(html);
  };
  alf.subscribe('playlist:add', addToPlaylistView);

  var removeFromArray = function(arr) {
      var what, a = arguments, L = a.length, ax;
      while (L > 1 && arr.length) {
          what = a[--L];
          while ((ax= arr.indexOf(what)) !== -1) {
              arr.splice(ax, 1);
          }
      }
      return arr;
  };

  /**
   * Public.
   */
  playlist = {
    add: function(item) {
      var itemObj = new Item(item);
      if (videoIdIndex[itemObj.videoId]) {
        alert('This video already exists in the playlist');
        return;
      }
      if (!plHead) {
        plHead = plTail = itemObj;
      } else {
        itemObj.previous(plTail);
        plTail.next(itemObj);
        plTail = itemObj;
      }
      videoIdIndex[itemObj.videoId] = itemObj;
      videoIds.push(itemObj.videoId);

      alf.publish('playlist:add', itemObj);
      return itemObj;
    },

    remove: function(item) {
      var previous,
          next;

      if (item.el) item.el.remove();
      previous = item.previous();
      next = item.next();
      if (previous) {
        previous.next(next);
      }
      if (next) {
        next.previous(previous);
      }

      if (plHead === item) {
        plHead = item.next() ? item.next() : undefined;
      }
      if (plTail === item) {
        plTail = item.previous() ? item.previous() : undefined;
      }
      if (plCurrent === item) {
        alf.publish('playlist:stop');
        plCurrent = undefined;
        plOldCurr = undefined;
      }

      delete videoIdIndex[item.videoId];
      removeFromArray(videoIds, item.videoId);

      alf.publish('playlist:remove', item);
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
  var saveToLocal = function() {
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
  };
  alf.subscribe('playlist:add', saveToLocal);
  alf.subscribe('playlist:remove', saveToLocal);

  doEventsFn();
  return playlist;
})();
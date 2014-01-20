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
      pollTimer,
      flags = {},
      length = 0;

  /**
   * Private.
   */
  doEventsFn = function() {
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
      if (flags.isRepeatOn) {
        this.classList.remove('active');
      } else {
        this.classList.add('active');
      }
      flags.isRepeatOn = !flags.isRepeatOn;
    });

    alf.event.on(IMCoopConfig.el.btnRandom, 'click', function(evt) {
      evt.preventDefault();
      if (flags.isRandomOn) {
        this.classList.remove('active');
        flags.isRepeatOn = false;
        IMCoopConfig.el.btnRepeat.classList.remove('active');
      } else {
        this.classList.add('active');
        flags.isRepeatOn = true;
        IMCoopConfig.el.btnRepeat.classList.add('active');
      }
      flags.isRandomOn = !flags.isRandomOn;
    });

    alf.event.on(IMCoopConfig.el.seekBar, 'change', function(evt) {
      IMCoop.youtube.seek(this.value);
    });
  };

  /**
   * PLAY
   */
  alf.subscribe('playlist:play', function(videoId) {
    if (!plCurrent) {
      if (!plHead) {
        alert('Nothing to play da.');
        return;
      }
      plCurrent = plHead;
    }


    console.log('Playing: ', plCurrent.title, plCurrent.videoId);
    IMCoop.youtube.play(!plCurrent.isPaused ? plCurrent.videoId : undefined);
    delete plCurrent.isPaused;

    if (plOldCurr && !plCurrent.isPaused) {
      plOldCurr.el.classList.remove(IMCoopConfig.playingClass);
      plOldCurr.isPlaying = false;
    }
    plOldCurr = plCurrent;
    plCurrent.el.classList.add(IMCoopConfig.playingClass);
    plCurrent.isPlaying = true;
    flags.isPlaying = true;

    IMCoopConfig.el.btnPlay.style.display = 'none';
    IMCoopConfig.el.btnPause.style.display = '';
    document.title = '\u266B ' + plCurrent.title;

    IMCoopConfig.el.seekBar.value = 0;
    if (!pollTimer) {
      pollTimer = window.setInterval(function() {
        var props = IMCoop.youtube.getProps();
        if (IMCoopConfig.el.seekBar.max !== props.totalTime) {
          IMCoopConfig.el.seekBar.max = props.totalTime;
          IMCoopConfig.el.duration.innerHTML = timeFromSexFn(props.totalTime);
        }
        IMCoopConfig.el.seekBar.value = props.currentTime;

        if (props.totalTime === 0) return;

        if (props.currentTime === props.totalTime ||
            props.currentTime > props.totalTime - 2) {
          alf.publish('playlist:next');
        } else {
          var hTime = timeFromSexFn(props.currentTime);
          IMCoopConfig.el.elapsedTime.innerHTML = hTime;
          if (plCurrent.elElapsedTime) {
            plCurrent.elElapsedTime = hTime;
          }
        }
      }, 1000);
    }
  });

  timeFromSexFn = function(sex) {
    var hours, mins, secs, res;
    res = sex / 60;
    mins = Math.floor(res);
    secs = Math.round((res % 1) * 60);
    if (secs === 0) {
      str = mins + ':00';
    } else if (secs < 10) {
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

  /**
   * PAUSE
   */
  alf.subscribe('playlist:pause', function() {
    IMCoopConfig.el.btnPlay.style.display = '';
    IMCoopConfig.el.btnPause.style.display = 'none';
    IMCoop.youtube.pause();
    plCurrent.isPaused = true;
    window.clearInterval(pollTimer);
    pollTimer = undefined;
    flags.isPlaying = false;
  });

  /**
   * STOP
   */
  alf.subscribe('playlist:stop', function() {
    IMCoopConfig.el.btnPlay.style.display = '';
    IMCoopConfig.el.btnPause.style.display = 'none';
    IMCoop.youtube.stop();
    window.clearInterval(pollTimer);
    if (plOldCurr) {
      plOldCurr.el.classList.remove(IMCoopConfig.playingClass);
    }
    pollTimer = undefined;
    flags.isPlaying = false;
  });

  /**
   * NEXT
   */
  var getRandomNum = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };
  alf.subscribe('playlist:next', function() {
    if (flags.isRandomOn) {
      var len = videoIds.length-1;
      if (len > 0) {
        plCurrent = videoIdIndex[videoIds[getRandomNum(0, videoIds.length-1)]];
      }
      alf.publish('playlist:play');
    } else {
      if (plCurrent) {
        plCurrent = plCurrent.getNext();
        if (!plCurrent && flags.isRepeatOn) {
          plCurrent = plHead;
        }
      }
      if (plCurrent) {
        alf.publish('playlist:play');
      } else {
        alf.publish('playlist:stop');
      }
    }
  });

  /**
   * PREVIOUS
   */
  alf.subscribe('playlist:previous', function() {
    if (plCurrent && plCurrent.getPrevious()) {
      plCurrent = plCurrent.getPrevious();
    } else {
      plCurrent = plTail;
    }
    if (plCurrent) {
      alf.publish('playlist:play');
    } else {
      alf.publish('playlist:stop');
    }
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
  Item.prototype.getNext = function(item) {
    return this._nextItem;
  };
  Item.prototype.setNext = function(item) {
    this._nextItem = item;
  };
  Item.prototype.getPrevious = function(item) {
    return this._previousItem;
  };
  Item.prototype.setPrevious = function(item) {
    this._previousItem = item;
  };
  Item.prototype.getProps = function() {
    return {
      videoId: this.videoId,
      title: this.title,
      duration: this.duration
    };
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
    add: function(item, opts) {
      if (!opts) opts = {};

      var itemObj = new Item(item);
      if (videoIdIndex[itemObj.videoId]) {
        alert('This video already exists in the playlist!');
        return;
      }

      if (!plHead) {
        plHead = plTail = itemObj;
      } else {
        if (opts.previousItem && videoIdIndex[opts.previousItem.videoId]) {
          var previous = videoIdIndex[opts.previousItem.videoId];
          itemObj.setPrevious(previous);
          itemObj.setNext(previous.getNext())
          previous.setNext(itemObj);

        } else {
          itemObj.setPrevious(plTail);
          plTail.setNext(itemObj);
          plTail = itemObj;
        }
      }
      videoIdIndex[itemObj.videoId] = itemObj;
      videoIds.push(itemObj.videoId);

      alf.publish('playlist:add', [itemObj, opts]);
      return itemObj;
    },

    remove: function(item, opts) {
      if (!opts) opts = {};

      var previous,
          next;

      if (!(item instanceof Item)) {
        item = videoIdIndex[item.videoId];
      }

      if (item.el) item.el.remove();
      previous = item.getPrevious();
      next = item.getNext();
      if (previous) {
        previous.setNext(next);
      }
      if (next) {
        next.setPrevious(previous);
      }

      if (plHead === item) {
        plHead = item.getNext() ? item.getNext() : undefined;
      }
      if (plTail === item) {
        plTail = item.getPrevious() ? item.getPrevious() : undefined;
      }
      if (plCurrent === item) {
        alf.publish('playlist:stop');
        plCurrent = undefined;
        plOldCurr = undefined;
      }

      delete videoIdIndex[item.videoId];
      removeFromArray(videoIds, item.videoId);

      alf.publish('playlist:remove', [item, opts]);
    },

    next: function() {
      var retVal;
      if (!plCurrent) {
        plCurrent = plHead;
        retVal = plCurrent;
      } else {
        retVal = plCurrent.getNext();
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
        retVal = plCurrent.getPrevious();
      }

      alf.publish('playlist:previous', retVal);
      return retVal;
    },

    load: function(items, opts) {
      if (!items) return;

      items.forEach(function(item) {
        if (item.video_id) {
          item.videoId = item.video_id;
          delete item.video_id;
        }
        playlist.add(item, opts);
      });
    }
  };

  /**
   * Save playlist to local storage everytime something is added to it.
   */
  /*var saveToLocal = function() {
    var item = plHead,
        marshalled = [];

    while(item) {
      marshalled.push({
        videoId: item.videoId,
        title: item.title,
        duration: item.duration
      });
      item = item.getNext();
    }
    window.localStorage.setItem('playlist', JSON.stringify(marshalled));
  };
  alf.subscribe('playlist:add', saveToLocal);
  alf.subscribe('playlist:remove', saveToLocal);*/

  doEventsFn();
  return playlist;
})();
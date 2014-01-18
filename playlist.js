var IMCoop = IMCoop || {};

IMCoop.playlist = (function() {
  /**
   * Event subscriptions.
   */
  var retVal,
      plHead, plTail, plCurrent,
      length = 0;

  /**
   * Private.
   */
  var Item = function(item) {
    this._item = item;
    this.videoId = item.id;
    this.title = item.snippet.title;
    this.duration = item.contentDetails.duration;
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

  /**
   * Public.
   */
  retVal = {
    add: function(item) {
      var itemObj = new Item(item);
      if (!plHead) {
        plHead = plTail = itemObj;
      } else {
        itemObj.previous(plTail);
        plTail.next(itemObj);
        plTail = itemObj;
      }

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
  return retVal;
})();
var IMCoop = IMCoop || {};

IMCoop.playlist = (function() {
  /**
   * Event subscriptions.
   */
  var plHead, plTail, plCurrent,
      length = 0;

  /**
   * Private.
   */
  var Item = function(item) {
    this._item = item;
    this.videoId = item.id.videoId;
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
  return {
    add: function(item) {
      var itemObj = new Item(item);
      if (!plHead) {
        plHead = plTail = itemObj;
      } else {
        itemObj.previous(plTail);
        plTail.next(itemObj);
        plTail = itemObj;
      }
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
      return length--;
    },

    next: function() {
      if (!plCurrent) {
        plCurrent = plHead;
        return plCurrent;
      } else {
        return plCurrent.next();
      }
    },

    previous: function() {
      if (!plCurrent) {
        plCurrent = plTail;
        return plCurrent;
      } else {
        return plCurrent.previous();
      }
    }
  };
})();
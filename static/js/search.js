var IMCoop = IMCoop || {};

IMCoop.search = (function() {
  /**
   * Private.
   */
  var addToPlaylistFn,
      displayResultsFn,
      searchResults,
      videoIds;

  addToPlaylistFn = function(evt) {
    evt.preventDefault();
    IMCoop.playlist.add(searchResults[this.parentNode.getAttribute('href').substr(1)]);
  };

  displayImageThumbs = function(evt) {
    // XXX: can't i use [].filter(fn)?

    var thPresent = false;
    var children = this.children
    var thumb = null;

    for(var i in children) {
      if(children[i].className == "thumbimg") {
        thPresent = true;
        thumb = children[i]
      }
    }

    var getImgs = function (x) { return [0,1,2,3].map(function(y) { return "http://img.youtube.com/vi/"+x+"/"+y+".jpg"})}

    thumbs = getImgs(this.getAttribute('href').substr(1));
    if(thPresent == false) {
      this.innerHTML += "<img class='thumbimg' src='"+thumbs[0]+"'>";
    } else {
      thumb.remove();
    }
  };

  /**
   * Loops through the current search results and displays them.
   */
  displayResultsFn = function(rows) {
    var html = '';

    videoIds = Object.keys(rows);
    searchResults = rows;

    videoIds.forEach(function(videoId) {
      var item = rows[videoId];
      html += IMCoopConfig.template.searchItem(item);
    });

    IMCoopConfig.el.searchResults.innerHTML = html;
  };

  alf.subscribe('youtube:loaded', function() {
    alf.event.on(IMCoopConfig.el.searchForm, 'submit', function(evt) {
      evt.preventDefault();
      IMCoop.youtube.search(this.term.value, displayResultsFn);
      return false;
    });

    alf.event.on(IMCoopConfig.el.searchResults, 'click', 'i', addToPlaylistFn);
    alf.event.on(IMCoopConfig.el.searchResults, 'click', 'a', displayImageThumbs);

    alf.dom.each(document.querySelectorAll('.show-on-load'), function(el) {
      el.classList.remove('show-on-load');
    });
  });

  alf.subscribe('youtube:startSearch', function(term) {
    IMCoopConfig.el.searchResults.innerHTML =
      IMCoopConfig.template.searching({ term: term });
  });

  /**
   * Public.
   */
  return {
  };
})();
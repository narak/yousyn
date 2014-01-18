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
    IMCoop.playlist.add(searchResults[this.getAttribute('href').substr(1)]);
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

    alf.event.on(IMCoopConfig.el.searchResults, 'click', 'a', addToPlaylistFn);

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
var IMCoop = IMCoop || {};

IMCoop.search = (function() {
  /**
   * Private.
   */
  var addToPlaylistFn,
      displayResultsFn,
      searchResults,
      videoIds,
      template;

  template = {
    item: alf.template('<li><a href="#{{=id}}">' +
        '<i class="fa fa-arrow-circle-o-left"></i> {{=snippet.title}}' +
        ' <span class="meta">{{=contentDetails.duration}}</span></a></li>')
  };


  addToPlaylistFn = function(evt) {
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
      html += template.item(item);
    });

    IMCoopConfig.el.searchResults.innerHTML = html;
  };

  alf.subscribe('youtube:loaded', function() {
    alf.event.on(IMCoopConfig.el.searchForm, 'submit', function(evt) {
      evt.preventDefault();
      IMCoop.youtube.search(this.value, displayResultsFn);
      return false;
    });

    alf.event.on(IMCoopConfig.el.searchResults, 'click', 'a', addToPlaylistFn);

    alf.dom.each(document.querySelectorAll('.show-on-load'), function(el) {
      el.classList.remove('show-on-load');
    });
  });

  /**
   * Public.
   */
  return {
  };
})();
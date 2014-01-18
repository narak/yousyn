var IMCoop = IMCoop || {};

IMCoop.youtube = (function() {
  /**
   * Private.
   */
  var searchFn,
      addToPlaylistFn,
      displayResultsFn,
      stripPTMSFn,
      params,
      atts,
      ytplayer,
      searchResults,
      videoIds;

  // Search for a specified string.
  searchFn = function(evt) {
    evt.preventDefault();
    gapi.client.youtube.search.list({
        q: IMCoopConfig.el.searchField.value,
        part: 'id,snippet',
        maxResults: 8,
        type: 'video',
        videoEmbeddable: 'true'
      })
      .execute(function(response) {
        videoIds = response.result.items.map(function(item) { return item.id.videoId; } );

        gapi.client.youtube.videos.list({
            part: 'id,snippet,contentDetails',
            id: videoIds.join(',')
          })
          .execute(function(contentResp) {
            searchResults = {};
            contentResp.result.items.forEach(function(itemCont) {
              itemCont.contentDetails.duration =
                stripPTMSFn(itemCont.contentDetails.duration);
              searchResults[itemCont.id] = itemCont;
            });
            displayResultsFn();
          });
      });
    return false;
  };

  addToPlaylistFn = function(evt) {
    IMCoop.playlist.add(searchResults(evt.target.getAttribute('href').substr(1)));
  };

  /**
   * Loops through the current search results and displays them.
   */
  displayResultsFn = function() {
    var html = '';
    if (videoIds instanceof Array) {
        videoIds.forEach(function(videoId) {
          var item = searchResults[videoId];
          html += '<li><a href="#' + videoId + '">' +
            '<i class="fa fa-arrow-circle-o-left"></i> ' + item.snippet.title +
            ' <span class="meta">' + item.contentDetails.duration + '</span></a></li>';
        });
        IMCoopConfig.el.searchResults.innerHTML = html;
    } else {
      throw new Error('Invalid search results. Expecting an array, dunno wtf else was returned. Youtube\'s a bastard.');
    }
  };

  /**
   * Turns the PT#M#S format to #:# format.
   * eg. PT15M20S to 15:20.
   */
  stripPTMSFn = function(str) {
    return str.replace(/P|T|S/g, '').replace(/M/,':').replace(/^(\d):/, '0$1:').replace(/:(\d)$/, ':0$1');
  };

  params = {
    allowScriptAccess: 'always'
  };
  atts = {
    id: 'myytplayer',
    styleclass: 'video-player'
  };

  window.onYouTubePlayerReady = function(playerId) {
    ytplayer = document.getElementById('myytplayer');
    //console.log(ytplayer.getDuration(), ytplayer.getCurrentTime());
  };

  swfobject.embedSWF('http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=ytplayer&version=3&controls=0&showinfo=0&rel=0',
                     'ytapiplayer', '160', '90', '8', null, null, params, atts);

  /**
   * Public.
   */
  return {
    // After the API loads, call a function to enable the search box.
    handleAPILoaded: function() {
      IMCoopConfig.el.searchForm.classList.remove('hide');
      IMCoopConfig.el.searchForm.addEventListener('submit', searchFn);
      IMCoopConfig.el.searchResults.addEventListener('click', addToPlaylistFn);

      var nodes = document.querySelectorAll('.show-on-load'),
          nLen = nodes.length;
      for (var i = 0; i < nLen; ++i) {
        nodes[i].classList.remove('show-on-load');
      }
    },
    play: function(item) {
      ytplayer.loadVideoById(item.id.videoId);
    }
  };
})();
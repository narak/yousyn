var IMCoop = IMCoop || {};

IMCoop.youtube = (function() {
  /**
   * Private.
   */
  var searchFn,
      stripPTMSFn,
      params,
      atts,
      ytplayer;

  // Search for a specified string.
  searchFn = function(term, callback) {
    // Search for the term.
    gapi.client.youtube.search.list({
        q: term,
        part: 'id',
        maxResults: 8,
        type: 'video',
        videoEmbeddable: 'true'
      })
      .execute(function(response) {
        videoIds = response.result.items.map(function(item) { return item.id.videoId; } );

        // Get details for all the search results.
        gapi.client.youtube.videos.list({
            part: 'id,snippet,contentDetails',
            id: videoIds.join(',')
          })
          .execute(function(contentResp) {
            var searchResults = {};
            contentResp.result.items.forEach(function(itemCont) {
              itemCont.contentDetails.duration =
                stripPTMSFn(itemCont.contentDetails.duration);
              searchResults[itemCont.id] = itemCont;
            });

            // Send indexed results back to callback.
            callback(searchResults);
          });
      });
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
    play: function(item) {
      ytplayer.loadVideoById(item.id.videoId);
    },
    search: searchFn
  };
})();
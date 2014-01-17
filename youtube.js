
var searchForm = document.getElementById('search-form');
searchForm.addEventListener('submit', search);

// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  searchForm.classList.remove('hide');
}

// Search for a specified string.
function search(evt) {
  evt.preventDefault();
  var q = $('#query').val();
  var request = gapi.client.youtube.search.list({
    q: q,
    part: 'id,snippet',
    maxResults: 8,
    type: 'video',
    videoEmbeddable: 'true'
  });

  request.execute(function(response) {
    var items = response.result.items,
        html = '';

    items.forEach(function(item) {
      console.log(item);
      html += '<a href="#" onclick="play(\'' + item.id.videoId + '\');">' + item.snippet.title + '</a><br>';
    });

    $('#search-container').html(html);
  });
  return false;
}

var params = {
  allowScriptAccess: 'always'
};
var atts = {
  id: 'myytplayer',
  styleclass: 'video-player'
};
swfobject.embedSWF('http://www.youtube.com/v/gnyhIp6dBgg?enablejsapi=1&playerapiid=ytplayer&version=3&controls=0&showinfo=0&rel=0',
                   'ytapiplayer', '160', '90', '8', null, null, params, atts);

function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById('myytplayer');
}

function play(videoId) {
  if (ytplayer) {
    ytplayer.loadVideoById(videoId);
  }
}
var elSeekBar = document.getElementById('seek-bar');

var IMCoopConfig = {
  playingClass: 'playing',
  broadcastActions: false,
  el: {
    login: document.getElementById('login-link'),
    playlist: document.querySelector('#playlist ul.list'),
    searchField: document.getElementById('query'),
    searchForm: document.getElementById('search-form'),
    searchResults: document.querySelector('#search-container ul.list'),

    btnRemoveAll: document.querySelector('#playlist .remove-all'),
    btnPlay: document.querySelector('#playlist .play'),
    btnPause: document.querySelector('#playlist .pause'),
    btnStop: document.querySelector('#playlist .stop'),
    btnNext: document.querySelector('#playlist .next-track'),
    btnPrevious: document.querySelector('#playlist .previous-track'),
    btnRandom: document.querySelector('#playlist .random'),
    btnRepeat: document.querySelector('#playlist .repeat'),

    seekBar: elSeekBar.querySelector('input'),
    elapsedTime: elSeekBar.querySelector('.elapsedTime'),
    duration: elSeekBar.querySelector('.duration')
  },
  template: {
    searching: alf.template('<li style="padding: .4rem .8rem">Searching for {{=term}}...</li>'),

    searchItem: alf.template('<li><a href="#{{=videoId}}">' +
        '<i class="fa fa-plus"></i> {{=title}}' +
        ' <span class="meta">{{=duration}}</span></a></li>'),

    playlistItem: alf.template('<li><a href="#{{=videoId}}" class="play">' +
        '<i class="fa fa-play"></i> {{=title}} ' +
        '<span class="meta">{{=duration}}</span>' +
        '</a>' +
        '<span class="actions"><a href="#{{=videoId}}" class="remove"><i class="fa fa-times"></i></a></span></li>')
  }
};
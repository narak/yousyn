var IMCoop = IMCoop || {};

(function() {
  IMCoop.auth = {};

  // The client ID is obtained from the Google Cloud Console
  // at https://cloud.google.com/console.
  // If you run this code from a server other than http://localhost,
  // you need to register your own client ID.
  var OAUTH2_CLIENT_ID = '202238732462-6qak38uign58vk5o0v2qt15je03830q4.apps.googleusercontent.com',
      OAUTH2_SCOPES = [
        'profile',
        'https://www.googleapis.com/auth/youtube'
      ];


  // Upon loading, the Google APIs JS client automatically invokes this callback.
  IMCoop.auth.googleApiClientReady = function() {
    gapi.auth.init(function() {
      window.setTimeout(checkAuth, 1);
    });
  }

  // Attempt the immediate OAuth 2.0 client flow as soon as the page loads.
  // If the currently logged-in Google Account has previously authorized
  // the client specified as the OAUTH2_CLIENT_ID, then the authorization
  // succeeds with no user intervention. Otherwise, it fails and the
  // user interface that prompts for authorization needs to display.
  var checkAuth = function() {
    gapi.auth.authorize({
      client_id: OAUTH2_CLIENT_ID,
      scope: OAUTH2_SCOPES,
      immediate: true
    }, handleAuthResult);
  }

  // Handle the result of a gapi.auth.authorize() call.
  var handleAuthResult = function(authResult) {
    var loginLink = document.getElementById('login-link');
    if (authResult) {
      loginLink.remove();
      loadAPIClientInterfaces();
    } else {
      loginLink.classList.remove('show-on-load');
      // Make the #login-link clickable. Attempt a non-immediate OAuth 2.0
      // client flow. The current function is called when that flow completes.
      alf.event.on(loginLink, 'click', function(evt) {
        evt.preventDefault();
        gapi.auth.authorize({
          client_id: OAUTH2_CLIENT_ID,
          scope: OAUTH2_SCOPES,
          immediate: false
          }, handleAuthResult);
      });
    }
  }

  // Load the client interfaces for the YouTube Analytics and Data APIs, which
  // are required to use the Google APIs JS client. More info is available at
  // http://code.google.com/p/google-api-javascript-client/wiki/GettingStarted#Loading_the_Client
  var loadAPIClientInterfaces = function() {
    gapi.client.load('youtube', 'v3', function() {
      alf.publish('youtube:loaded');
    });
  }
})();
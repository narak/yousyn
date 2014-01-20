module.exports = {
    rootUrlPath: '/karan',
    defaultRoom: 'Idvc Music',
    port: 8000,
    transports: ["websocket", "htmlfile", "xhr-polling", "jsonp-polling"],
    poll_duration: 20,
    log_level: 1,
    viewPath: 'views/',
    validUrlVars: '[A-Za-z0-9_.-\/]+'
};

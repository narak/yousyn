module.exports = {
    rootUrlPath: '/yousyn',
    defaultRoom: 'Idvc Music',
    port: 2370,
    transports: ["websocket", "htmlfile", "xhr-polling", "jsonp-polling"],
    poll_duration: 20,
    log_level: 1,
    viewPath: 'views/',
    validUrlVars: '[A-Za-z0-9_.-]+'
};

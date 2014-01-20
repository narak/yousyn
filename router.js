/**
 * Router module.
 */
var config = require('./config'),
    urlLib = require('url'),
    http = require('http'),
    fs = require('fs'),
    dust = require('dustjs-linkedin'),
    dive = require('dive'),
    path = require('path'),
    routes = {
        get: {},
        post: {}
    },
    varRoutes = {
        get: [],
        post: []
    };

// Set up a base context with a global helper function
var base = dust.makeBase(config);

/**
 * Compile dust templates.
 */
dive(config.viewPath, {
    all: false,
    directories: false,
    files: true,
    recursive: true
}, function(err, file) {
    if (err) throw err;

    var filename, ext;
    ext = path.extname(file);
    if (ext === '.dust') {
        filename = path.basename(file, '.dust');

        fs.readFile(file, function(err, data) {
            if (err) {
                throw err;
            } else {
                dust.loadSource(dust.compile(data.toString(), filename));
                console.log('Compiling template: ' + filename);
            }
        });
    }
});

/**
 * Extending http response object to be able to send view files.
 */
http.ServerResponse.prototype.sendView = function(view, tplVars) {
    var res = this;
    dust.render(view, base.push(tplVars)config.js, function(err, out) {
        if (err) {
            console.error(err);
        } else {
            res.end(out);
        }
    });
};

/**
 * The function that is passed to the server. This function is called
 * everytime a response is received so it is responsible for handing over the
 * control to appropriate router callback.
 */
exports.router = function(req, res) {
    var path = urlLib.parse(req.url).pathname,
        method = req.method.toLowerCase(),
        params = {},
        matches, handle;

    if (config.rootUrlPath) {
        if (path.indexOf(config.rootUrlPath) === 0) {
            path = path.substring(config.rootUrlPath.length);
            handle = getCallback(method, path);
        }
    } else {
        handle = getCallback(method, path);
    }

    if (handle) {
        console.log(new Date().toString() + ' ' + method + ' ' + path, req.body);
        if (handle.re) {
            matches = path.match(handle.re);
            // Skip the first param match.
            for (var i = 1, len = matches.length; i < len; i++) {
                params[handle.params[i-1]] = matches[i];
            }
        }
        req.params = params;
        handle.callback(req, res);

    } else {
        console.log(new Date().toString() + ' ' + method + ' 404 ' + path, req.body);
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write("<h1>Oops, looks like the page you're trying to exist doesn't access...</h1>\n");
        res.end();
    }
};

    /**
     * Find the handler for the route.
     */
var getCallback = function(method, path) {
        var handle;
        if (routes[method][path]) {
            handle = routes[method][path];
        } else {
            for (var i=0, len=varRoutes[method].length; i < len; i++) {
                if (varRoutes[method][i].re.test(path)) {
                    handle = varRoutes[method][i];
                    break;
                }
            }
        }
        return handle;
    },

    /**
     * Validate route parameters.
     */
    reValidUrl = new RegExp('^[a-zA-Z0-9/_{}]*$'),
    validateRoutingParams = function(method, path, callback) {
        if (!path || !callback) {
            throw new Error('Missing path or callback for adding route.');
        }
        if (typeof callback !== 'function') {
            throw new Error('Invalid callback for path.');
        }
        if (typeof path !== 'string'/* && !(path instanceof RegExp)*/) {
            throw new Error('Invalid path type.');
        }
        if (typeof path === 'string' && !reValidUrl.test(path)) {
            throw new Error('Invalid path format:' + path);
        }
    },

    /**
     * Remember the route.
     */
    reUrlVars = /\{[^\}]+\}/g,
    escapeRegExp = function(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    addRoute = function(method, path, callback) {
        try {
            validateRoutingParams.apply(this, arguments);
        } catch(e) {
            console.error(e);
        }
        console.log('Adding ' + method.toUpperCase() + ' route ' + path);
        method = method.toLowerCase();

        var matches;
        if (matches = path.match(reUrlVars)) {
            // Time to go to the dentist... to take those braces off... >.>
            matches = matches.map(function(d) {
                return d.substring(1, d.length-1);
            });

            varRoutes[method].push({
                re: new RegExp('^' + escapeRegExp(path.replace(reUrlVars, '\t'))
                    .replace(/\t/g, '(' + config.validUrlVars + ')') + '$'),
                callback: callback,
                params: matches
            });

        } else {
            routes[method][path] = {
                re: null,
                callback: callback
            };
        }
    };

exports.get = function(path, callback) {
    addRoute('get', path, callback);
};

exports.post = function(path, callback) {
    addRoute('post', path, callback);
};

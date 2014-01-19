/**
 * Socket module.
 */

var redis = require('redis');

var socksByUser = {},
    socksForUser = {},
    rcBySock = {};

exports.doSocket = function(socket) {
    socket.on('join', function(user_id, ack) {
        socksForUser[socket.id] = user_id;
        if (!socksByUser[user_id]) socksByUser[user_id] = [];
        socksByUser[user_id].push(socket);
        console.log(user_id + ' connected. Count: ' + socksByUser[user_id].length);
        ack(true);
    });

    socket.on('disconnect', function() {
        var user_id = socksForUser[socket.id],
            socks = socksByUser[user_id];

        if (socks && socks instanceof Array) {
            console.log(user_id + ' disconnected.');

            // Remove the socket from the list of sockets associated with this
            // particular user id.
            socks.forEach(function(sock, index) {
                if (sock.id === socket.id) {
                    socks.splice(index, 1);
                }
            });
        }

        // Disconnect the redis client and unsubscribe its channel.
        if (rcBySock[socket.id]) {
            rcBySock[socket.id].client.unsubscribe(rcBySock[socket.id].channel);
            rcBySock[socket.id].client.quit();
            delete rcBySock[socket.id];
        }
    });

    socket.on('subscribe', function(channel, ack) {
        console.log(arguments);
        // redis.createClient(PORT, HOST, options)
        var rc = redis.createClient();
        rc.subscribe(channel);

        // Save the socket and the channel so it can be safely removed on disconnection.
        rcBySock[socket.id] = {
            channel: channel,
            client: rc
        };

        rc.on("message", function(channel, payload) {
            console.log("Recieved publish: ", channel, payload);
            socket.emit(channel, payload)
        });
        ack(true);
    });
};

exports.isConnected = function(user_id) {
    return !!socksByUser[user_id];
};

exports.push = function(user_id, message) {
    debugger;
    if (exports.isConnected(user_id)) {
        console.log('Pushing message "' + message + '" to ' + user_id);
        socksByUser[user_id].forEach(function(socket) {
            socket.emit('message', message);
        });
    } else {
        console.log('No socket found for push message "' + message + '" to ' + user_id);
    }
};

exports.pushIncomingCall = function(from_user_id, user_id, phone, call_id) {
    if (exports.isConnected(user_id)) {
        console.log('Incoming call from ' + phone + '(' + from_user_id + ') to ' + user_id);
        socksByUser[user_id].forEach(function(socket) {
            socket.emit('incoming_call', from_user_id, phone, call_id);
        });
    } else {
        console.log('No socket found for incoming call from ' + phone + '(' + from_user_id + ') to ' + user_id);
    }
};
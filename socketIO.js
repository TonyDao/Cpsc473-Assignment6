/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app).listen(8080);
    io = require('socket.io').listen(server),
    request = require('request');

console.log('Socket listening on port 3001');

//initualize users and socket connections
var users =[],
    connections = [];

//option for http request
var getOption = function(path) {
	'use strict';
    var option = {
        uri: 'http://localhost:3000' + path,
        method: 'GET',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        }
    }; 
    return option;
};

var postOption = function (path, data) {
	'use strict';
    var option = {
        uri: 'http://localhost:3000' + path,
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        json: data
    }; 
    return option;
};

//socket io connection
io.sockets.on('connection', function(socket){
	'use strict';
    //connect client socket
    connections.push(socket);
    console.log('Connected sockets: %s', connections.length);
    
    //get new user
    socket.on('new user', function(data) {
        socket.username = data;
        //push new user
        users.push(socket.username);
        //update new user has connected
        io.sockets.emit('get users', users);
    });

    //get new question
    socket.on('get question', function() {
        request(getOption('/question'), function(err, res, body){
            if(err) {
                console.log(err);
            } else {
                //send new question to all clients
                io.sockets.emit('new question', JSON.parse(body));
            }
        });
    });

    //get answer from client
    socket.on('answer', function(data) {
        console.log(JSON.stringify(data));

        request(postOption('/answer', data), function(err, res, body) {
            if(err) {
                console.log(err);
            } else {
                //add user answer the question to body
                body.answerer = socket.username.username;

                //send the answer to user have send to server
                io.sockets.emit('check answer', body);
            }
        });
    });

    //update score
    socket.on('score', function() {
        var jsonData;
        request(getOption('/score'), function(err, res, body) {
            if (err) {
                console.log(err);
            } else {
                //send update score to all users
                jsonData = JSON.parse(body);
                console.log(jsonData);
                console.log(jsonData.right);
                io.sockets.emit('update score', JSON.parse(body));
            }            
        });
    });

    //disconnect
    socket.on('disconnect', function() {
        //disconnect user
        users.splice(users.indexOf(socket.username),1);
        console.log('Disconnect socket: %s', socket.username);

        //update list of users on client side
        io.sockets.emit('get users', users);

        //disconnect socket
        connections.splice(connections.indexOf(socket), 1);
        console.log('Connected sockets: %s', connections.length);
    });
});

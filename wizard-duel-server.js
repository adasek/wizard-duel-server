var net = require('net');
const Session = require('./model/Session');

var server = net.createServer(Session.create);

server.listen(9080, function () {
    console.log('server started');
});
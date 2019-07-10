var net = require('net');
const Session = require('./model/Session');

var server = net.createServer(Session.create);

server.listen(9080, "0.0.0.0", function () {
    console.log('server started');
});
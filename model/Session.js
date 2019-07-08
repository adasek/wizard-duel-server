const crypto = require('crypto');

class Session {
    constructor(connection) {
        this.receivedData = "";

        this.id = crypto.randomBytes(20).toString('hex');

        this.msgNum = 0;

        // connection is open
        this.active = false;

        this.bindConnection(connection);
    }

    bindConnection(connection) {
        this.connection = connection;
        //Init 
        this.connection.setEncoding('utf8');

        this.connection.on('end', this.unbindConnection.bind(this));
        this.connection.on('data', this.dataRead.bind(this));
        this.active = true;
    }
    ;
            unbindConnection() {
        this.active = false;
    }

    dataRead(msg) {
        this.receivedData += msg;

        //parse first json found
        //{...blabla{}...}
        var parseResult = Session.getFirstJson(this.receivedData);
        while (parseResult[0] !== null) {
            this.receivedData = parseResult[1];
            // json was parsed, do something with it
            var messageObject = parseResult[0];
            this.useMessage(messageObject);

            // parse next json (msg)
            parseResult = Session.getFirstJson(this.receivedData);
        }
    }
    ;
            useMessage(messageObject) {
        switch (messageObject.type) {
            case 'rejoinSession':

            case 'ping':
                this.send('pong');
                break;
            case 'parseError':
                this.send('error', {errorType: 'parseError'});
                break;
            default:
                this.send('error', {errorType: 'unknownMessage'});
        }
    }

    send(type, data) {
        var msg = {};
        msg.time = Date.now();
        msg.sessionId = this.id;
        msg.msgNum = this.msgNum++;
        msg.type = type;

        for (var key in data) {
            msg[key] = data[key];
        }
        this.connection.write(JSON.stringify(msg));
        this.connection.write('\r\n');
    }

    sendHello() {
        this.send("hello", {'motd': 'May the force be with you'});
    }
}

Session.getFirstJson = function (str) {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        switch (str[i]) {
            case '{':
                depth++;
                break;
            case '}':
                if (--depth === 0) {
                    //found json from 0 to i
                    var msgObj = {}
                    try {
                        msgObj = JSON.parse(str.substring(0, i + 1))
                    } catch (e) {
                        msgObj = {'type': 'parseError'}
                    }
                    return [msgObj, str.substring(i + 1)];
                }
        }
    }
    return [null, str];
};

Session.create = function (c) {
    var session = new Session(c);


    session.sendHello();
};

module.exports = Session;

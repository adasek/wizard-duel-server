const crypto = require('crypto');

class Session {
    constructor(connection) {
        this.receivedData = "";
        this.connection = connection;

        this.id = crypto.randomBytes(20).toString('hex');

        this.msgNum = 0;
    }

    useMessage(messageObject) {
        if (messageObject.type === "ping") {
            //write back pong
            this.send("pong");

        } else {
            //write back err   
            this.send("err");
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
        this.send("hello", {'motd':'May the force be with you'});
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
                    return [JSON.parse(str.substring(0, i + 1)), str.substring(i + 1)];
                }
        }
    }
    return [null, str];
};

Session.create = function (c) {
    var session = new Session(c);
    c.setEncoding('utf8');

    c.on('end', function () {
        console.log('connection/socket closed');
    });
    c.on('data', function (msg) {
        session.receivedData += msg;

        //parse first json found
        //{...blabla{}...}
        var parseResult = Session.getFirstJson(session.receivedData);
        while (parseResult[0] !== null) {
            session.receivedData = parseResult[1];
            // json was parsed, do something with it
            var messageObject = parseResult[0];
            session.useMessage(messageObject);

            // parse next json (msg)
            parseResult = Session.getFirstJson(session.receivedData);

        }
    });

    session.sendHello();
};

module.exports = Session;

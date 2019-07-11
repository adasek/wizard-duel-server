const crypto = require('crypto');

const SessionList = require('./SessionList');
const GameSession = require('./GameSession');
const Player = require('./Player');


class Session {
    constructor(connection) {
        this.receivedData = "";

        this.id = crypto.randomBytes(20).toString('hex');
        SessionList.registerSession(this);

        this.msgNum = 0;


        // connection is open
        this.active = false;

        this.bindConnection(connection);

        this.msgQueue = [];

        this.gameSession = null;
        //temporary:
        setTimeout(this.createGameSession.bind(this, 'demo'), 3000);
    }

    async createGameSession(modeName) {
        this.gameSession = await GameSession.create({'player': this.getPlayer(), 'session': this, 'gameMode': {'name': modeName}});
    }

    //gets Player associated with this session
    getPlayer() {
        if (this.player) {
            return this.player;
        }
        this.player = Player.playerList.random();
        return this.player;
    }

    useMessage(messageObject) {
        switch (messageObject.type) {
            case 'rejoinSession':
                this.rejoinSession(messageObject);
                break;
            case 'ping':
                this.send('pong');
                break;
            case 'spellCast':
                this.gameSession.spellCast(this.getPlayer(), messageObject, this.send.bind(this));
                break;
            case 'spellsSelected':
                this.gameSession.spellsSelected(this.getPlayer(), messageObject, this.send.bind(this));
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

        while (this.msgQueue.length > 0) {
            var oldMsg = this.msgQueue.shift();
            if (!this._send(oldMsg)) {
                //unable to send first msg from queue
                this.enqueueMessage(msg);
                return;
            }
        }

        this._send(msg);
    }

    _send(msg) {
        if (!this.active) {
            this.enqueueMessage(msg);
            return false;
        }
        try {
            this.connection.write(JSON.stringify(msg));
            this.connection.write('\r\n');
        } catch (e) {
            //connection lost?
            console.warn(e);
            this.unbindConnection();
            this.enqueueMessage(msg);
            return false;
        }
        return true;
    }

    enqueueMessage(msg) {
        this.msgQueue.push(msg);
    }

    sendHello() {
        this.send("hello", {'motd': 'May the force be with you'});
    }

    rejoinSession(messageObject) {
        if (typeof (messageObject.sessionId) !== 'string') {
            return this.send("error", {errorType: 'sessionId not present'});
        }
        var session = SessionList.findSession(messageObject.sessionId);
        if (session === null) {
            return this.send("error", {errorType: 'session does not exist'});
        }
        if (session.active) {
            return this.send("error", {errorType: 'session is active'});
        }
        var connection = this.connection;
        this.unbindConnection();
        SessionList.unregisterSession(this);

        session.bindConnection(connection);

        session.send("sessionRejoined");
    }

    bindConnection(connection) {
        this.connection = connection;
        //Init 
        this.connection.setEncoding('utf8');

        this.connection.on('end', this.unbindConnection.bind(this));
        this.connection.on('data', this.dataRead.bind(this));
        this.active = true;
    }

    unbindConnection() {
        this.active = false;
        this.connection.removeListener('end', this.unbindConnection.bind(this));
        this.connection.removeListener('data', this.dataRead.bind(this));
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
            console.log(messageObject);
            this.useMessage(messageObject);
            // parse next json (msg)
            parseResult = Session.getFirstJson(this.receivedData);
        }
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
                        console.warn(e)
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

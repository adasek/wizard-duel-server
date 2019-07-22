/**
 * GameSession is one instance of game for 1,2 or more players.
 * It consists of Turns with specified maximal lengths
 * Turns have different types and may be assymetrical to players
 * Structure is specified by GameMode
 *
 */
const crypto = require('crypto');
const Player = require('./Player');
//loading svg
const fs = require('fs');
const util = require('util');
const atob = require('atob');

class GameSession {
    constructor(opts) {
        this.opts = opts;

        this.players = [];

        this.state = 'init';
        this.setPreparedSpellsAmount(1);

        this.spellBook = null;
        setTimeout(this.getAllSpells.bind(this), 0);

        this.id = crypto.randomBytes(20).toString('hex');
    }

    slugify(s) {
        s = s.replace(GameSession._slugify_strip_re, '').trim().toLowerCase();
        s = s.replace(GameSession._slugify_hyphenate_re, '-');
        s = s.toLowerCase();
        return s;
    }

    async getAllSpells() {
        if (this.spellBook !== null) {
            return this.spellBook;
        }

        var spellsArray = [{
                name: 'Protego',
                amount: 2,
                type: 'defense'
            }, {
                name: 'Lumos',
                amount: 2,
                type: 'util'
            }, {
                name: 'Kal Vas Flam',
                amount: 2,
                type: 'attack'
            }];
        // todo: load spells from spellbook.json
        // todo: amount based on the GameMode

        //var names = ['Protego', 'Lumos', 'Wingardium Leviosa', 'Kal Vas Flam', 'Imperius', 'Reparo'];
        //var types = ['defense', 'support', 'support', 'attack', 'attack', 'support'];
        const readFile = util.promisify(fs.readFile);

        //generate ids from names
        for (var spell of spellsArray) {
            spell['id'] = this.slugify(spell['name']);
        }

        // load files
        for (var spell of spellsArray) {
            var svgContent = await readFile('spells/' + spell['id'] + ".svg");
            spell.svg = atob(svgContent);
        }

        this.spellBook = spellsArray;
        return spellsArray;
    }

    modeName() {
        return this.opts.gameMode.name;
    }

    send(msgType, data) {
        throw "old send function";
        if (msgType === 'prepareSpells') {
            this.state = 'prepareSpells';
        }
        if (msgType === 'turnStart') {
            this.state = 'turn';
        }
        return this.session.send(msgType, data);
    }

    sendToAllPlayers(msgType, data) {
        //presumes all players are defined
        for (const playerInstance of this.players) {
            this.sendTo(playerInstance, msgType, data);
        }
    }
    sendTo(playerInstance, msgType, data) {

        if (process.argv.indexOf('-d') >= 0) {
            console.log("Sending msg=" + msgType + " to " + playerInstance.id);
            console.log(JSON.stringify(data, ["spells", "type", "name", "spell", "type", "errorType", "error", "players", "defense", "life", "lifeChange"], 1));
        }
        return playerInstance.session.send(msgType, data);
    }

    //{type:'spellCast',spellId:'protego', time_elapsed_complete:1700, time_elapsed_spell:700, accuracy:0.91}
    spellCast(player, opts, callback) {
        //todo: check if spellId agrees with spellsSelectedArray
        var spell = this.findSpell(opts.spellId);
        if (spell === null) {
            return;
        }

        var amount = Math.round(5 * opts.accuracy) / 10;

        if (spell.type === "attack") {
            console.log(player.name + '⚡' + amount);
        } else if (spell.type === "defense") {
            console.log(player.name + '💧' + amount);
        }
        //find playerInstance of givenPlayer
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                //me
                if (spell.type === "attack") {
                    //nothing to do with me
                } else if (spell.type === "defense") {
                    this.players[i].defense = amount;
                }
            } else {
                //oponent of me (for 2 game)
                if (spell.type === "attack") {
                    this.players[i].beHit(amount);
                }
            }
        }
    }

    findSpell(spellId) {
        if (this.spellBook === null) {
            throw "SpellBook not loaded";
        }
        for (const spell of this.spellBook) {
            if (spell['id'] === spellId) {
                return spell;
            }
        }

        return null;
    }

    //{type:'spellsSelected',spells:['protego','kal_vas_flam',null,null,'protego']}
    spellsSelected(player, opts, callback) {
        if (this.state !== "prepareSpells") {
            return callback("error", {msg: 'notInPrepareSpellsState'});
        }
        if (opts.spells.length !== this.getPreparedSpellsAmount(player)) {
            return callback("error", {msg: 'badNumberOfSpells'});
        }
        for (var i = 0; i < this.getPreparedSpellsAmount(player); i++) {
            //find spell by id
            this.preparedSpells[player.id][i] = this.findSpell(opts.spells[i]);
        }
    }

    setPreparedSpellsAmount(num) {
        this.preparedSpells = {};
        for (const player of this.players) {
            this.preparedSpells[player.id] = [];
            for (var i = 0; i < num; i++) {
                this.preparedSpells[player.id].push(null);
            }
        }
    }

    getPreparedSpellsAmount(player) {
        return this.preparedSpells[player.id].length;
    }

    setPlayers(n) {
        this.players = [];
        for (var i = 0; i < n; i++) {
            this.players.push(null);
        }
    }

    addPlayer(player) {
        if (player.session === null) {
            throw "addPlayer without session";
        }
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i] === null) {
                this.players[i] = player;
                return true;
            }
        }
        return false;
    }

    needsPlayers() {
        return (this.players.indexOf(null) >= 0);
    }

    // Bind communication session to this GameSession
    join(session) {
        var playerInstance = session.getPlayer().createInstance();
        playerInstance.session = session;
        session.gameSession = this;
        console.log("binding gameSession " + this.id + " to session " + session.id);
        this.addPlayer(playerInstance);
    }

    getPreparedSpell(player, i) {
        return this.preparedSpells[player.id][i];
    }

}

GameSession.create = async function (session, opts) {
    var gameSession = new GameSession(opts);
    await gameSession.getAllSpells();

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    _session = session;
    //async
    setTimeout(async function () {
        if (gameSession.modeName() === 'demo') {
            //dummy doll: todo fix
        } else if (gameSession.modeName() === 'duel') {
            gameSession.setPlayers(2);

            gameSession.join(_session);

            //wait for other player to join
            while (gameSession.needsPlayers()) {
                await sleep(200);
            }

            while (true) {
                gameSession.players.map(function (playerInstance) {
                    !playerInstance || playerInstance.restartTurn();
                });
                //init selected spells
                const spellAmount = 5;
                gameSession.setPreparedSpellsAmount(spellAmount);
                gameSession.sendToAllPlayers("prepareSpells", {"spells": gameSession.spellBook, "spellsAmount": spellAmount, "timeout": 10000, players: gameSession.players});
                gameSession.state = "prepareSpells";

                await sleep(15000);
                for (var i = 0; i < spellAmount; i++) {
                    gameSession.players.map(function (playerInstance) {
                        !playerInstance || playerInstance.restartTurn();
                    });
                    for (const player of gameSession.players) {
                        gameSession.sendTo(player, "turnStart", {spell: gameSession.getPreparedSpell(player, i), "timeout": 5000, players: gameSession.players});
                        gameSession.state = "turn";
                    }
                    await sleep(5000);
                    for (const player of gameSession.players) {
                        gameSession.sendTo(player, "turnEnd", {players: gameSession.players});
                    }
                    await sleep(5000);
                }
            }
        }
    }, 0);

    GameSession.list[gameSession.id] = gameSession;
    return gameSession;
};

GameSession._slugify_strip_re = /[^\w\s-]/g;
GameSession._slugify_hyphenate_re = /[-\s]+/g;

GameSession.list = {};

module.exports = GameSession;

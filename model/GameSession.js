/**
 * GameSession is one instance of game for 1,2 or more players.
 * It consists of Turns with specified maximal lengths
 * Turns have different types and may be assymetrical to players
 * Structure is specified by GameMode
 *
 */
const crypto = require('crypto');
const Player = require('./Player');
const Spell = require('./Spell');
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

    async getAllSpells() {
        if (this.spellBook !== null) {
            return this.spellBook;
        }

        var spellsArray = [new Spell({
                name: 'Protego',
                amount: 2,
                type: 'defense'
            }), new Spell({
                name: 'Episkey',
                amount: 1,
                type: 'util'
            }), new Spell({
                name: 'Reparo',
                amount: 2,
                type: 'util'
            }), new Spell({
                name: 'Kal Vas Flam',
                amount: 2,
                type: 'attack'
            }), new Spell({
                name: 'Expelliarmus',
                amount: 1,
                type: 'util'
            }), new Spell({
                name: 'Accio',
                amount: 2,
                type: 'util'
            }), new Spell({
                name: 'Reducto',
                amount: 1,
                type: 'attack'
            }), new Spell({
                name: 'Petrificus Totalus',
                amount: 1,
                type: 'util'
            })];
        // todo: load spells from spellbook.json
        // todo: amount based on the GameMode

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
        console.log(player.name + " sesílá " + opts.spellId + " přesnost " + opts.accuracy + (opts.penalty > 0 ? ", penalty " + opts.penalty : ""));

        //todo: check if spellId agrees with spellsSelectedArray
        var spell = this.findSpell(opts.spellId);
        if (spell === null) {
            return;
        }

        //am I stunned?
        if (player.stunned > 0) {
            //sorryjako
            player.stunned--;
            return;
        }

        var instanceRandom = Math.random();
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                //me
                spell.applyToPlayerInstance(this.players[i], {accuracy: opts.accuracy, penalty: opts.penalty, instanceRandom: instanceRandom, oponent: false});
            } else {
                //opponent
                spell.applyToPlayerInstance(this.players[i], {accuracy: opts.accuracy, penalty: opts.penalty, instanceRandom: instanceRandom, oponent: true});
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
        console.log(player.name + " vybírá :" + opts.spells);
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

    async sessionEnd() {
        var living = [];
        var dead = [];
        for (const player of this.players) {
            if (player.life > 0) {
                living.push(player);
            } else {
                dead.push(player);
            }
        }
        console.log("Konec hry. Vyhral " + living.map(x => x.name));
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].life > 0) {
                this.players[i].winner = true;
            } else {
                this.players[i].winner = false;
            }
        }

        this.sendToAllPlayers('sessionEnd', {players: this.players});

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        sleep(3000);
        this.disconnectAll();
    }
    disconnectAll() {
        for (const player of this.players) {
            player.session.disconnect();
        }
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

            session:
                    while (true) {
                gameSession.players.map(function (playerInstance) {
                    !playerInstance || playerInstance.restartTurn();
                });
                //init selected spells
                const spellAmount = 3;
                gameSession.setPreparedSpellsAmount(spellAmount);
                for (const player of gameSession.players) {
                    gameSession.sendTo(player, "prepareSpells", {"spells": player.filterSpellBook(gameSession.spellBook), "spellsAmount": spellAmount, "timeout": 20000, players: gameSession.players});
                }
                gameSession.state = "prepareSpells";

                await sleep(20300);
                for (var i = 0; i < spellAmount; i++) {
                    gameSession.players.map(function (playerInstance) {
                        !playerInstance || playerInstance.restartTurn();
                    });
                    console.log("nové kolo...");
                    for (const player of gameSession.players) {
                        var spell = gameSession.getPreparedSpell(player, i);
                        console.log(player.name + " kouzlí " + (spell ? spell.name : "[nic]"));
                        gameSession.sendTo(player, "turnStart", {spell: spell, "timeout": 7000, players: gameSession.players});
                        gameSession.state = "turn";
                    }
                    await sleep(7000);
                    for (const player of gameSession.players) {
                        gameSession.sendTo(player, "turnEnd", {players: gameSession.players});
                    }
                    console.log("...konec kola");
                    for (const player of gameSession.players) {
                        process.stdout.write(player.name + ":" + player.life + " ");
                    }
                    console.log();
                    await sleep(1000);

                    for (const player of gameSession.players) {
                        if (player.life <= 0) {
                            gameSession.sessionEnd();
                            break session;
                        }
                    }
                }

            }
        }
    }, 0);

    GameSession.list[gameSession.id] = gameSession;
    return gameSession;
};

GameSession.list = {};

module.exports = GameSession;

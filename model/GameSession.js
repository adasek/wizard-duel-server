/**
 * GameSession is one instance of game for 1,2 or more players.
 * It consists of Turns with specified maximal lengths
 * Turns have different types and may be assymetrical to players
 * Structure is specified by GameMode
 * 
 */

//loading svg
const fs = require('fs');
const util = require('util');
const atob = require('atob');

class GameSession {
    constructor(opts) {
        this.opts = opts;
        //this.opts.gameMode.name
    }

    //Temporary to be moved into GameSession
    async getAllSpells() {

        var spells = [{
                name: 'protego',
                amount: 2,
                type: 'defense'
            }, {
                name: 'lumos',
                amount: 2,
                type: 'util'
            }, {
                name: 'kal_vas_flam',
                amount: 2,
                type: 'attack'
            }];
        // todo: load spells from spellbook.json
        // todo: amount based on the GameMode

        //var names = ['Protego', 'Lumos', 'Wingardium Leviosa', 'Kal Vas Flam', 'Imperius', 'Reparo'];
        //var types = ['defense', 'support', 'support', 'attack', 'attack', 'support'];
        const readFile = util.promisify(fs.readFile);

        for (var spell of spells) {
            var svgContent = await readFile('spells/' + spell['name'] + ".svg");
            spell.svg = atob(svgContent);
        }

        return spells;
    }

    modeName() {
        return this.opts.gameMode.name;
    }

    send(msgType, data) {
        return this.opts.session.send(msgType, data);
    }
}

GameSession.create = async function (opts) {
    var gameSession = new GameSession(opts);

    var allSpells = await gameSession.getAllSpells();
    if (gameSession.modeName() === 'demo') {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        //start game session

        gameSession.send("prepareSpells", {"spells": allSpells, "spellsAmount": 5, "timeout": 5000});
        while (true) {
            await sleep(5000);
            gameSession.send("turnStart", {spell: allSpells[Math.round(Math.random() * 6)]});
        }
    }
    return gameSession;
};

module.exports = GameSession;

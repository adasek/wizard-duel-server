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

        this.state = 'init';
        this.setPreparedSpellsAmount(1);

        this.spellBook = null;
        setTimeout(this.getAllSpells.bind(this), 0);
    }

    slugify(s) {
        s = s.replace(GameSession._slugify_strip_re, '').trim().toLowerCase();
        s = s.replace(GameSession._slugify_hyphenate_re, '-');
        s = s.toLowerCase();
        return s;
    }

    async getAllSpells() {
        if (this.spellBook != null) {
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
        if (msgType === 'prepareSpells') {
            this.state = 'prepareSpells';
        }
        if (msgType === 'turnStart') {
            this.state = 'turn';
        }
        return this.opts.session.send(msgType, data);
    }

    //{type:'spellCast',spellId:'protego', time_elapsed_complete:1700, time_elapsed_spell:700, accouracy:0.91}
    spellCast(opts, callback) {
        //todo: check if spellId agrees with spellsSelectedArray
        var spell = this.findSpell(opts.spellId);

        var amount = 50 * opts.accuracy;
        if (spell.type == "atack") {
            this.oponentLifeChange = -amount;
            this.oponentLife -= amount;
        } else if (spell.type == "defense") {
            this.playerLifeChange = -(50 - amount);
            this.playerLife -= (50 - amount);
        } else {
            //no func yet

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
    spellsSelected(opts, callback) {
        if (this.state !== "prepareSpells") {
            return callback("error", {msg: 'notInPrepareSpellsState'});
        }
        if (opts.spells.length !== this.prepareSpellsNum) {
            return callback("error", {msg: 'badNumberOfSpells'});
        }
        for (var i = 0; i < this.prepareSpellsArray.length; i++) {
            //find spell by id
            this.prepareSpellsArray[i] = this.findSpell(opts.spells[i]);
        }
    }

    setPreparedSpellsAmount(num) {
        this.prepareSpellsNum = num;
        this.prepareSpellsArray = [];
        for (var i = 0; i < num; i++) {
            this.prepareSpellsArray.push(null);
        }
    }
}

GameSession.create = async function (opts) {
    var gameSession = new GameSession(opts);
    await gameSession.getAllSpells();

    //async
    setTimeout(async function () {
        if (gameSession.modeName() === 'demo') {
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            while (true) {
                //init selected spells
                gameSession.setPreparedSpellsAmount(5);
                gameSession.playerLife = 200;
                gameSession.oponentLife = 200;
                gameSession.send("prepareSpells", {"spells": gameSession.spellBook, "spellsAmount": gameSession.prepareSpellsNum, "timeout": 10000});
                await sleep(15000);
                for (var i = 0; i < gameSession.prepareSpellsNum; i++) {
                    gameSession.send("turnStart", {spell: gameSession.prepareSpellsArray[i], "timeout": 5000});
                    gameSession.playerLifeChange = 0;
                    gameSession.oponentLifeChange = 0;
                    await sleep(5000);
                    gameSession.send("turnEnd", {player: {
                            life: gameSession.playerLife,
                            lifeChange: gameSession.playerLifeChange
                        }, oponents: [
                            {id: 'dummy',
                                life: gameSession.oponentLife,
                                lifeChange: gameSession.oponentLifeChange
                            }]});
                    await sleep(5000);
                }
            }
        }
    }, 0);
    return gameSession;
};

GameSession._slugify_strip_re = /[^\w\s-]/g;
GameSession._slugify_hyphenate_re = /[-\s]+/g;

module.exports = GameSession;

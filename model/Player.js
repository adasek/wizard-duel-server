const faker = require('faker');
const crypto = require('crypto');
const PlayerInstance = require('./PlayerInstance');


/**
 * Player is persistent identity of player.
 * It is subseted to PlayerInstance to use in GameSessions
 */
class Player {
    constructor(opts) {
        faker.locale = "cz";
        if (opts.name) {
            this.name = opts.name;
        } else {
            this.name = (faker.fake("{{hacker.adjective}} {{name.firstName}}"));
        }
        this.id = opts.id || crypto.randomBytes(20).toString('hex');
        this.allowedSpells = opts.allowedSpells || [];
    }

    createInstance() {
        return new PlayerInstance(this);
    }

}

Player.playerList = [
    new Player({'name': 'adambenda', allowedSpells: ["cantis", "expelliarmus", "alohomora", "accio", "finite-inclantatem", "episkey", "reparo", "protego", "petrificus-totalus", "lumos", "kal-vas-flam", "obscuro", "reducto"]}),
    new Player({'name': 'ondrabenda', allowedSpells: ["cantis", "expelliarmus", "alohomora", "accio", "finite-inclantatem", "episkey", "reparo", "protego", "petrificus-totalus", "lumos", "kal-vas-flam", "obscuro", "reducto"]}),
  
];
/*
 * 
 new Player({'name': 'Adam'}),
 new Player({'name': 'Aibo'}),
 new Player({'name': 'Mravenec'}),
 new Player({'name': 'Arxarian'}),
 new Player({'name': 'Pavel'})
 */

Player.playerList.findByName = function (name) {
    for (const player of Player.playerList) {
        if (name.toLowerCase() === player.name.toLowerCase()) {
            return player;
        }
    }
    return null;
};

Player.playerListIndex = 0;

Player.playerList.random = function () {
    return Player.playerList[Player.playerListIndex++ % Player.playerList.length];
    //return Player.playerList[Math.floor(Math.random() * Player.playerList.length)];
};

module.exports = Player;

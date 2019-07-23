/**
 * PlayerInstance subseted of Player to use in GameSessions
 */
class PlayerInstance {
    constructor(player, opts) {
        opts = opts || {};
        this.name = player.name || "nobody";
        this.id = player.id;
        this.allowedSpells = player.allowedSpells;

        this.lifeMax = opts.lifeMax || 200;
        this.life = opts.life || this.lifeMax;
        this.lifeChange = 0;
        this.stunned = 0;
        this.blinded = 0;
        this.blindedColor = null;

        this.session = null;

        this.prevents = {};
    }

    filterSpellBook(spellBook) {
        var filteredSpellBook = [];
        for (var i = 0; i < spellBook.length; i++) {
            if (this.allowedSpells.indexOf(spellBook[i].id) >= 0) {
                filteredSpellBook.push(spellBook[i]);
            }
        }
        return filteredSpellBook;
    }

    beHit(hitAmount) {
        console.log('⚡' + hitAmount + this.name);
        if (this.defense > 0) {
            hitAmount -= this.defense;
            if (hitAmount < 0) {
                hitAmount = 0;
            }
        }
        this.life -= hitAmount;
        this.lifeChange -= -hitAmount;

        //remove stuns
        if (hitAmount > 0) {
            this.stunned = 0;
        }
    }

    beProtected(amount) {
        console.log('💧' + amount + this.name);
        this.defense += amount;
    }

    beHealed(amount) {
        console.log('✚' + amount + this.name);
        this.life += amount;
        this.lifeChange += amount;
    }

    beBlinded(color, turns) {
        if (this.defense > 0) {
            console.log("B🛡" + this.name);
            return;
        }
        console.log('B' + turns + this.name);
        this.blinded += turns;
        this.blindedColor = color;
    }

    beStunned(turns) {
        if (this.defense > 0) {
            console.log("᥀🛡" + this.name);
            return;
        }
        console.log('᥀' + turns + this.name);
        this.stunned += turns;
    }

    prevent(spellName, turns) {
        if (!spellName in this.prevents) {
            this.prevents[spellName] = 0;
        }
        this.prevents[spellName] += turns;
    }

    restartTurn() {
        this.lifeChange = 0;
        this.defense = 0;

        for (var key in this.prevents) {
            if (this.prevents[key] > 0) {
                this.prevents[key]--;
            }
        }
    }

    toJSON() {
        var obj = {};
        for (var key in this) {
            if (key === "session") {
                continue;
            }
            obj[key] = this[key];
        }
        return obj;
    }

}

module.exports = PlayerInstance;

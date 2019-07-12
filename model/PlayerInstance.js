/**
 * PlayerInstance subseted of Player to use in GameSessions
 */
class PlayerInstance {
    constructor(player, opts) {
        opts = opts || {};
        this.name = player.name || "nobody";
        this.id = player.id;

        this.lifeMax = opts.lifeMax || 200;
        this.life = opts.life || this.lifeMax;
        this.lifeChange = 0;

        this.session = null;
    }

    beHit(hitAmount) {
        if (this.defense > 0) {
            hitAmount -= this.defense;
            if (hitAmount < 0) {
                hitAmount = 0;
            }
        }
        this.life -= hitAmount;
        this.lifeChange = -hitAmount;
    }

    restartTurn() {
        this.lifeChange = 0;
        this.defense = 0;
    }

    toJSON() {
        var obj = {};
        for (var key in this) {
            if (key === "session") {
                continue;
            }
            obj[key] = this[key];
        }
        return JSON.stringify(obj);
    }

}

module.exports = PlayerInstance;

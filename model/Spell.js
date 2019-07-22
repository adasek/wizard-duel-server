const faker = require('faker');
const crypto = require('crypto');
const PlayerInstance = require('./PlayerInstance');

const fs = require('fs');
const util = require('util');
const atob = require('atob');


/**
 * Player is persistent identity of player.
 * It is subseted to PlayerInstance to use in GameSessions
 */
class Spell {
    constructor(opts) {
        this.name = opts.name || "default";
        this.amount = opts.amount || 0;
        this.type = opts.type || "default";
        this.id = Spell.slugify(this.name);

        const readFile = util.promisify(fs.readFile);

        // load files
        setTimeout(async function () {
            var svgContent = await readFile('spells/' + this['id'] + ".svg");
            this.svg = atob(svgContent);
        }.bind(this), 0);
    }

    applyToPlayerInstance(playerInstance, opts) {
        const isOponent = opts.oponent;
        var penalty = opts.penalty / 100 || 0;
        var accuracy = opts.accuracy / 100 || 0;
        var default_amount = Math.round(500 * accuracy) / 10;
        default_amount = default_amount * Math.pow(1 - penalty, 2);

        if (this.id === "kal-vas-flam") {
            if (isOponent) {
                playerInstance.beHit(default_amount);
            }
        } else if (this.id === "reducto") {
            if (isOponent) {
                playerInstance.beHit(default_amount * 0.5);
            }
        } else if (this.id === "protego") {
            if (!isOponent) {
                playerInstance.beProtected(default_amount);
            }
        } else if (this.id === "accio") {
            //random effect based on opts.instanceRandom
            if (opts.instanceRandom < 0.33) {
                //lesser heal
                if (!isOponent) {
                    playerInstance.beHealed(default_amount * 0.3);
                }
            } else if (opts.instanceRandom < 0.66) {
                //lesser hit
                if (isOponent) {
                    playerInstance.beHit(default_amount * 0.5);
                }
            } else {
                //stun
                playerInstance.beStunned(1);
            }
        } else if (this.id === "reparo") {
            if (!isOponent) {
                playerInstance.beHealed(default_amount * 0.3);
            }
        } else if (this.id === "episkey") {
            if (!isOponent) {
                playerInstance.beHealed(default_amount * 0.5);
            }
        } else if (this.id === "expeliarmus") {
            if (isOponent) {
                if (opts.accuracy > 0.5) {
                    playerInstance.beStunned(1);
                }
            }
        } else if (this.id === "petrificus-totalus") {
            if (isOponent) {
                playerInstance.beStunned(99);
            }
        } else {
            console.error("Unkwnown spell effect");
        }
    }
}

Spell._slugify_strip_re = /[^\w\s-]/g;
Spell._slugify_hyphenate_re = /[-\s]+/g;


Spell.slugify = function (s) {
    s = s.replace(Spell._slugify_strip_re, '').trim().toLowerCase();
    s = s.replace(Spell._slugify_hyphenate_re, '-');
    s = s.toLowerCase();
    return s;
};


module.exports = Spell;

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
        setTimeout(async function(){
            var svgContent = await readFile('spells/' + this['id'] + ".svg");
            this.svg = atob(svgContent);
        }.bind(this),0);
    }
    
    applyToPlayerInstance(playerInstance,opts){
        const isOponent = opts.oponent;
        var default_amount = Math.round(5 * opts.accuracy) / 10;
        
        if(this.id === "kal-vas-flam"){
            if(isOponent){
             playerInstance.beHit(default_amount);
            }
        }else if(this.id === "protego"){
            if(!isOponent){
             playerInstance.beProtected(default_amount);
            }
        }else if(this.id === "episkey"){
            if(!isOponent){
             playerInstance.beHealed(default_amount);
            }
        }else if(this.id === "expeliarmus"){
            if(isOponent){
                if(opts.accuracy  > 0.5){
                 playerInstance.beStunned(1);
                }
            }
        }else {
            console.error("Unkwnown spell effect");
        }
    }
}

Spell._slugify_strip_re = /[^\w\s-]/g;
Spell._slugify_hyphenate_re = /[-\s]+/g;


Spell.slugify = function(s) {
    s = s.replace(Spell._slugify_strip_re, '').trim().toLowerCase();
    s = s.replace(Spell._slugify_hyphenate_re, '-');
    s = s.toLowerCase();
    return s;
};
    

module.exports = Spell;

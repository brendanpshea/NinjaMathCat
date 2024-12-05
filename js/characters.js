// characters.js
class Character {
    constructor(name, level) {
        this.name = name;
        this.level = level;
        this.maxHealth = 100 + (level * 10);
        this.currentHealth = this.maxHealth;
        this.baseDamage = 20;
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        return this.currentHealth <= 0;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    getHealthPercentage() {
        return Utils.percentage(this.currentHealth, this.maxHealth);
    }

    calculateDamage(questionDifficulty) {
        return Math.round(this.baseDamage * (1 + (questionDifficulty - 1) * 0.2));
    }
}

class Player extends Character {
    constructor(name = 'Math Ninja', level = 1) {
        super(name, level);
        this.experience = 0;
        this.experienceToLevel = 100;
    }

    gainExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.experienceToLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToLevel;
        this.experienceToLevel = Math.round(this.experienceToLevel * 1.5);
        this.maxHealth += 10;
        this.currentHealth = this.maxHealth;
        this.baseDamage += 5;
        debug(`${this.name} leveled up to level ${this.level}!`);
    }
}

class Monster extends Character {
    constructor(type, level) {
        super(MonsterTypes[type].name, level);
        this.type = type;
        this.maxHealth = MonsterTypes[type].baseHealth + (level * 8);
        this.currentHealth = this.maxHealth;
        this.baseDamage = MonsterTypes[type].baseDamage;
        this.experienceValue = MonsterTypes[type].experienceValue;
    }
}

const MonsterTypes = {
    WOLF: {
        name: 'Wolf',
        baseHealth: 80,
        baseDamage: 15,
        experienceValue: 20,
        minGrade: 0
    },
    OGRE: {
        name: 'Ogre',
        baseHealth: 120,
        baseDamage: 20,
        experienceValue: 35,
        minGrade: 0.5
    },
    DRAGON: {
        name: 'Dragon',
        baseHealth: 150,
        baseDamage: 25,
        experienceValue: 50,
        minGrade: 1
    }
};

// Test function
function testCharacters() {
    debug('Testing Character System:');
    
    // Create player and monster
    const player = new Player('Test Ninja', 1);
    const monster = new Monster('WOLF', 1);
    
    debug('\nInitial Stats:');
    debug('Player:', {
        name: player.name,
        health: player.currentHealth,
        damage: player.baseDamage,
        level: player.level,
        experience: player.experience
    });
    debug('Monster:', {
        name: monster.name,
        health: monster.currentHealth,
        damage: monster.baseDamage,
        level: monster.level
    });
    
    // Test battle mechanics
    debug('\nBattle Test:');
    const questionDifficulty = 2;
    const playerDamage = player.calculateDamage(questionDifficulty);
    const monsterDamage = monster.calculateDamage(questionDifficulty);
    
    // Player attacks monster
    monster.takeDamage(playerDamage);
    debug(`Player deals ${playerDamage} damage. Monster health: ${monster.currentHealth}`);
    
    // Monster attacks player
    player.takeDamage(monsterDamage);
    debug(`Monster deals ${monsterDamage} damage. Player health: ${player.currentHealth}`);
    
    // Test experience gain
    const leveledUp = player.gainExperience(monster.experienceValue);
    debug(`Player gained ${monster.experienceValue} experience. Total: ${player.experience}`);
    if (leveledUp) {
        debug('Player leveled up!');
    }
}

// Run tests if in debug mode
if (DEBUG) testCharacters();
// characters.js

class Character {
    constructor(name, level = 1) {
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

    getHealthPercentage() {
        return (this.currentHealth / this.maxHealth) * 100;
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
        this.experience = 0;
        this.maxHealth += 10;
        this.currentHealth = this.maxHealth;
        this.baseDamage += 5;
    }
}

class Monster extends Character {
    constructor(name = 'Monster', level = 1) {
        super(name, level);
        this.experienceValue = 20 * level;
        
        // Scale monster stats with level
        this.maxHealth = 80 + (level * 20);
        this.currentHealth = this.maxHealth;
        this.baseDamage = 15 + (level * 5);
    }
}
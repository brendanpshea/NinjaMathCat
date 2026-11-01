// sprites.js

class Sprite {
    constructor(canvas, x, y, width, height, imagePath) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isAnimating = false;
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imagePath;
    }

    update(deltaTime) {
        // Future animation or positional updates can be placed here.
    }

    draw() {
        if (this.loaded) {
            this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    attack() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const originalX = this.x;
        const moveDistance = this.width / 3;
        const moveTime = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / moveTime, 1);

            // Remove any direct canvas clearing calls. We only adjust position here.
            if (progress < 0.5) {
                this.x = originalX + (moveDistance * (progress * 2));
            } else {
                this.x = originalX + (moveDistance * ((1 - progress) * 2));
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.x = originalX;
                this.isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    }

    takeDamage() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const flashDuration = 300;
        const flashCount = 2;
        let flashes = 0;

        const flash = () => {
            this.ctx.globalAlpha = 0.5;
            this.draw();

            setTimeout(() => {
                this.ctx.globalAlpha = 1;
                this.draw();
                flashes++;

                if (flashes < flashCount) {
                    setTimeout(flash, flashDuration / 2);
                } else {
                    this.isAnimating = false;
                }
            }, flashDuration / 2);
        };

        flash();
    }
}

class Background {
    constructor(canvas, imagePath) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imagePath;
    }

    update(deltaTime) {
        // If needed, implement scrolling or transitions here in the future.
    }

    draw() {
        if (this.loaded) {
            this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

class EnergyBlast {
    constructor(canvas, startX, startY, targetX, targetY, imagePath) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = 64;
        this.speed = 300;
        this.image = new Image();
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.src = imagePath;
    }

    update(deltaTime) {
        // You can incorporate deltaTime for smoother animations later if needed.
    }

    fire(onComplete) {
        const distance = Math.sqrt(
            Math.pow(this.targetX - this.startX, 2) + Math.pow(this.targetY - this.startY, 2)
        );
        const duration = (distance / this.speed) * 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentX = this.startX + (this.targetX - this.startX) * progress;
            const currentY = this.startY + (this.targetY - this.startY) * progress;

            if (this.loaded) {
                this.ctx.save();
                const angle = Math.atan2(this.targetY - this.startY, this.targetX - this.startX);
                this.ctx.translate(currentX, currentY);
                this.ctx.rotate(angle);
                this.ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
                this.ctx.restore();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animate);
    }
}

export { Sprite, Background, EnergyBlast };

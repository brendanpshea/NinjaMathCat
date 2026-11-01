class ImageLoader {
    constructor() {
        this.loadedImages = new Map();
        this.imageCount = 0;
    }

    async loadImage(path) {
        return new Promise(resolve => {
            if (this.loadedImages.has(path)) {
                resolve(this.loadedImages.get(path));
                return;
            }
            const img = new Image();
            img.onload = () => {
                this.loadedImages.set(path, img);
                this.imageCount++;
                resolve(img);
            };
            img.onerror = () => {
                resolve(null);
            };
            img.src = path;
        });
    }

    async loadImages(imageMap) {
        const loadedEntries = [];
        for (const [key, path] of Object.entries(imageMap)) {
            const img = await this.loadImage(path);
            if (img) {
                loadedEntries.push([key, img]);
            }
        }
        return new Map(loadedEntries);
    }

    async discoverImages(directory, prefix, extension, { maxFailures = 3, startIndex = 1 } = {}) {
        const images = [];
        let index = startIndex;
        let consecutiveFailures = 0;

        while (consecutiveFailures < maxFailures) {
            const paddedIndex = String(index).padStart(2, '0');
            const path = `${directory}/${prefix}${paddedIndex}${extension}`;
            const img = await this.loadImage(path);
            if (img) {
                images.push(img);
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
            }
            index++;
        }

        return images;
    }

    discoverMonsterImages(directory) {
        return this.discoverImages(directory, 'monster_', '.png');
    }

    discoverBackgroundImages(directory) {
        return this.discoverImages(directory, 'background_', '.png');
    }

    discoverMonsterBlastImages(directory) {
        return this.discoverImages(directory, 'monster_blast_', '.png');
    }

    discoverPlayerBlastImages(directory) {
        return this.discoverImages(directory, 'energy_blast_', '.png');
    }

    getImage(path) {
        return this.loadedImages.get(path);
    }
}
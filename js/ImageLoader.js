class ImageLoader {
    constructor() {
        this.loadedImages = new Map();
        this.imageCount = 0;
    }

    /**
     * Load a single image
     * @param {string} path - Path to the image
     * @returns {Promise<HTMLImageElement>} - Promise resolving to the loaded image
     */
    loadImage(path) {
        return new Promise((resolve, reject) => {
            if (this.loadedImages.has(path)) {
                resolve(this.loadedImages.get(path));
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.loadedImages.set(path, img);
                this.imageCount++;
                debug(`Loaded image: ${path}`); // Fixed: using path instead of key
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }
    
    /**
     * Load multiple images at once
     * @param {Object} imageMap - Object mapping keys to image paths
     * @returns {Promise<Map<string, HTMLImageElement>>} - Promise resolving to map of loaded images
     */
    loadImages(imageMap) {
        const promises = Object.entries(imageMap).map(([key, path]) => 
            this.loadImage(path).then(img => [key, img])
        );
        return Promise.all(promises).then(entries => new Map(entries));
    }

    /**
     * Discover and load monster images (numbered monster_01.png, monster_02.png, etc.)
     * @param {string} directory - Base directory path
     * @returns {Promise<HTMLImageElement[]>} - Promise resolving to array of loaded images
     */
    async discoverMonsterImages(directory) {
        const images = [];
        let index = 1;
        let consecutiveFailures = 0;
        const MAX_FAILURES = 3; // Stop after 3 consecutive failures

        while (consecutiveFailures < MAX_FAILURES) {
            const paddedIndex = String(index).padStart(2, '0');
            const path = `${directory}/monster_${paddedIndex}.png`;
            
            try {
                const img = await this.loadImage(path);
                images.push(img);
                consecutiveFailures = 0;
                index++;
            } catch (error) {
                consecutiveFailures++;
                debug(`Failed to load monster image ${path}`);
            }
        }

        debug(`Loaded ${images.length} monster images`);
        return images;
    }

    /**
     * Discover and load background images (numbered background_01.png, background_02.png, etc.)
     * @param {string} directory - Base directory path
     * @returns {Promise<HTMLImageElement[]>} - Promise resolving to array of loaded images
     */
    async discoverBackgroundImages(directory) {
        const images = [];
        let index = 1;
        let consecutiveFailures = 0;
        const MAX_FAILURES = 3; // Stop after 3 consecutive failures

        while (consecutiveFailures < MAX_FAILURES) {
            const paddedIndex = String(index).padStart(2, '0');
            const path = `${directory}/background_${paddedIndex}.png`;
            
            try {
                const img = await this.loadImage(path);
                images.push(img);
                consecutiveFailures = 0;
                index++;
            } catch (error) {
                consecutiveFailures++;
                debug(`Failed to load background image ${path}`);
            }
        }

        debug(`Loaded ${images.length} background images`);
        return images;
    }


    
    /**
     * Get a loaded image
     * @param {string} path - Path of the image to get
     * @returns {HTMLImageElement|undefined} - The loaded image or undefined if not loaded
     */
    getImage(path) {
        return this.loadedImages.get(path);
    }
}
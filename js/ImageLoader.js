class ImageLoader {
    constructor() {
        this.loadedImages = new Map();
        this.imageCount = 0;
    }

    /**
     * Load a single image with error handling
     * @param {string} path - Path to the image
     * @returns {Promise<HTMLImageElement|null>} - Promise resolving to the loaded image or null if failed
     */
    loadImage(path) {
        return new Promise((resolve) => {
            if (this.loadedImages.has(path)) {
                resolve(this.loadedImages.get(path));
                return;
            }

            const img = new Image();
            
            img.onload = () => {
                this.loadedImages.set(path, img);
                this.imageCount++;
                debug(`Loaded image: ${path}`);
                resolve(img);
            };
            
            img.onerror = () => {
                debug(`Failed to load image: ${path}`);
                resolve(null);
            };
            
            img.src = path;
        });
    }
    
    /**
     * Load multiple images at once, skipping any that fail
     * @param {Object} imageMap - Object mapping keys to image paths
     * @returns {Promise<Map<string, HTMLImageElement>>} - Promise resolving to map of successfully loaded images
     */
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

    /**
     * Generic function to discover and load sequentially numbered images
     * @param {string} directory - Base directory path
     * @param {string} prefix - Prefix for the image files (e.g., "monster_" or "background_")
     * @param {string} extension - File extension (e.g., ".png")
     * @param {Object} options - Additional options
     * @param {number} [options.maxFailures=3] - Maximum consecutive failures before stopping
     * @param {number} [options.startIndex=1] - Starting index for image numbering
     * @returns {Promise<HTMLImageElement[]>} - Promise resolving to array of successfully loaded images
     */
    async discoverImages(directory, prefix, extension, options = {}) {
        const {
            maxFailures = 3,
            startIndex = 1
        } = options;

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

        debug(`Loaded ${images.length} ${prefix} images`);
        return images;
    }

    /**
     * Discover and load monster images
     * @param {string} directory - Base directory path
     * @returns {Promise<HTMLImageElement[]>} - Promise resolving to array of loaded images
     */
    discoverMonsterImages(directory) {
        return this.discoverImages(directory, 'monster_', '.png');
    }

    /**
     * Discover and load background images
     * @param {string} directory - Base directory path
     * @returns {Promise<HTMLImageElement[]>} - Promise resolving to array of loaded images
     */
    discoverBackgroundImages(directory) {
        return this.discoverImages(directory, 'background_', '.png');
    }
    
    /**
     * Discover and load monster blast images.
     * Ensure your naming convention follows monster_blast_01.png, monster_blast_02.png, etc.
     * @param {string} directory - Base directory path for monster blast images
     * @returns {Promise<HTMLImageElement[]>}
     */
    discoverMonsterBlastImages(directory) {
        return this.discoverImages(directory, 'monster_blast_', '.png');
    }

    discoverPlayerBlastImages(directory) {
        return this.discoverImages(directory, 'energy_blast_', '.png');
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
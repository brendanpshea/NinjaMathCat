// utils.js
const Utils = {
    // Random number between min and max (inclusive)
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // Calculate percentage
    percentage: (current, total) => (current / total) * 100,
    
    // Shuffle array
    shuffle: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    // Create DOM element with classes
    createElement: (tag, className = '', text = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    },
    
    // Animation helper
    animate: (element, className, duration) => {
        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), duration);
    },
    
    // Format number with commas
    formatNumber: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
};

// Debug logging helper
const DEBUG = true;
function debug(...args) {
    if (DEBUG) console.log(...args);
}
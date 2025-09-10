// Configuration manager for Meckano Time Tracker Helper
import configData from './config.json' assert { type: 'json' };

/**
 * Configuration class providing centralized access to app settings
 * Singleton pattern ensures consistent config across modules
 */
export class Config {
    static #instance = null;
    #config = null;

    constructor() {
        if (Config.#instance) {
            return Config.#instance;
        }
        
        this.#config = configData;
        Config.#instance = this;
    }

    /**
     * Get singleton instance of Config
     * @returns {Config} Config instance
     */
    static getInstance() {
        if (!Config.#instance) {
            Config.#instance = new Config();
        }
        return Config.#instance;
    }

    /**
     * Get configuration value by key
     * @param {string} key - Configuration key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} Configuration value
     */
    get(key, defaultValue = null) {
        return this.#config[key] ?? defaultValue;
    }



    /**
     * Check if configuration key exists
     * @param {string} key - Configuration key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return key in this.#config;
    }

    /**
     * Get all configuration as read-only object
     * @returns {object} Complete configuration object
     */
    getAll() {
        return { ...this.#config };
    }
}

// Export convenience method for direct access
export const config = Config.getInstance();

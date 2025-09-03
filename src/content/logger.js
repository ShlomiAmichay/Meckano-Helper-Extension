// Logger singleton for Meckano Time Tracker Helper
import { config } from './config.js';

/**
 * Logger singleton class providing centralized logging functionality
 * Automatically reads configuration and formats output consistently
 */
export class Logger {
    static #instance = null;

    constructor() {
        if (Logger.#instance) {
            return Logger.#instance;
        }
        
        Logger.#instance = this;
    }

    /**
     * Get singleton instance of Logger
     * @returns {Logger} Logger instance
     */
    static getInstance() {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }
        return Logger.#instance;
    }

    /**
     * Log a message with module context
     * @param {string} module - Module name (e.g., 'FormManager', 'DataProvider')
     * @param {string} message - Log message
     * @param {*} data - Optional data to log (objects, arrays, etc.)
     */
    log(module, message, data = null) {
        if (!config.get('DEBUG_MODE', false)) {
            return;
        }

        const prefix = config.get('LOG_PREFIX', 'Meckano Helper');
        const timestamp = new Date().toLocaleTimeString();
        
        if (data !== null && data !== undefined) {
            console.log(`[${prefix}:${module}] ${timestamp} - ${message}`, data);
        } else {
            console.log(`[${prefix}:${module}] ${timestamp} - ${message}`);
        }
    }

    /**
     * Log error with enhanced formatting
     * @param {string} module - Module name
     * @param {string} message - Error message
     * @param {Error|*} error - Error object or data
     */
    error(module, message, error = null) {
        const prefix = config.get('LOG_PREFIX', 'Meckano Helper');
        const timestamp = new Date().toLocaleTimeString();
        
        if (error instanceof Error) {
            console.error(`[${prefix}:${module}] ${timestamp} - ERROR: ${message}`, {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        } else if (error !== null && error !== undefined) {
            console.error(`[${prefix}:${module}] ${timestamp} - ERROR: ${message}`, error);
        } else {
            console.error(`[${prefix}:${module}] ${timestamp} - ERROR: ${message}`);
        }
    }

    /**
     * Log warning message
     * @param {string} module - Module name
     * @param {string} message - Warning message
     * @param {*} data - Optional data
     */
    warn(module, message, data = null) {
        if (!config.get('DEBUG_MODE', false)) {
            return;
        }

        const prefix = config.get('LOG_PREFIX', 'Meckano Helper');
        const timestamp = new Date().toLocaleTimeString();
        
        if (data !== null && data !== undefined) {
            console.warn(`[${prefix}:${module}] ${timestamp} - WARNING: ${message}`, data);
        } else {
            console.warn(`[${prefix}:${module}] ${timestamp} - WARNING: ${message}`);
        }
    }

    /**
     * Log info message (always shows, regardless of DEBUG_MODE)
     * @param {string} module - Module name
     * @param {string} message - Info message
     * @param {*} data - Optional data
     */
    info(module, message, data = null) {
        const prefix = config.get('LOG_PREFIX', 'Meckano Helper');
        const timestamp = new Date().toLocaleTimeString();
        
        if (data !== null && data !== undefined) {
            console.info(`[${prefix}:${module}] ${timestamp} - INFO: ${message}`, data);
        } else {
            console.info(`[${prefix}:${module}] ${timestamp} - INFO: ${message}`);
        }
    }
}

// Export convenience instance for direct usage
export const logger = Logger.getInstance();

/**
 * Create a module-specific logger with simplified API
 * @param {string} moduleName - Name of the module
 * @returns {object} Object with logging methods bound to the module
 */
export function createLogger(moduleName) {
    const loggerInstance = Logger.getInstance();
    
    return {
        /**
         * Log a message for this module
         * @param {string} message - Log message
         * @param {*} data - Optional data to log
         */
        log: (message, data = null) => loggerInstance.log(moduleName, message, data),
        
        /**
         * Log an error for this module
         * @param {string} message - Error message
         * @param {Error|*} error - Error object or data
         */
        error: (message, error = null) => loggerInstance.error(moduleName, message, error),
        
        /**
         * Log a warning for this module
         * @param {string} message - Warning message
         * @param {*} data - Optional data
         */
        warn: (message, data = null) => loggerInstance.warn(moduleName, message, data),
        
        /**
         * Log an info message for this module (always shows)
         * @param {string} message - Info message
         * @param {*} data - Optional data
         */
        info: (message, data = null) => loggerInstance.info(moduleName, message, data)
    };
}

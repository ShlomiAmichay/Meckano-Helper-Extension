// Abstract DataProvider class for Meckano Time Tracker Helper
import { createLogger } from './logger.js';

const logger = createLogger('DataProvider');

/**
 * Abstract base class for data providers
 * Defines the interface for providing time data for different dates
 */
export class DataProvider {
    constructor() {
        logger.log('Base DataProvider created');
    }

    /**
     * Abstract method to get time data for a specific date
     * Must be implemented by subclasses
     * @param {string} date - Date string in format expected by implementation
     * @returns {object|null} Object with {checkin, checkout} times or null to skip
     */
    getTimeData(date) {
        throw new Error('getTimeData(date) must be implemented by subclass');
    }
}

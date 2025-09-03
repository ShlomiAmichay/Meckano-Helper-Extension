// ConstantDataProvider class for Meckano Time Tracker Helper
import { DataProvider } from './dataProvider.js';
import { createLogger } from './logger.js';
import { humanizeTime } from './utils.js';

const logger = createLogger('ConstantDataProvider');

/**
 * Data provider that returns constant times for all dates
 * Supports optional humanization (±20 minute randomization)
 */
export class ConstantDataProvider extends DataProvider {
    /**
     * Create a ConstantDataProvider instance
     * @param {string} checkinTime - Check-in time in HH:MM format
     * @param {string} checkoutTime - Check-out time in HH:MM format
     * @param {boolean} humanize - Whether to add random variation to times
     */
    constructor(checkinTime, checkoutTime, humanize = false) {
        super();
        this.checkinTime = checkinTime;
        this.checkoutTime = checkoutTime;
        this.humanize = humanize;
        
        logger.log(`Initialized with ${humanize ? 'humanized' : 'constant'} times: ${checkinTime} - ${checkoutTime}`);
    }

    /**
     * Get time data for a specific date
     * Returns constant times, optionally with humanization
     * @param {string} date - Date string (format not used in constant provider)
     * @returns {object} Object with {checkin, checkout} times
     */
    getTimeData(date) {
        logger.log(`Getting time data for date: ${date}`);
        
        if (!this.humanize) {
            return {
                checkin: this.checkinTime,
                checkout: this.checkoutTime
            };
        }
        
        // Humanize: add random variation of ±20 minutes to each time
        const checkinHumanized = this.addRandomVariation(this.checkinTime);
        const checkoutHumanized = this.addRandomVariation(this.checkoutTime);
        
        logger.log(`Humanized times for ${date}: ${checkinHumanized} - ${checkoutHumanized}`);
        logger.log(`Base times were: ${this.checkinTime} - ${this.checkoutTime}`);
        
        return {
            checkin: checkinHumanized,
            checkout: checkoutHumanized
        };
    }

    /**
     * Add random variation of ±20 minutes to a time string
     * @param {string} timeString - Time in HH:MM format
     * @returns {string} Time with random variation in HH:MM format
     */
    addRandomVariation(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        
        // Generate random variation between -20 and +20 minutes
        const variation = Math.floor(Math.random() * 41) - 20; // -20 to +20
        const newTotalMinutes = Math.max(0, Math.min(1439, totalMinutes + variation)); // Keep within 00:00-23:59
        
        const newHours = Math.floor(newTotalMinutes / 60);
        const newMinutes = newTotalMinutes % 60;
        
        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    }
}

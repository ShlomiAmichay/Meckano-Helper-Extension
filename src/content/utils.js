// Utility functions for Meckano Time Tracker Helper

/**
 * Sleep function - pauses execution for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after the specified time
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random time within ±20 minutes of base time
 * Used for humanizing time entries
 * @param {string} baseTime - Base time in HH:MM format
 * @returns {string} Randomized time in HH:MM format
 */
export function humanizeTime(baseTime) {
    const [hours, minutes] = baseTime.split(':').map(Number);
    
    // Convert to total minutes
    const totalMinutes = hours * 60 + minutes;
    
    // Add random offset: -20 to +20 minutes
    const randomOffset = Math.floor(Math.random() * 41) - 20;
    const newTotalMinutes = totalMinutes + randomOffset;
    
    // Convert back to hours and minutes
    const newHours = Math.floor(newTotalMinutes / 60);
    const newMinutes = newTotalMinutes % 60;
    
    // Format with leading zeros
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Check if a string contains any of the skip patterns
 * @param {string} text - Text to check
 * @param {string[]} skipPatterns - Array of patterns to check for
 * @returns {boolean} True if text contains any skip pattern
 */
export function containsSkipPattern(text, skipPatterns) {
    return skipPatterns.some(pattern => text.includes(pattern));
}

/**
 * Parse Hebrew date string and extract date and day information
 * @param {string} dateString - Date string in format "DD/MM/YYYY ה" (Hebrew day)
 * @returns {object|null} Object with date info or null if invalid
 */
export function parseHebrewDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }

    // Match format: "DD/MM/YYYY ה" where ה is Hebrew day letter
    const match = dateString.trim().match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+([א-ת]+)$/);
    
    if (!match) {
        return null;
    }

    const [, datePart, hebrewDay] = match;
    
    return {
        fullString: dateString,
        datePart: datePart,
        hebrewDay: hebrewDay,
        isValid: true
    };
}

/**
 * Validate if a time string is in valid HH:MM format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid time format
 */
export function isValidTimeFormat(timeString) {
    if (!timeString || typeof timeString !== 'string') {
        return false;
    }
    
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(timeString);
}



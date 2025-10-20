// FormManager class for Meckano Time Tracker Helper
import { createLogger } from './logger.js';
import { config } from './config.js';
import { sleep, containsSkipPattern } from './utils.js';

const logger = createLogger('FormManager');

/**
 * Handles form filling and submission for the Meckano timesheet dialog
 * Processes date rows, fills time inputs, and manages form submission
 */
export class FormManager {
    constructor() {
        logger.log('FormManager initialized');
    }

    /**
     * Fill time inputs for all working days in the timesheet
     * @param {DataProvider} dataProvider - Provider for time data
     * @returns {Promise<object>} Result object with success/error status and details
     */
    async fillTimeInputs(dataProvider) {
        logger.log('Starting to fill time inputs...');
        
        try {
            // Find the dialog and time table
            const dialog = document.getElementById('freeReporting-dialog');
            if (!dialog) {
                return { success: false, error: 'Dialog not found' };
            }
            
            const timeTable = dialog.querySelector('.hours-report');
            if (!timeTable) {
                return { success: false, error: 'Time table not found in dialog' };
            }
            
            // Find all date rows (excluding header)
            const dateRows = timeTable.querySelectorAll('tr:not(:first-child)');
            logger.log(`Found ${dateRows.length} date rows to process`);
            
            let filledCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            // Process each date row
            for (const row of dateRows) {
                try {
                    const dateInfo = this.parseDateRow(row);
                    if (!dateInfo) {
                        logger.log('Skipping row - no date info found');
                        skippedCount++;
                        continue;
                    }
                    
                    logger.log(`Processing date: ${dateInfo.date} (${dateInfo.hebrewDay})`);
                    
                    // Check if it's a working day
                    if (this.shouldSkipDate(dateInfo)) {
                        logger.log(`⏭️ Skipping ${dateInfo.date} - ${dateInfo.skipReason}`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Skip if row is already complete
                    if (this.isRowComplete(row)) {
                        logger.log(`⏭️ Skipping ${dateInfo.date} - already complete`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Get time data for this date
                    const timeData = dataProvider.getTimeData(dateInfo.date);
                    if (!timeData) {
                        logger.log(`❌ No time data available for ${dateInfo.date}`);
                        errorCount++;
                        continue;
                    }
                    
                    // Fill the inputs for this row (only missing ones)
                    const fillResult = await this.fillRowInputs(row, timeData, dateInfo.date);
                    if (fillResult.success) {
                        filledCount++;
                        logger.log(`✅ Successfully filled ${dateInfo.date}`);
                    } else {
                        errorCount++;
                        logger.log(`❌ Failed to fill ${dateInfo.date}: ${fillResult.error}`);
                    }
                    
                    // Small delay between filling each row
                    await sleep(100);
                    
                } catch (rowError) {
                    logger.error(`Error processing row:`, rowError);
                    errorCount++;
                }
            }
            
            // Summary
            logger.log(`✅ Form filling complete: ${filledCount} filled, ${skippedCount} skipped, ${errorCount} errors`);
            
            return {
                success: true,
                message: `Successfully filled ${filledCount} working days`,
                details: {
                    filled: filledCount,
                    skipped: skippedCount,
                    errors: errorCount
                }
            };
            
        } catch (error) {
            logger.error('Error in fillTimeInputs:', error);
            return {
                success: false,
                error: `Form filling failed: ${error.message}`
            };
        }
    }

    /**
     * Parse date information from a table row
     * @param {HTMLElement} row - Table row element
     * @returns {object|null} Date information object with date, hebrewDay, specialText, missingEventValue, 
     *                        and fullText properties, or null if parsing fails
     */
    parseDateRow(row) {
        try {
            const dateCell = row.querySelector('td.date');
            if (!dateCell) {
                return null;
            }
            
            const dateTextSpan = dateCell.querySelector('.dateText');
            if (!dateTextSpan) {
                return null;
            }
            
            const fullDateText = dateTextSpan.textContent.trim();
            // Expected format: "25/08/2025 ב" 
            const match = fullDateText.match(/(\d{2}\/\d{2}\/\d{4})\s*([א-ת])/);
            if (!match) {
                return null;
            }
            
            const [, dateString, hebrewLetter] = match;
            
            // Check for special day description (holidays)
            const specialSpan = dateCell.querySelector('.specialDayDescription');
            const specialText = specialSpan ? specialSpan.textContent.trim() : '';
            
            // Check for missing events dropdown (vacation/sickness)
            const missingCell = row.querySelector('td.missing');
            const missingSelect = missingCell ? missingCell.querySelector('select.select-box') : null;
            const missingEventValue = missingSelect ? missingSelect.value : '0';
            
            // Debug log for missing event detection
            if (missingEventValue !== '0') {
                logger.log(`Detected missing event for ${dateString}: value=${missingEventValue}`);
            }
            
            return {
                date: dateString,        // "25/08/2025"
                hebrewDay: hebrewLetter, // "ב" 
                specialText: specialText, // "חג" or "ערב חג" or ""
                missingEventValue: missingEventValue, // "0", "30148", "30149", etc.
                fullText: fullDateText   // "25/08/2025 ב"
            };
            
        } catch (error) {
            logger.error('Error parsing date row:', error);
            return null;
        }
    }

    /**
     * Check if date should be skipped (weekends/holidays)
     * @param {object} dateInfo - Date information object
     * @returns {boolean} True if date should be skipped
     */
    shouldSkipDate(dateInfo) {
        const skipPatterns = config.get('SKIP_PATTERNS', ['ו', 'ש', 'חג', 'ערב חג']);
        
        // Skip weekends: Friday (ו) and Saturday (ש)
        if (dateInfo.hebrewDay === 'ו' || dateInfo.hebrewDay === 'ש') {
            dateInfo.skipReason = `Weekend (${dateInfo.hebrewDay === 'ו' ? 'Friday' : 'Saturday'})`;
            return true;
        }
        
        // Skip holidays: "חג" in special text
        if (dateInfo.specialText.includes('חג') && !dateInfo.specialText.includes('ערב')) {
            dateInfo.skipReason = 'Holiday';
            return true;
        }
        
        // Skip holiday eves: "ערב חג" in special text
        if (dateInfo.specialText.includes('ערב חג')) {
            dateInfo.skipReason = 'Holiday Eve';
            return true;
        }
        
        // Skip days with missing events (vacation, sickness, etc.)
        const skipRules = config.get('MISSING_EVENT_SKIP_RULES', {});
        const skipReason = skipRules[dateInfo.missingEventValue];
        if (skipReason) {
            dateInfo.skipReason = skipReason;
            return true;
        }
        
        return false; // This is a working day
    }

    /**
     * Check if an input field has data
     * @param {HTMLElement} input - Input element
     * @returns {boolean} True if input is filled
     */
    isInputFilled(input) {
        return input && input.value.trim() !== '';
    }

    /**
     * Check if a row has both checkin and checkout filled
     * @param {HTMLElement} row - Table row element
     * @returns {boolean} True if row is complete
     */
    isRowComplete(row) {
        const checkinInput = row.querySelector('input.checkIn');
        const checkoutInput = row.querySelector('input.checkOut');
        return this.isInputFilled(checkinInput) && this.isInputFilled(checkoutInput);
    }

    /**
     * Fill time inputs for a specific row (only fill missing ones)
     * @param {HTMLElement} row - Table row element
     * @param {object} timeData - Time data with checkin and checkout
     * @param {string} date - Date string for logging
     * @returns {Promise<object>} Result object with success status
     */
    async fillRowInputs(row, timeData, date) {
        try {
            const checkinInput = row.querySelector('input.checkIn');
            const checkoutInput = row.querySelector('input.checkOut');
            
            if (!checkinInput || !checkoutInput) {
                return {
                    success: false,
                    error: `Missing time inputs for date ${date}`
                };
            }
            
            const filledParts = [];
            
            // Fill checkin time only if empty
            if (!this.isInputFilled(checkinInput)) {
                checkinInput.value = timeData.checkin;
                checkinInput.dispatchEvent(new Event('input', { bubbles: true }));
                checkinInput.dispatchEvent(new Event('change', { bubbles: true }));
                filledParts.push(`check-in: ${timeData.checkin}`);
                
                // Small delay between inputs
                await sleep(50);
            }
            
            // Fill checkout time only if empty
            if (!this.isInputFilled(checkoutInput)) {
                checkoutInput.value = timeData.checkout;
                checkoutInput.dispatchEvent(new Event('input', { bubbles: true }));
                checkoutInput.dispatchEvent(new Event('change', { bubbles: true }));
                filledParts.push(`check-out: ${timeData.checkout}`);
            }
            
            if (filledParts.length > 0) {
                logger.log(`Filled ${filledParts.join(', ')} for ${date}`);
            }
            
            return { success: true };
            
        } catch (error) {
            return {
                success: false,
                error: `Failed to fill inputs for ${date}: ${error.message}`
            };
        }
    }

    /**
     * Submit the timesheet form
     * @returns {Promise<object>} Result object with success/error status
     */
    async submitForm() {
        logger.log('Submitting form...');
        
        try {
            // Find the dialog
            const dialog = document.getElementById('freeReporting-dialog');
            if (!dialog) {
                return { success: false, error: 'Dialog not found for submission' };
            }
            
            // Find the submit button
            const submitButton = dialog.querySelector('.save.button-refresh-data.update-freeReporting');
            if (!submitButton) {
                return { 
                    success: false, 
                    error: 'Submit button not found. Button selector: .save.button-refresh-data.update-freeReporting' 
                };
            }
            
            // Check if button is enabled/clickable
            if (submitButton.disabled) {
                return { 
                    success: false, 
                    error: 'Submit button is disabled' 
                };
            }
            
            logger.log('✅ Found submit button, clicking...');
            
            // Click the submit button
            submitButton.click();
            logger.log('🖱️ Clicked submit button');
            
            // Wait for form submission to process
            await sleep(500);
            
            // Wait for dialog to close (indicating successful submission)
            const defaultRetries = config.get('DEFAULT_RETRY_COUNT', 15);
            const defaultDelay = config.get('DEFAULT_DELAY_MS', 1000);
            const closeSuccess = await this.waitForDialogClose(defaultRetries, defaultDelay);
            
            if (closeSuccess.success) {
                logger.log('✅ Form submitted successfully - dialog closed');
                return {
                    success: true,
                    message: 'Form submitted successfully and dialog closed'
                };
            } else {
                logger.log('⚠️ Form clicked but dialog still open - may have validation errors');
                return {
                    success: true,
                    message: 'Submit button clicked, but dialog remained open (check for validation errors)',
                    warning: 'Dialog did not close automatically'
                };
            }
            
        } catch (error) {
            logger.error('Error submitting form:', error);
            return {
                success: false,
                error: `Form submission failed: ${error.message}`
            };
        }
    }

    /**
     * Wait for dialog to close after submission
     * @param {number} maxRetries - Maximum number of retry attempts
     * @param {number} delayMs - Delay between retry attempts
     * @returns {Promise<object>} Result object with success/error status
     */
    async waitForDialogClose(maxRetries = 15, delayMs = 1000) {
        logger.log(`Waiting for dialog to close (${maxRetries} retries, ${delayMs}ms delay)...`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const dialog = document.getElementById('freeReporting-dialog');
                
                if (!dialog) {
                    logger.log(`✅ Dialog closed (removed from DOM) on attempt ${attempt}`);
                    return { success: true, message: 'Dialog removed from DOM' };
                }
                
                // Check if dialog is no longer visible
                const isVisible = dialog.style.display === 'block' || 
                                 window.getComputedStyle(dialog).display !== 'none';
                
                if (!isVisible) {
                    logger.log(`✅ Dialog closed (hidden) on attempt ${attempt}`);
                    return { success: true, message: 'Dialog hidden successfully' };
                }
                
                logger.log(`Attempt ${attempt}/${maxRetries}: Dialog still open`);
                
                if (attempt < maxRetries) {
                    await sleep(delayMs);
                }
                
            } catch (error) {
                logger.error(`Error checking dialog close on attempt ${attempt}:`, error);
            }
        }
        
        logger.log(`⚠️ Dialog did not close after ${maxRetries} attempts`);
        return {
            success: false,
            error: `Dialog did not close after ${maxRetries * delayMs}ms`
        };
    }
}

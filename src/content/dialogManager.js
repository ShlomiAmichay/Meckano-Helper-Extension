// DialogManager class for Meckano Time Tracker Helper
import { createLogger } from './logger.js';
import { config } from './config.js';
import { sleep } from './utils.js';

const logger = createLogger('DialogManager');
const dialogConfig = config.get('dialogManager') || {};

/**
 * Handles dialog opening and waiting for Meckano timesheet dialog
 * Manages the popup dialog that contains the timesheet form
 */
export class DialogManager {
    constructor() {
        logger.log('DialogManager initialized');
    }

    /**
     * Open the timesheet dialog by clicking the trigger element
     * @returns {Promise<object>} Result object with success/error status
     */
    async openDialog() {
        logger.log('Looking for dialog trigger element...');
        
        try {
            // Find the <a> element with classes 'export free-reporting popup-container'
            const triggerElement = document.querySelector('a.export.free-reporting.popup-container');
            
            if (!triggerElement) {
                logger.log('❌ Dialog trigger element not found');
                return { 
                    success: false, 
                    error: 'Dialog trigger element not found. Make sure you\'re on the correct page.' 
                };
            }
            
            logger.log('✅ Found dialog trigger element:', triggerElement);
            
            // Click the trigger element to open dialog
            triggerElement.click();
            logger.log('🖱️ Clicked dialog trigger element');
            
            // Give it a moment for the click to register
            await sleep(100);
            
            return { 
                success: true, 
                message: 'Dialog trigger clicked successfully' 
            };
            
        } catch (error) {
            logger.error('Error opening dialog:', error);
            return { 
                success: false, 
                error: `Failed to open dialog: ${error.message}` 
            };
        }
    }

    /**
     * Wait for dialog to be fully loaded and ready
     * @returns {Promise<object>} Result object with success/error status
     */
    async waitForDialog() {
        // Use config values with fallback defaults
        const maxRetries = dialogConfig.waitForDialogMaxRetries;
        const delayMs = dialogConfig.waitForDialogDelayTime;
        
        logger.log(`Waiting for dialog to render (${maxRetries} retries, ${delayMs}ms delay)...`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            logger.log(`Wait attempt ${attempt}/${maxRetries}...`);
            
            try {
                // Check if dialog is open
                if (!this.isDialogOpen()) {
                    logger.log(`Attempt ${attempt}: Dialog not yet visible`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check if dialog content is ready
                const dialog = document.getElementById('freeReporting-dialog');
                
                // Check for attendance view (should be active by default)
                const attendanceView = dialog.querySelector('.attendance-view');
                if (!attendanceView) {
                    logger.log(`Attempt ${attempt}: Attendance view not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check if attendance view is visible
                const isAttendanceVisible = attendanceView.style.display !== 'none' && 
                                          window.getComputedStyle(attendanceView).display !== 'none';
                if (!isAttendanceVisible) {
                    logger.log(`Attempt ${attempt}: Attendance view not visible`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for time input table
                const timeTable = attendanceView.querySelector('.hours-report');
                if (!timeTable) {
                    logger.log(`Attempt ${attempt}: Time table not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for at least some time inputs
                const timeInputs = timeTable.querySelectorAll('input.checkIn, input.checkOut');
                if (timeInputs.length === 0) {
                    logger.log(`Attempt ${attempt}: No time inputs found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for submit button
                const submitButton = dialog.querySelector('.save.button-refresh-data.update-freeReporting');
                if (!submitButton) {
                    logger.log(`Attempt ${attempt}: Submit button not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // All checks passed - dialog is ready!
                logger.log(`✅ Dialog fully loaded and ready after ${attempt} attempts`);
                logger.log(`Found ${timeInputs.length} time inputs and submit button`);
                
                return {
                    success: true,
                    message: `Dialog ready after ${attempt} attempts`,
                    details: {
                        timeInputsCount: timeInputs.length,
                        hasSubmitButton: true
                    }
                };
                
            } catch (error) {
                logger.error(`Error on attempt ${attempt}:`, error);
            }
            
            // Wait before next retry (except on last attempt)
            if (attempt < maxRetries) {
                await sleep(delayMs);
            }
        }
        
        // All attempts failed
        logger.log(`❌ Dialog not ready after ${maxRetries} attempts`);
        return {
            success: false,
            error: `Dialog not ready after ${maxRetries} attempts (${maxRetries * delayMs}ms total wait time)`
        };
    }

    /**
     * Check if the dialog is currently open and visible
     * @returns {boolean} True if dialog is open, false otherwise
     */
    isDialogOpen() {
        try {
            const dialog = document.getElementById('freeReporting-dialog');
            
            if (!dialog) {
                logger.log('❌ Dialog element not found in DOM');
                return false;
            }
            
            // Check if dialog is visible (should have display: block when open)
            const isVisible = dialog.style.display === 'block' || 
                             window.getComputedStyle(dialog).display !== 'none';
            
            logger.log(`Dialog visibility check: ${isVisible ? '✅ Open' : '❌ Closed'}`);
            return isVisible;
            
        } catch (error) {
            logger.error('Error checking dialog status:', error);
            return false;
        }
    }
}

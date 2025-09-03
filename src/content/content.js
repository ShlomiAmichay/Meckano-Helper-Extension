 // Meckano Time Tracker Helper - Main Content Script
// Modular architecture with ES6 imports (bundled by Vite)

import { createLogger } from './logger.js';
import { config } from './config.js';
import { DialogManager } from './dialogManager.js';
import { FormManager } from './formManager.js';
import { ConstantDataProvider } from './constantDataProvider.js';

const logger = createLogger('MeckanoFormFiller');

/**
 * Main orchestrator class that controls the entire workflow
 * Coordinates between DialogManager, FormManager, and DataProvider
 */
class MeckanoFormFiller {
    constructor() {
        // Initialize modules
        this.dialogManager = new DialogManager();
        this.formManager = new FormManager();
        this.dataProvider = null; // Will be set when needed
        
        // Set up message listener
        this.initializeMessageListener();
        logger.log('Meckano Form Filler initialized with modular architecture');
    }

    /**
     * Initialize Chrome extension message listener
     * Handles messages from popup for form filling operations
     */
    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            logger.log('Received message:', request);
            
            switch (request.action) {
                case 'fillHours':
                    this.fillWorkingHours(request.data)
                        .then(result => sendResponse(result))
                        .catch(error => {
                            logger.error('Error in fillWorkingHours:', error);
                            sendResponse({ 
                                success: false, 
                                error: error.message 
                            });
                        });
                    break;
                
                default:
                    logger.log('Unknown action received:', request.action);
                    sendResponse({
                        success: false,
                        error: `Unknown action: ${request.action}`
                    });
            }
            
            return true; // Keep message channel open for async response
        });
    }

    /**
     * Main workflow method that orchestrates the entire form filling process
     * @param {object} timeData - Time data from popup (startTime, endTime, humanize)
     * @returns {Promise<object>} Result object with success/error status
     */
    async fillWorkingHours(timeData) {
        logger.log('Starting dialog-based form filling...', timeData);
        
        try {
            // Step 1: Initialize data provider with user's time data
            const { startTime, endTime, humanize } = timeData;
            this.dataProvider = new ConstantDataProvider(startTime, endTime, humanize);
            
            logger.log('✅ Data provider initialized');

            // Step 2: Open dialog
            logger.log('🚪 Opening timesheet dialog...');
            const openResult = await this.dialogManager.openDialog();
            if (!openResult.success) {
                logger.error('Failed to open dialog:', openResult.error);
                return openResult;
            }
            logger.log('✅ Dialog opened successfully');

            // Step 3: Wait for dialog to be ready
            logger.log('⏳ Waiting for dialog to load...');
            const waitResult = await this.dialogManager.waitForDialog();
            if (!waitResult.success) {
                logger.error('Dialog not ready:', waitResult.error);
                return waitResult;
            }
            logger.log('✅ Dialog is ready for input');

            // Step 4: Fill form with time data
            logger.log('📝 Filling time inputs...');
            const fillResult = await this.formManager.fillTimeInputs(this.dataProvider);
            if (!fillResult.success) {
                logger.error('Failed to fill form:', fillResult.error);
                return fillResult;
            }
            logger.log('✅ Time inputs filled successfully');
            
            // Step 5: Submit form
            logger.log('📤 Submitting form...');
            const submitResult = await this.formManager.submitForm();
            if (!submitResult.success) {
                logger.error('Failed to submit form:', submitResult.error);
                return submitResult;
            }
            logger.log('✅ Form submitted successfully');
            
            return {
                success: true,
                message: 'Successfully filled and submitted timesheet!',
                details: {
                    ...fillResult.details,
                    submitted: true
                }
            };
            
        } catch (error) {
            logger.error('Unexpected error in fillWorkingHours:', error);
            return {
                success: false,
                error: `Form filling failed: ${error.message}`
            };
        }
    }
}

// =============================================================================
// INITIALIZE APPLICATION
// =============================================================================
logger.log('Initializing Meckano Time Tracker Helper...');
new MeckanoFormFiller();
logger.log('✅ Application initialized successfully');

// Meckano Dialog Form Filler - Modular Architecture
// Built to support current constant times and future CSV loading

// =============================================================================
// GLOBAL CONFIGURATION & UTILITIES
// =============================================================================
const DEBUG_MODE = true;

function log(module, message, data = null) {
    if (DEBUG_MODE) {
        console.log(`[${module}] ${message}`, data || '');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// DATA PROVIDER MODULE - Abstraction for time data sources
// =============================================================================
class DataProvider {
    constructor() {
        // No individual debug mode - using global
    }

    // Abstract method - takes a date, returns {checkin, checkout} or null
    getTimeData(date) {
        throw new Error('getTimeData(date) must be implemented by subclass');
    }
}

// Constant time provider - current implementation
class ConstantDataProvider extends DataProvider {
    constructor(checkinTime, checkoutTime, humanize = false) {
        super();
        this.checkinTime = checkinTime;
        this.checkoutTime = checkoutTime;
        this.humanize = humanize;
        log('ConstantDataProvider', 
            `Initialized with ${humanize ? 'humanized' : 'constant'} times: ${checkinTime} - ${checkoutTime}`);
    }

    // Returns times for date, optionally with humanization (±20 minutes randomization)
    getTimeData(date) {
        log('ConstantDataProvider', `Getting time data for date: ${date}`);
        
        if (!this.humanize) {
            return {
                checkin: this.checkinTime,
                checkout: this.checkoutTime
            };
        }
        
        // Humanize: add random variation of ±20 minutes to each time
        const checkinHumanized = this.addRandomVariation(this.checkinTime);
        const checkoutHumanized = this.addRandomVariation(this.checkoutTime);
        
        log('ConstantDataProvider', 
            `Humanized times for ${date}: ${checkinHumanized} - ${checkoutHumanized}`);
        log('ConstantDataProvider', 
            `Base times were: ${this.checkinTime} - ${this.checkoutTime}`);
        
        return {
            checkin: checkinHumanized,
            checkout: checkoutHumanized
        };
    }

    // Helper method: Add random variation of ±20 minutes to a time string
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

// =============================================================================
// DIALOG MANAGER MODULE - Handle dialog opening and waiting
// =============================================================================
class DialogManager {
    constructor() {
        // Using global logging
    }

    async openDialog() {
        log('DialogManager', 'Looking for dialog trigger element...');
        
        try {
            // Find the <a> element with classes 'export free-reporting popup-container'
            const triggerElement = document.querySelector('a.export.free-reporting.popup-container');
            
            if (!triggerElement) {
                log('DialogManager', '❌ Dialog trigger element not found');
                return { 
                    success: false, 
                    error: 'Dialog trigger element not found. Make sure you\'re on the correct page.' 
                };
            }
            
            log('DialogManager', '✅ Found dialog trigger element:', triggerElement);
            
            // Click the trigger element to open dialog
            triggerElement.click();
            log('DialogManager', '🖱️ Clicked dialog trigger element');
            
            // Give it a moment for the click to register
            await sleep(100);
            
            return { 
                success: true, 
                message: 'Dialog trigger clicked successfully' 
            };
            
        } catch (error) {
            log('DialogManager', '❌ Error opening dialog:', error.message);
            return { 
                success: false, 
                error: `Failed to open dialog: ${error.message}` 
            };
        }
    }

    async waitForDialog(maxRetries = 10, delayMs = 250) {
        log('DialogManager', `Waiting for dialog to render (${maxRetries} retries, ${delayMs}ms delay)...`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            log('DialogManager', `Wait attempt ${attempt}/${maxRetries}...`);
            
            try {
                // Check if dialog is open
                if (!this.isDialogOpen()) {
                    log('DialogManager', `Attempt ${attempt}: Dialog not yet visible`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check if dialog content is ready
                const dialog = document.getElementById('freeReporting-dialog');
                
                // Check for attendance view (should be active by default)
                const attendanceView = dialog.querySelector('.attendance-view');
                if (!attendanceView) {
                    log('DialogManager', `Attempt ${attempt}: Attendance view not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check if attendance view is visible
                const isAttendanceVisible = attendanceView.style.display !== 'none' && 
                                          window.getComputedStyle(attendanceView).display !== 'none';
                if (!isAttendanceVisible) {
                    log('DialogManager', `Attempt ${attempt}: Attendance view not visible`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for time input table
                const timeTable = attendanceView.querySelector('.hours-report');
                if (!timeTable) {
                    log('DialogManager', `Attempt ${attempt}: Time table not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for at least some time inputs
                const timeInputs = timeTable.querySelectorAll('input.checkIn, input.checkOut');
                if (timeInputs.length === 0) {
                    log('DialogManager', `Attempt ${attempt}: No time inputs found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // Check for submit button
                const submitButton = dialog.querySelector('.save.button-refresh-data.update-freeReporting');
                if (!submitButton) {
                    log('DialogManager', `Attempt ${attempt}: Submit button not found`);
                    await sleep(delayMs);
                    continue;
                }
                
                // All checks passed - dialog is ready!
                log('DialogManager', `✅ Dialog fully loaded and ready after ${attempt} attempts`);
                log('DialogManager', `Found ${timeInputs.length} time inputs and submit button`);
                
                return {
                    success: true,
                    message: `Dialog ready after ${attempt} attempts`,
                    details: {
                        timeInputsCount: timeInputs.length,
                        hasSubmitButton: true
                    }
                };
                
            } catch (error) {
                log('DialogManager', `❌ Error on attempt ${attempt}:`, error.message);
            }
            
            // Wait before next retry (except on last attempt)
            if (attempt < maxRetries) {
                await sleep(delayMs);
            }
        }
        
        // All attempts failed
        log('DialogManager', `❌ Dialog not ready after ${maxRetries} attempts`);
        return {
            success: false,
            error: `Dialog not ready after ${maxRetries} attempts (${maxRetries * delayMs}ms total wait time)`
        };
    }

    isDialogOpen() {
        try {
            const dialog = document.getElementById('freeReporting-dialog');
            
            if (!dialog) {
                log('DialogManager', '❌ Dialog element not found in DOM');
                return false;
            }
            
            // Check if dialog is visible (should have display: block when open)
            const isVisible = dialog.style.display === 'block' || 
                             window.getComputedStyle(dialog).display !== 'none';
            
            log('DialogManager', `Dialog visibility check: ${isVisible ? '✅ Open' : '❌ Closed'}`);
            return isVisible;
            
        } catch (error) {
            log('DialogManager', '❌ Error checking dialog status:', error.message);
            return false;
        }
    }
}

// =============================================================================
// FORM MANAGER MODULE - Handle form filling and submission
// =============================================================================
class FormManager {
    constructor() {
        // Using global logging
    }

    async fillTimeInputs(dataProvider) {
        log('FormManager', 'Starting to fill time inputs...');
        
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
            log('FormManager', `Found ${dateRows.length} date rows to process`);
            
            let filledCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            // Process each date row
            for (const row of dateRows) {
                try {
                    const dateInfo = this.parseDateRow(row);
                    if (!dateInfo) {
                        log('FormManager', 'Skipping row - no date info found');
                        skippedCount++;
                        continue;
                    }
                    
                    log('FormManager', `Processing date: ${dateInfo.date} (${dateInfo.hebrewDay})`);
                    
                    // Check if it's a working day
                    if (this.shouldSkipDate(dateInfo)) {
                        log('FormManager', `⏭️ Skipping ${dateInfo.date} - ${dateInfo.skipReason}`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Skip if row is already complete
                    if (this.isRowComplete(row)) {
                        log('FormManager', `⏭️ Skipping ${dateInfo.date} - already complete`);
                        alreadyFilledCount++;
                        continue;
                    }
                    
                    // Get time data for this date
                    const timeData = dataProvider.getTimeData(dateInfo.date);
                    if (!timeData) {
                        log('FormManager', `❌ No time data available for ${dateInfo.date}`);
                        errorCount++;
                        continue;
                    }
                    
                    // Fill the inputs for this row (only missing ones)
                    const fillResult = await this.fillRowInputs(row, timeData, dateInfo.date);
                    if (fillResult.success) {
                        filledCount++;
                        log('FormManager', `✅ Successfully filled ${dateInfo.date}`);
                    } else {
                        errorCount++;
                        log('FormManager', `❌ Failed to fill ${dateInfo.date}: ${fillResult.error}`);
                    }
                    
                    // Small delay between filling each row
                    await sleep(100);
                    
                } catch (rowError) {
                    log('FormManager', `❌ Error processing row:`, rowError.message);
                    errorCount++;
                }
            }
            
            // Summary
            log('FormManager', `✅ Form filling complete: ${filledCount} filled, ${skippedCount} skipped, ${errorCount} errors`);
            
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
            log('FormManager', '❌ Error in fillTimeInputs:', error.message);
            return {
                success: false,
                error: `Form filling failed: ${error.message}`
            };
        }
    }

    // Helper method: Parse date information from a table row
    parseDateRow(row) {
        try {
            const dateCell = row.querySelector('td.date');
            if (!dateCell) return null;
            
            const dateTextSpan = dateCell.querySelector('.dateText');
            if (!dateTextSpan) return null;
            
            const fullDateText = dateTextSpan.textContent.trim();
            // Expected format: "25/08/2025 ב" 
            const match = fullDateText.match(/(\d{2}\/\d{2}\/\d{4})\s*([א-ת])/);
            if (!match) return null;
            
            const [, dateString, hebrewLetter] = match;
            
            // Check for special day description (holidays)
            const specialSpan = dateCell.querySelector('.specialDayDescription');
            const specialText = specialSpan ? specialSpan.textContent.trim() : '';
            
            return {
                date: dateString,        // "25/08/2025"
                hebrewDay: hebrewLetter, // "ב" 
                specialText: specialText, // "חג" or "ערב חג" or ""
                fullText: fullDateText   // "25/08/2025 ב"
            };
            
        } catch (error) {
            log('FormManager', 'Error parsing date row:', error.message);
            return null;
        }
    }

    // Helper method: Check if date should be skipped (weekends/holidays)
    shouldSkipDate(dateInfo) {
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
        
        return false; // This is a working day
    }

    // Helper method: Check if an input field has data
    isInputFilled(input) {
        return input && input.value.trim() !== '';
    }

    // Helper method: Check if a row has both checkin and checkout filled
    isRowComplete(row) {
        const checkinInput = row.querySelector('input.checkIn');
        const checkoutInput = row.querySelector('input.checkOut');
        return this.isInputFilled(checkinInput) && this.isInputFilled(checkoutInput);
    }

    // Helper method: Fill time inputs for a specific row (only fill missing ones)
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
                log('FormManager', `Filled ${filledParts.join(', ')} for ${date}`);
            }
            
            return { success: true };
            
        } catch (error) {
            return {
                success: false,
                error: `Failed to fill inputs for ${date}: ${error.message}`
            };
        }
    }

    async submitForm() {
        log('FormManager', 'Submitting form...');
        
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
            
            log('FormManager', '✅ Found submit button, clicking...');
            
            // Click the submit button
            submitButton.click();
            log('FormManager', '🖱️ Clicked submit button');
            
            // Wait for form submission to process
            await sleep(500);
            
            // Wait for dialog to close (indicating successful submission)
            const closeSuccess = await this.waitForDialogClose(10, 500); // 5 seconds max
            
            if (closeSuccess.success) {
                log('FormManager', '✅ Form submitted successfully - dialog closed');
                return {
                    success: true,
                    message: 'Form submitted successfully and dialog closed'
                };
            } else {
                log('FormManager', '⚠️ Form clicked but dialog still open - may have validation errors');
                return {
                    success: true,
                    message: 'Submit button clicked, but dialog remained open (check for validation errors)',
                    warning: 'Dialog did not close automatically'
                };
            }
            
        } catch (error) {
            log('FormManager', '❌ Error submitting form:', error.message);
            return {
                success: false,
                error: `Form submission failed: ${error.message}`
            };
        }
    }

    // Helper method: Wait for dialog to close after submission
    async waitForDialogClose(maxRetries = 15, delayMs = 1000) {
        log('FormManager', `Waiting for dialog to close (${maxRetries} retries, ${delayMs}ms delay)...`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const dialog = document.getElementById('freeReporting-dialog');
                
                if (!dialog) {
                    log('FormManager', `✅ Dialog closed (removed from DOM) on attempt ${attempt}`);
                    return { success: true, message: 'Dialog removed from DOM' };
                }
                
                // Check if dialog is no longer visible
                const isVisible = dialog.style.display === 'block' || 
                                 window.getComputedStyle(dialog).display !== 'none';
                
                if (!isVisible) {
                    log('FormManager', `✅ Dialog closed (hidden) on attempt ${attempt}`);
                    return { success: true, message: 'Dialog hidden successfully' };
                }
                
                log('FormManager', `Attempt ${attempt}/${maxRetries}: Dialog still open`);
                
                if (attempt < maxRetries) {
                    await sleep(delayMs);
                }
                
            } catch (error) {
                log('FormManager', `❌ Error checking dialog close on attempt ${attempt}:`, error.message);
            }
        }
        
        log('FormManager', `⚠️ Dialog did not close after ${maxRetries} attempts`);
        return {
            success: false,
            error: `Dialog did not close after ${maxRetries * delayMs}ms`
        };
    }
}

// =============================================================================
// MAIN ORCHESTRATOR - Controls the entire workflow
// =============================================================================
class MeckanoFormFiller {
    constructor() {
        // Initialize modules
        this.dialogManager = new DialogManager();
        this.formManager = new FormManager();
        this.dataProvider = null; // Will be set when needed
        
        // Set up message listener
        this.initializeMessageListener();
        log('MeckanoFormFiller', 'Meckano Form Filler initialized');
    }

    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            log('MeckanoFormFiller', 'Received message:', request);
            
            switch (request.action) {
                case 'fillHours':
                    this.fillWorkingHours(request.data)
                        .then(result => sendResponse(result))
                        .catch(error => sendResponse({ 
                            success: false, 
                            error: error.message 
                        }));
                    break;
            }
            
            return true; // Keep message channel open for async response
        });
    }



    async fillWorkingHours(timeData) {
        log('MeckanoFormFiller', 'Starting dialog-based form filling...', timeData);
        
        try {
            // Step 1: Initialize data provider with user's time data
            const { startTime, endTime, humanize } = timeData;
            this.dataProvider = new ConstantDataProvider(startTime, endTime, humanize);
            
            // Step 2: Open dialog
            const openResult = await this.dialogManager.openDialog();
            if (!openResult.success) {
                return openResult;
            }

            // Step 3: Wait for dialog to be ready
            const waitResult = await this.dialogManager.waitForDialog();
            if (!waitResult.success) {
                return waitResult;
            }

            // Step 4: Fill form - pass dataProvider instead of timeData
            const fillResult = await this.formManager.fillTimeInputs(this.dataProvider);
            if (!fillResult.success) {
                return fillResult;
            }
            
            // Step 5: Submit form
            const submitResult = await this.formManager.submitForm();
            if (!submitResult.success) {
                return submitResult;
            }
            
            return {
                success: true,
                message: 'Successfully filled and submitted dialog form!'
            };
            
        } catch (error) {
            log('MeckanoFormFiller', 'Error in fillWorkingHours:', error.message);
            return {
                success: false,
                error: `Form filling failed: ${error.message}`
            };
        }
    }
}

// =============================================================================
// INITIALIZE
// =============================================================================
new MeckanoFormFiller();

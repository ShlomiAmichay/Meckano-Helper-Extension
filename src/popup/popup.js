// Popup script for Meckano Time Tracker Helper
class MeckanoPopup {
    constructor() {
        this.initializeElements();
        this.loadSettings();
        this.attachEventListeners();
        this.checkTabCompatibility();
    }

    initializeElements() {
        this.startTimeInput = document.getElementById('startTime');
        this.endTimeInput = document.getElementById('endTime');
        this.humanizeInput = document.getElementById('humanizeInput');

        this.fillBtn = document.getElementById('fillBtn');
        this.statusDiv = document.getElementById('status');
        this.statusText = document.getElementById('statusText');
    }

    attachEventListeners() {
        // Save settings when inputs change
        this.startTimeInput.addEventListener('change', () => this.saveSettings());
        this.endTimeInput.addEventListener('change', () => this.saveSettings());
        this.humanizeInput.addEventListener('change', () => this.saveSettings());

        // Button handler
        this.fillBtn.addEventListener('click', () => this.fillHours());
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get({
                startTime: '09:00',
                endTime: '18:00',
                humanize: false
            });

            this.startTimeInput.value = settings.startTime;
            this.endTimeInput.value = settings.endTime;
            this.humanizeInput.checked = settings.humanize;
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showStatus('Failed to load settings', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                startTime: this.startTimeInput.value,
                endTime: this.endTimeInput.value,
                humanize: this.humanizeInput.checked
            };

            await chrome.storage.sync.set(settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async checkTabCompatibility() {
        try {
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });

            const isMeckanoPage = tab?.url?.includes('app.meckano.co.il');
            
            if (!isMeckanoPage) {
                this.showStatus('Please navigate to Meckano reports page first', 'error');
                this.fillBtn.disabled = true;
                return false;
            }

            this.showStatus('Ready to fill hours', 'info');
            return true;
        } catch (error) {
            console.error('Failed to check tab compatibility:', error);
            this.showStatus('Unable to check current page', 'error');
            return false;
        }
    }



    async fillHours() {
        if (!await this.checkTabCompatibility()) {
            return;
        }

        const timeData = {
            startTime: this.startTimeInput.value,
            endTime: this.endTimeInput.value,
            humanize: this.humanizeInput.checked
        };

        // Validate time input
        if (!this.validateTimeInput(timeData)) {
            this.showStatus('Please check your time settings', 'error');
            return;
        }

        this.showStatus('Filling empty time entries... (preserving existing data)', 'info');
        this.fillBtn.disabled = true;

        try {
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'fillHours',
                data: timeData
            });

            if (response && response.success) {
                const filledCount = response.filledCount || 0;
                const skippedCount = response.skippedCount || 0;
                const alreadyFilledCount = response.alreadyFilledCount || 0;
                
                let message = `✅ Filled ${filledCount} new entries`;
                if (alreadyFilledCount > 0) {
                    message += `, ${alreadyFilledCount} already had data`;
                }
                if (skippedCount > 0) {
                    message += `, skipped ${skippedCount} non-working days`;
                }
                
                this.showStatus(message, 'success');
            } else {
                this.showStatus(
                    response?.error || 'Failed to fill hours', 
                    'error'
                );
            }
        } catch (error) {
            console.error('Fill operation failed:', error);
            this.showStatus('Fill operation failed. Please try again.', 'error');
        } finally {
            this.fillBtn.disabled = false;
        }
    }

    validateTimeInput(timeData) {
        const { startTime, endTime } = timeData;
        
        // Check if times are provided
        if (!startTime || !endTime) {
            return false;
        }

        // Convert times to minutes for comparison
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);

        // Check if end time is after start time
        if (endMinutes <= startMinutes) {
            return false;
        }



        return true;
    }

    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    showStatus(message, type = 'info') {
        this.statusText.textContent = message;
        this.statusDiv.className = `status ${type}`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.statusDiv.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MeckanoPopup();
});

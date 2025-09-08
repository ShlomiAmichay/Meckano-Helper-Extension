# 🤖 AGENTS.MD - AI Assistant Guide

## Project Overview

**Meckano Time Tracker Helper** is a Chrome extension that automates filling working hours on the Meckano time 
tracking system (app.meckano.co.il). This is a specialized tool with Hebrew language support, designed for Israeli 
work environments.

### Core Purpose
- Automate time entry on Meckano's Hebrew interface
- Handle Hebrew dates (א-Sunday, ב-Monday, etc.)
- Skip weekends (ו-Friday, ש-Saturday) and holidays (חג/ערב חג)
- Support both constant and humanized (randomized) time entries

## Architecture Overview

### Modern Build System
**Uses Vite for bundling** - source code is modular ES6, bundled to single files for Chrome extension compatibility.

### File Structure
```
src/                        # Source code (modular development)
├── content/               # Content script modules
│   ├── content.js         # Main orchestrator
│   ├── config.js/json     # Configuration system
│   ├── logger.js          # Logging singleton with factory
│   ├── utils.js           # Pure utility functions
│   ├── dataProvider.js    # Abstract base class
│   ├── constantDataProvider.js # Concrete implementation
│   ├── dialogManager.js   # Dialog handling
│   └── formManager.js     # Form filling logic
├── popup/                 # Extension popup
│   ├── popup.js/html/css  # Popup interface
└── public/                # Static assets
    ├── manifest.json      # Chrome extension config
    └── icons/             # Extension icons

dist/                      # Built extension (deploy this)
├── content.js             # Bundled from src/content/*
├── popup.js               # Bundled popup script
└── manifest.json          # Copied from src/public/
```

### Key Components

#### 1. **Popup Interface** (`popup.js`)
- `MeckanoPopup` class manages the extension's UI
- Handles settings (start/end times, humanization toggle)
- Chrome storage API integration
- Tab compatibility checks

#### 2. **Content Script** (`content.js`)
- **Modular architecture** with DataProvider pattern
- `ConstantDataProvider` - current implementation for fixed times
- `PageAnalyzer` - detects and analyzes Meckano timesheet structure
- `FormFiller` - handles actual time input filling
- Extensive Hebrew date parsing and validation

#### 3. **Extension Configuration** (`manifest.json`)
- Manifest v3 compliance
- Restricted to `https://app.meckano.co.il/*`
- Permissions: `activeTab`, `storage`

## Technical Constraints & Considerations

### Critical Rules
- **120-character line limit** - ALL code lines must be ≤120 characters
- **Hebrew language support** - Must handle RTL text and Hebrew dates
- **Weekend/Holiday logic** - Automatically skip ו (Friday), ש (Saturday), and חג entries
- **Meckano-specific** - Only works with app.meckano.co.il DOM structure

### Browser Compatibility
- Chrome extension only (Manifest v3)
- Modern JavaScript (ES6+ classes, async/await)
- Chrome storage API for persistence

### Hebrew Date System
```javascript
// Hebrew day mapping
const HEBREW_DAYS = {
    'א': 'Sunday',    'ב': 'Monday',     'ג': 'Tuesday', 
    'ד': 'Wednesday', 'ה': 'Thursday',   'ו': 'Friday', 
    'ש': 'Saturday'
};

// Skip patterns
const SKIP_PATTERNS = ['ו', 'ש', 'חג', 'ערב חג'];
```

## Development Guidelines for AI Assistants

### 1. **User Interaction Pattern**
- User prefers **explicit instructions** before making changes
- Always ask for clarification on ambiguous requirements
- Don't assume implementation details without confirmation
- Present options and get approval before proceeding

### 2. **Code Quality Standards**
- **Line length**: Maximum 120 characters per line
- **Error handling**: Always include try-catch blocks
- **Logging**: Use the `log(module, message, data)` function for debugging
- **Comments**: Include clear module headers and function documentation

### 3. **Testing Approach**
- Test file: `test.html` (simulates Meckano structure)
- Expected: 4 days total (1 weekend, 1 holiday skipped)
- Console debugging via `[Meckano Helper]` logs
- Chrome DevTools integration

### 4. **Common Modification Patterns**
```javascript
// Adding new DataProvider
class NewDataProvider extends DataProvider {
    getTimeData(date) {
        // Implementation must return {checkin, checkout} or null
    }
}

// Extending Hebrew date handling
function parseHebrewDate(dateString) {
    // Must handle format: "25/08/2025 ב"
}
```

## Key Classes & APIs

### DataProvider Pattern
```javascript
class DataProvider {
    getTimeData(date)  // Abstract: returns {checkin, checkout} or null
}

class ConstantDataProvider extends DataProvider {
    constructor(checkinTime, checkoutTime, humanize = false)
    getTimeData(date)  // Returns constant or humanized times
}
```

### Chrome Extension APIs
```javascript
// Storage
chrome.storage.sync.get(keys)
chrome.storage.sync.set(data)

// Tabs
chrome.tabs.sendMessage(tabId, message)
chrome.tabs.query(options)
```

## Debugging & Troubleshooting

### Debug Mode
- Global `DEBUG_MODE = true` in content.js
- All modules use `log(module, message, data)` function
- Console output format: `[ModuleName] Message`

### Common Issues
1. **Content script not loaded** → Page refresh needed
2. **Hebrew date parsing fails** → Check date format patterns
3. **Input fields not found** → Meckano DOM structure changed
4. **Weekend detection fails** → Hebrew character encoding issues

### Testing Commands
```javascript
// Console testing
ConstantDataProvider.prototype.getTimeData.call(provider, "25/08/2025 ב")
PageAnalyzer.prototype.findTimesheetRows.call(analyzer)
```

## Security & Privacy

- **Sandboxed**: Only accesses app.meckano.co.il
- **Local storage**: All data stored in Chrome's local storage
- **No external calls**: No network requests outside Meckano
- **Minimal permissions**: activeTab + storage only

## Extension Lifecycle

### Installation
1. Load unpacked in Developer Mode
2. Enable on chrome://extensions/
3. Navigate to Meckano reports page
4. Set preferences in popup

### Runtime Flow
1. User opens extension popup → `popup.js` loads
2. User clicks "Fill Hours" → Message sent to content script
3. Content script analyzes page → `PageAnalyzer` runs
4. Time data calculated → `DataProvider` processes
5. Forms filled → `FormFiller` executes

## Future Extensibility

### Planned Features
- CSV data import (DataProvider pattern ready)
- Multiple time profiles
- Advanced scheduling rules
- Export/backup functionality

### Architecture Benefits
- Modular DataProvider allows easy time source switching
- Separate analyzer/filler allows DOM structure changes
- Class-based design supports inheritance and extensions

## Working with This Codebase

### When Adding Features
1. **Understand the pattern** - DataProvider, Analyzer, Filler separation
2. **Test Hebrew handling** - Always verify with Hebrew dates
3. **Check line lengths** - 120 character maximum
4. **Add logging** - Use the established log() function
5. **Consider internationalization** - Hebrew RTL support

### When Debugging
1. **Enable debug mode** - Check `DEBUG_MODE = true`
2. **Check console** - Look for `[Meckano Helper]` logs
3. **Verify DOM** - Meckano structure might change
4. **Test edge cases** - Holidays, weekends, malformed dates

### When Modifying UI
1. **Popup constraints** - Limited space, simple interface
2. **Chrome extension guidelines** - Follow Manifest v3 rules
3. **Hebrew support** - RTL text handling in CSS
4. **Settings persistence** - Use Chrome storage API

---

**Remember**: This extension serves a specific Hebrew business environment. Always consider cultural context, 
language requirements, and local business practices when making modifications.

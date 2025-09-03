# 🕒 Meckano Time Tracker Helper

A Chrome extension to automate filling working hours on the Meckano time tracking system.

## Features

- ⚡ **Quick Time Entry**: Set your standard start/end times (removed break duration for simplicity)
- 🔍 **Smart Analysis**: Automatically detects time input fields on Meckano pages
- 📅 **Hebrew Date Recognition**: Properly handles Hebrew day letters (א-Sunday, ב-Monday, etc.)
- 🚫 **Intelligent Skipping**: Automatically skips weekends (ו-Friday, ש-Saturday) and holidays (חג/ערב חג)
- 💾 **Settings Memory**: Remembers your preferred working hours
- 🌐 **Hebrew Support**: Full support for Hebrew interface and date formats
- 🐛 **Enhanced Debugging**: Detailed logging and error reporting for troubleshooting

## Installation

### For Development/Testing:

1. **Download/Clone** this project to your computer
2. **Create Icons** (see `icons/README.md` for details)
3. **Open Chrome** and go to `chrome://extensions/`
4. **Enable Developer Mode** (toggle in top-right corner)
5. **Click "Load unpacked"** and select the project folder
6. **Pin the extension** to your toolbar for easy access

### For Production:
*(Future: Will be available on Chrome Web Store)*

## How to Use

### Step 1: Navigate to Meckano
1. Go to [app.meckano.co.il](https://app.meckano.co.il)
2. Log in to your account
3. Navigate to the reports/timesheet page

### Step 2: Set Your Working Hours
1. Click the extension icon in your toolbar
2. Set your typical:
   - **Start Time** (e.g., 09:00)
   - **End Time** (e.g., 18:00)  
   - **Break Duration** in minutes (e.g., 60)

### Step 3: Analyze and Fill
1. Click **"🔍 Analyze Page"** to scan for time inputs
2. Once analysis is complete, click **"⚡ Fill Hours"**
3. The extension will automatically fill all detected time entries

## Technical Details

### Files Structure:
- `manifest.json` - Extension configuration
- `popup.html/css/js` - Extension popup interface
- `content.js` - Script that interacts with Meckano website
- `icons/` - Extension icons (16px, 32px, 48px, 128px)

### Permissions:
- `activeTab` - To interact with the current Meckano page
- `storage` - To remember your time preferences
- `https://app.meckano.co.il/*` - Access to Meckano website only

## Troubleshooting

### Common Issues:

**"Analysis failed. Content script not loaded. Try refreshing the page."**
- Refresh the Meckano page and try again
- Make sure the extension is enabled

**"Analysis failed. Make sure you're on the reports page with timesheet data."**
- Navigate to the correct timesheet/reports page
- Make sure there are date entries visible on the page
- Wait for the page to fully load before analyzing

**"No Meckano timesheet structure found"**
- Ensure you're on the timesheet page (not login or other pages)
- Look for a table with Hebrew dates like "25/08/2025 ב"
- Try refreshing the page and waiting a few seconds

### Testing Your Extension:
1. **Test Page**: Open `test.html` in your browser to verify extension functionality
2. **Expected Result**: Should find 4 days total (1 weekend, 1 holiday will be skipped)

### Debug Mode:
Open Chrome DevTools (F12) → Console tab → Look for detailed `[Meckano Helper]` logs showing:
- Page structure analysis
- Hebrew date detection
- Input field discovery
- Filling progress

## Development

### Local Development:
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

### Contributing:
Feel free to submit issues, feature requests, or pull requests!

## Privacy & Security

- ✅ Only accesses Meckano website (`app.meckano.co.il`)
- ✅ Stores preferences locally in Chrome
- ✅ No data sent to external servers
- ✅ No tracking or analytics

## License

This project is for personal/educational use.

---

**Made with ❤️ for easier time tracking**

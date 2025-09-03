# 🏗️ Build Instructions

This Chrome extension uses **Vite** for modern development and bundling.

## 📁 Project Structure

```
src/                    # Source code
├── content/           # Content script modules
│   ├── content.js     # Main entry point
│   ├── config.js      # Configuration management
│   ├── config.json    # App settings
│   ├── logger.js      # Logging system
│   ├── utils.js       # Utility functions
│   ├── dataProvider.js          # Abstract data provider
│   ├── constantDataProvider.js  # Constant time provider
│   ├── dialogManager.js         # Dialog management
│   └── formManager.js          # Form filling logic
├── popup/             # Extension popup
│   ├── popup.js       # Popup logic
│   ├── popup.html     # Popup interface
│   └── popup.css      # Popup styling
└── public/            # Static assets
    ├── manifest.json  # Extension manifest
    └── icons/         # Extension icons

dist/                  # Built extension (deploy this)
├── content.js         # Bundled content script
├── popup.js          # Bundled popup script
├── popup.html        # Copied popup HTML
├── popup.css         # Copied popup CSS
├── manifest.json     # Copied manifest
└── icons/            # Copied icons
```

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Development Build (with watch)
```bash
npm run dev
```
- Rebuilds automatically when source files change
- Load `dist/` folder in Chrome DevTools

### Production Build
```bash
npm run build
```
- Creates optimized bundle in `dist/`
- Ready for Chrome Web Store submission

## 🚀 Deployment

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Package for Web Store:**
   - Zip the `dist/` folder contents
   - Upload to Chrome Web Store

## 📝 Development Workflow

1. **Edit source files** in `src/`
2. **Run dev build** with `npm run dev`
3. **Test in Chrome** by loading `dist/` folder
4. **Reload extension** in Chrome when needed

## ✨ Benefits of This Setup

- 🔥 **Fast Development**: Vite's lightning-fast rebuilds
- 📦 **Modern ES6**: Clean imports/exports in source code
- 🎯 **Single Bundle**: Chrome extension compatible output
- 🧹 **Tree Shaking**: Dead code elimination
- 🔍 **Source Maps**: Easy debugging (in dev mode)
- 📁 **Clean Structure**: Organized by functionality

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure you're loading the `dist/` folder, not `src/`
- Run `npm run build` to create fresh bundle

### Module Import Errors
- Source files use ES6 imports (bundled by Vite)
- Don't load `src/` files directly in Chrome

### Build Errors
- Check console for Vite build errors
- Ensure all imports have correct file extensions (.js)

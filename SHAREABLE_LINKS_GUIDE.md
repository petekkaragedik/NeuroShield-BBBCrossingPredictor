# NeuroShield Shareable Links Feature

## Overview

The NeuroShield app now supports shareable result links that encode compound predictions directly in the URL. Users can share results with a single link that automatically loads the compound and its prediction.

## Features Implemented

### ✅ URL Encoding
- Prediction results are automatically encoded in the URL using query parameters
- URL updates silently on every prediction (no page reload)
- Navigating exploration tree or similar compounds updates the URL
- Clean URL encoding using `URLSearchParams`

**Example URL:**
```
http://localhost:5173/?compound=Aspirin&mw=180.16&logp=1.20&hbd=1&tpsa=63.6&rings=1&rotbonds=3
```

### ✅ URL Restoration on Load
- App detects URL parameters on startup
- Skips hero landing screen if URL contains compound data
- Pre-fills all descriptors from URL parameters
- Auto-runs prediction immediately (no PubChem fetch needed)
- Shows toast notification: "📎 Loaded shared result for {compound name}"

### ✅ Share Button
- Located in top right of prediction result panel
- Next to "Download Report" button
- Copies current URL to clipboard
- Button text changes to "✅ Link Copied!" for 2 seconds
- Toast notification confirms: "Result link copied to clipboard"
- Only visible when prediction result is showing

### ✅ Enhanced Toast System
- New `ToastStack` component replaces old `Toast`
- Toasts stack in top right corner
- Auto-dismiss after 3 seconds
- Manual dismiss with ✕ button
- Smooth animations (slide in from right + fade)
- Maximum 3 toasts visible at once
- Different types: success, error, info, link, share
- Used for all app notifications

### ✅ Navigation URL Updates
- URL updates when navigating exploration tree nodes
- URL updates when exploring similar compounds
- URL updates when loading compounds from batch mode
- Browser back/forward buttons work correctly

## File Structure

```
frontend/src/
├── components/
│   ├── ToastStack.jsx          # New toast notification system
│   ├── ToastStack.css          # Toast styling
│   ├── ResultsPanel.jsx        # Updated with Share button
│   └── ...
├── utils/
│   └── urlState.js             # URL encoding/decoding utilities
└── App.jsx                     # Updated with URL state management
```

## How It Works

### 1. Making a Prediction
When a user makes a prediction:
1. Features and compound name are encoded into URL query parameters
2. URL updates using `window.history.pushState` (no reload)
3. User can now copy and share the URL

### 2. Loading a Shared Link
When someone opens a shared link:
1. App reads URL parameters on mount
2. Skips landing screen
3. Pre-fills features from URL
4. Auto-runs prediction with backend
5. Shows "Loaded shared result" toast
6. User sees the exact same prediction

### 3. Sharing the Result
User clicks "🔗 Share Result" button:
1. Current URL is copied to clipboard
2. Button shows "✅ Link Copied!" feedback
3. Toast notification appears
4. Button reverts to normal after 2 seconds

## API Reference

### URL State Utilities (`utils/urlState.js`)

```javascript
// Encode single compound into URL
encodeSingleCompoundURL(compoundName, features)

// Decode single compound from URL
decodeSingleCompoundURL(searchParams)

// Update browser URL without reload
updateURL(queryString)

// Get current URL params
getURLParams()

// Copy URL to clipboard
copyCurrentURLToClipboard()
```

### Toast Hook

```javascript
import { useToast } from './components/ToastStack'

function MyComponent() {
  const showToast = useToast()

  // Show toast
  showToast('success', 'Operation completed!')
  showToast('error', 'Something went wrong')
  showToast('link', 'Link copied to clipboard')
  showToast('share', 'Loaded shared result')
}
```

## Usage Examples

### Example 1: Share Aspirin Prediction
1. Search for "Aspirin" in the app
2. Click "Predict BBB Permeability"
3. URL automatically updates to:
   ```
   ?compound=Aspirin&mw=180.16&logp=1.20&hbd=1&tpsa=63.6&rings=1&rotbonds=3
   ```
4. Click "🔗 Share Result" to copy link
5. Send link to colleague
6. Colleague opens link → sees same prediction instantly

### Example 2: Direct URL Access
Someone pastes this URL in their browser:
```
http://localhost:5173/?compound=Caffeine&mw=194.19&logp=0.07&hbd=0&tpsa=58.4&rings=2&rotbonds=0
```

Result:
- Landing screen is skipped
- App loads with Caffeine pre-filled
- Prediction runs automatically
- Toast shows: "📎 Loaded shared result for Caffeine"

### Example 3: Exploration Navigation
1. User predicts "Aspirin"
2. Clicks on similar compound "Ibuprofen"
3. URL updates to Ibuprofen's parameters
4. User navigates back in browser
5. Returns to Aspirin (URL restored)

## Future Enhancements

### Compare Mode Sharing (Ready for Implementation)
- Encode multiple compounds in URL: `?mode=compare&c1=Aspirin&c1_mw=180...&c2=Caffeine&c2_mw=194...`
- Restore all compared compounds on load
- Utilities already support this via `encodeCompareURL()` and `decodeCompareURL()`

### Batch Mode
- Batch results are intentionally NOT shareable (too much data)
- Users should use "Download Report" instead
- Future: Could implement server-side result storage for batch sharing

## Testing Checklist

- [x] URL updates on prediction
- [x] URL updates on navigation
- [x] Share button copies URL
- [x] Share button shows feedback
- [x] Toast notification appears
- [x] URL with params skips landing
- [x] URL params auto-run prediction
- [x] Browser back/forward work correctly
- [x] Toast stack shows max 3 toasts
- [x] Toasts auto-dismiss after 3s
- [x] Manual dismiss works
- [ ] Compare mode sharing (not implemented yet)
- [ ] Error handling for malformed URLs

## Known Limitations

1. **Batch Mode**: Results are not shareable via URL (by design)
2. **Compare Mode**: URL sharing ready but not fully implemented
3. **URL Length**: Very long compound names may exceed URL limits
4. **Result Storage**: No server-side storage; prediction re-runs on load
5. **Browser Compatibility**: clipboard API requires HTTPS in production

## Browser Compatibility

- **URL State**: ✅ All modern browsers (IE11+ with polyfill)
- **Clipboard API**: ✅ Chrome 63+, Firefox 53+, Safari 13.1+
- **History API**: ✅ All modern browsers
- **Toast Animations**: ✅ All browsers with CSS transitions

## Production Deployment Notes

1. **HTTPS Required**: Clipboard API requires secure context in production
2. **URL Encoding**: Handles special characters and spaces correctly
3. **SEO**: Shareable links are client-side only (no SSR)
4. **Analytics**: Consider tracking shared link usage
5. **Error Handling**: Malformed URLs gracefully fall back to normal flow

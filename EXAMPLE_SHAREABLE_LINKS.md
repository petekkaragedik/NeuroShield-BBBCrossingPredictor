# Example Shareable Links for Testing

## Quick Test Links

Copy and paste these URLs in your browser to test the shareable links feature:

### Common Drugs (BBB+)

**Aspirin** (BBB+, Common pain reliever)
```
http://localhost:5173/?compound=Aspirin&mw=180.16&logp=1.20&hbd=1&tpsa=63.6&rings=1&rotbonds=3
```

**Caffeine** (BBB+, Stimulant)
```
http://localhost:5173/?compound=Caffeine&mw=194.19&logp=0.07&hbd=0&tpsa=58.4&rings=2&rotbonds=0
```

**Diazepam** (BBB+, Benzodiazepine)
```
http://localhost:5173/?compound=Diazepam&mw=284.74&logp=2.82&hbd=0&tpsa=32.7&rings=3&rotbonds=1
```

**Morphine** (BBB+, Opioid analgesic)
```
http://localhost:5173/?compound=Morphine&mw=285.34&logp=0.89&hbd=2&tpsa=52.9&rings=5&rotbonds=1
```

**Donepezil** (BBB+, Alzheimer's drug)
```
http://localhost:5173/?compound=Donepezil&mw=379.49&logp=4.68&hbd=0&tpsa=38.8&rings=4&rotbonds=7
```

### Common Drugs (BBB-)

**Penicillin** (BBB-, Antibiotic)
```
http://localhost:5173/?compound=Penicillin&mw=334.39&logp=1.83&hbd=3&tpsa=120.6&rings=3&rotbonds=4
```

**Furosemide** (BBB-, Diuretic)
```
http://localhost:5173/?compound=Furosemide&mw=330.74&logp=2.03&hbd=2&tpsa=121.6&rings=2&rotbonds=4
```

**Atenolol** (BBB-, Beta blocker)
```
http://localhost:5173/?compound=Atenolol&mw=266.34&logp=0.16&hbd=4&tpsa=84.6&rings=1&rotbonds=9
```

### Borderline Cases

**Ibuprofen** (Borderline, Anti-inflammatory)
```
http://localhost:5173/?compound=Ibuprofen&mw=206.28&logp=3.97&hbd=1&tpsa=37.3&rings=1&rotbonds=4
```

**Warfarin** (Borderline, Anticoagulant)
```
http://localhost:5173/?compound=Warfarin&mw=308.33&logp=2.70&hbd=1&tpsa=63.6&rings=3&rotbonds=3
```

### Compounds Without Names (Descriptors Only)

**Generic BBB+ Profile**
```
http://localhost:5173/?mw=250&logp=2.5&hbd=1&tpsa=45&rings=2&rotbonds=3
```

**Generic BBB- Profile** (High TPSA)
```
http://localhost:5173/?mw=400&logp=1.0&hbd=5&tpsa=150&rings=2&rotbonds=8
```

**Lipinski-Friendly Profile**
```
http://localhost:5173/?mw=350&logp=3.2&hbd=2&tpsa=75&rings=3&rotbonds=5
```

## Test Scenarios

### Scenario 1: Share a Prediction
1. Open the app normally (no URL params)
2. Search for "Aspirin"
3. Click "Predict BBB Permeability"
4. Notice URL updates automatically
5. Click "🔗 Share Result"
6. Button should show "✅ Link Copied!"
7. Toast appears: "Result link copied to clipboard"
8. Paste URL in new tab → should skip landing and load Aspirin

### Scenario 2: Direct Link Access
1. Paste this URL in browser:
   ```
   http://localhost:5173/?compound=Caffeine&mw=194.19&logp=0.07&hbd=0&tpsa=58.4&rings=2&rotbonds=0
   ```
2. Landing screen should be SKIPPED
3. App loads with Caffeine descriptors
4. Prediction auto-runs
5. Toast shows: "📎 Loaded shared result for Caffeine"
6. Results panel shows Caffeine prediction

### Scenario 3: Navigation Updates URL
1. Open Aspirin link from above
2. Scroll to "Similar Compounds" section
3. Click on "Ibuprofen" (or any similar compound)
4. URL should update to Ibuprofen's parameters
5. Click browser BACK button
6. Should return to Aspirin (URL restored)
7. Click FORWARD button
8. Should go back to Ibuprofen

### Scenario 4: Exploration Tree
1. Predict "Aspirin"
2. Explore similar compound "Salicylic Acid"
3. URL updates to Salicylic Acid
4. Navigate breadcrumbs back to Aspirin
5. URL updates back to Aspirin

### Scenario 5: Toast Stack
1. Open app with URL params → toast appears
2. Click Share button → second toast appears
3. Search for compound not found → third toast appears
4. All 3 toasts should stack vertically
5. Wait 3 seconds → oldest should auto-dismiss
6. Click ✕ on any toast → should dismiss immediately

## URL Parameter Reference

### Required Parameters
- `mw` - Molecular Weight (float)
- `logp` - Lipophilicity (float)
- `hbd` - H-Bond Donors (integer)
- `tpsa` - Topological Polar Surface Area (float)
- `rings` - Ring Count (integer)
- `rotbonds` - Rotatable Bonds (integer)

### Optional Parameters
- `compound` - Compound name (string, URL-encoded)
- `mode` - App mode: 'single' (default), 'compare', 'batch'

### URL Encoding Examples

**Simple name:**
```
compound=Aspirin
```

**Name with spaces:**
```
compound=Valproic%20Acid
```

**Name with special characters:**
```
compound=L-DOPA → compound=L-DOPA (auto-encoded by browser)
```

## Production URLs

When deployed to production, replace `localhost:5173` with your actual domain:

```
https://neuroshield.example.com/?compound=Aspirin&mw=180.16&logp=1.20&hbd=1&tpsa=63.6&rings=1&rotbonds=3
```

## QR Code Generation

For presentations or posters, generate QR codes for shareable links:

1. Go to https://www.qr-code-generator.com/
2. Paste your NeuroShield shareable link
3. Download QR code
4. Users can scan to instantly load the prediction

Example use case:
- Conference poster with QR code linking to example compound
- Research paper supplementary materials
- Lab notebook references

## Bookmarklet (Optional Enhancement)

Create a bookmarklet to quickly share current prediction:

```javascript
javascript:(function(){navigator.clipboard.writeText(window.location.href);alert('Link copied!')})()
```

Users can add this to their browser bookmarks bar for one-click URL copying.

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Make prediction | URL updates automatically |
| Click "Share Result" | URL copied to clipboard |
| Open link with params | Landing skipped, prediction auto-runs |
| Navigate similar compounds | URL updates to new compound |
| Browser back button | Previous compound restored |
| Invalid URL params | Gracefully falls back to landing |
| Missing URL params | Normal landing screen shown |
| Share button click | Shows "Link Copied!" for 2s |
| URL load | Toast: "Loaded shared result" |
| Multiple toasts | Stack vertically (max 3) |

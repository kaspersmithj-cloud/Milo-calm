# Milo Trainer Pro v3.1 Cache Fix

This version fixes the iPhone layout issue by:
- using fresh file names so old cached CSS cannot be reused
- forcing checklist rows to stay full-width
- replacing the service worker cache

Upload/replace ALL files in your GitHub repo root:
- index.html
- styles-v31.css
- app-v31.js
- programme-v31.js
- manifest-v31.json
- sw-v31.js
- README.md

After GitHub Pages updates:
1. Open the site in Safari.
2. Refresh twice.
3. If needed, delete the Home Screen app and add it again.

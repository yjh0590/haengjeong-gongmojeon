ITDA v4.6 - Windows local preview guide
========================================

1. Extract the ZIP file.
2. Open the haengjeong-gongmojeon-main folder.
3. Double-click PREVIEW_START.bat.
4. If Node.js is not installed, install the LTS version from https://nodejs.org/ and restart.
5. First launch runs npm install. Wait for the preview server to start.

Local previews:
- Main home: http://localhost:5173/welcome
- Consumer:  http://localhost:5173/
- Owner:     http://localhost:5173/owner
- Admin:     http://localhost:5173/editor
- Catalog:   http://localhost:5173/catalog

The site is a React/Vite app. Opening index.html directly from Windows Explorer does NOT start the app.
Admin login and data publishing require Supabase environment variables in a local .env file.
You can preview the landing page, customer UI, and owner UI without deployment.
No changes are made to GitHub, Vercel, or Namecheap when previewing locally.

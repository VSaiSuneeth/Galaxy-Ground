# Restore a clean dependency tree

`node_modules` is locked by another Windows process or sync service. Close any terminals, editors, and Explorer windows open in this project, pause OneDrive for the project folder, then run the following in an elevated PowerShell window:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
cmd /c rmdir /s /q "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)\node_modules"
cd "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

For a production-style local check, stop the development server and run:

```powershell
npm run build
npm run preview
```

Run the full local quality gate before deploying:

```powershell
npx tsc --noEmit -p tsconfig.app.json
npm run lint
npm test
```

If Windows still reports a non-empty directory, restart Windows, repeat the commands before opening an editor, and keep the project outside a cloud-synced directory while installing dependencies.

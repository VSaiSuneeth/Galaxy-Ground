# Commands Requiring a Clear Node Tooling State

`npm ci` currently cannot complete because another process holds `node_modules/@esbuild/win32-x64/esbuild.exe` open. Do not delete or unlock it while an active developer server may be using it.

After stopping the process that owns the project esbuild executable, run these commands from the project root in order:

```powershell
npm ci
npm run build
npm test
npx tsc --noEmit -p tsconfig.app.json
npm run lint
```

The commands are local only. Do not run browser or authenticated tests against production data.

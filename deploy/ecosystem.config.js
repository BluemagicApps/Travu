// PM2 process config for Travu (Next.js standalone-or-`next start`).
// Usage on the VPS (from the repo root):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save && pm2 startup   (then run the printed command once, as root)
module.exports = {
  apps: [
    {
      name: "travu",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname + "/..",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: "3000" },
      max_memory_restart: "600M",
      autorestart: true,
    },
  ],
};

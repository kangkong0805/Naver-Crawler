module.exports = {
  apps: [
    {
      name: "ota_crawler",
      script: "src/server.ts",
      exec_mode: "cluster",
      watch: [],
      ignore_watch: [],
      interpreter: "ts-node",
    },
  ],
};

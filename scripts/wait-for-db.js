#!/usr/bin/env node
const net = require("net");

const POSTGRES_PORT = 5432;
const REDIS_PORT = 6379;
const HOST = "localhost";
const MAX_RETRIES = 90; // 90 seconds timeout for Docker image download + startup
const RETRY_INTERVAL_MS = 1000;

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.on("error", () => { socket.destroy(); resolve(false); });
    socket.connect(port, HOST);
  });
}

async function waitForServices() {
  console.log("[wait-db] Waiting for PostgreSQL and Redis...");
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const pg = await checkPort(POSTGRES_PORT);
    const redis = await checkPort(REDIS_PORT);
    if (pg && redis) {
      console.log("[wait-db] All services ready. Starting backend...");
      process.exit(0);
    }
    const waiting = [];
    if (!pg) waiting.push("PostgreSQL");
    if (!redis) waiting.push("Redis");
    console.log(`[wait-db] Attempt ${attempt}/${MAX_RETRIES}: Waiting for ${waiting.join(", ")}...`);
    await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
  }
  console.error("[wait-db] Timeout waiting for services");
  process.exit(1);
}

waitForServices();

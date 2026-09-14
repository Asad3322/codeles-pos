const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const appDir = process.argv[2];

if (!appDir) {
  console.error("Codeles POS app directory was not provided.");
  process.exit(1);
}

const envPath = path.join(appDir, ".env.local");

// Preserve existing configuration during upgrades.
// This prevents AUTH_SECRET/JWT_SECRET from changing on every update.
if (fs.existsSync(envPath)) {
  console.log("Existing Codeles POS configuration found. Keeping it.");
  process.exit(0);
}

const generateSecret = () => crypto.randomBytes(48).toString("base64url");

const authSecret = generateSecret();
const jwtSecret = generateSecret();

const env = [
  "NODE_ENV=production",
  "NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000",
  "NEXT_PUBLIC_APP_NAME=Codeles POS",
  "MONGODB_URI=mongodb://127.0.0.1:27017/pos_system",
  `AUTH_SECRET=${authSecret}`,
  "AUTH_URL=http://127.0.0.1:3000",
  `JWT_SECRET=${jwtSecret}`,
  "SOCKET_PORT=3001",
  "",
].join("\r\n");

fs.writeFileSync(envPath, env, {
  encoding: "utf8",
  flag: "wx",
});

console.log("Codeles POS configuration created successfully.");
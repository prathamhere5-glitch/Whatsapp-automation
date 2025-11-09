import fs from "fs";
import path from "path";

export const SESSIONS_ROOT = process.env.SESSIONS_DIR || path.join(process.cwd(), "sessions");

export function ensureSessionsRoot() {
  if (fs.existsSync(SESSIONS_ROOT)) {
    const stat = fs.lstatSync(SESSIONS_ROOT);
    if (!stat.isDirectory()) {
      fs.rmSync(SESSIONS_ROOT);
    }
  }
  if (!fs.existsSync(SESSIONS_ROOT)) {
    fs.mkdirSync(SESSIONS_ROOT, { recursive: true });
  }
}

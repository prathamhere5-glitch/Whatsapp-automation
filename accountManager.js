import fs from "fs-extra";
import path from "path";
import { ensureSessionsRoot, SESSIONS_ROOT } from "./paths.js";

export const ensureUserFolder = (userId) => {
  ensureSessionsRoot();
  const dir = path.join(SESSIONS_ROOT, userId.toString());
  fs.ensureDirSync(dir);
  return dir;
};

export const listAccounts = (userId) => {
  const userDir = ensureUserFolder(userId);
  return fs.readdirSync(userDir)
    .filter(f => fs.lstatSync(path.join(userDir, f)).isDirectory());
};

export const createAccountFolder = (userId, number) => {
  const dir = ensureUserFolder(userId);
  const accDir = path.join(dir, number);
  fs.ensureDirSync(accDir);
  return accDir;
};

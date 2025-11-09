import fs from "fs-extra";
import path from "path";

export const ensureUserFolder = (userId) => {
  const dir = path.join("sessions", userId.toString());
  fs.ensureDirSync(dir);
  return dir;
};

export const listAccounts = (userId) => {
  const userDir = ensureUserFolder(userId);
  const accounts = fs.readdirSync(userDir).filter(f => fs.lstatSync(path.join(userDir, f)).isDirectory());
  return accounts;
};

export const createAccountFolder = (userId, number) => {
  const userDir = ensureUserFolder(userId);
  const accDir = path.join(userDir, number);
  fs.ensureDirSync(accDir);
  return accDir;
};

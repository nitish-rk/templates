import fs from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureDirExists(path) {
  const dirName = dirname(path);

  try {
    await fs.access(dirName, fs.constants.F_OK);
    return;
  } catch (e) {
    await fs.mkdir(dirName, { recursive: true });
  }
}

import { copyFile, mkdir, rm } from "node:fs/promises";

if (process.argv[2] === "prepare") {
  await rm("dist", { recursive: true, force: true });
  console.log("Sites build directory prepared");
  process.exit(0);
}

await mkdir("dist/server", { recursive: true });
await copyFile("worker/index.js", "dist/server/index.js");

console.log("Sites worker entry copied to dist/server/index.js");

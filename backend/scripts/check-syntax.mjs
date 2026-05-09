import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const ignored = new Set(["node_modules", "dist", "coverage"]);

const collectJsFiles = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectJsFiles(fullPath);
    if (entry.isFile() && fullPath.endsWith(".js")) return [fullPath];
    return [];
  });
};

const files = collectJsFiles(root).filter((file) => statSync(file).isFile());
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`Syntax check failed: ${file}\n`);
    process.stderr.write(result.stderr || result.stdout || "Unknown syntax check error\n");
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Checked syntax for ${files.length} backend JavaScript files.`);

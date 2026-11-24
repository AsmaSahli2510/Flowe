/** Verify that each relative frontend import resolves to a project file. No dependencies required. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const extensions = ["", ".jsx", ".js", ".css", ".png", ".json"];
let checked = 0;
let failures = 0;

function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, item.name);
    if (item.isDirectory()) {
      walk(absolutePath);
    } else if ([".js", ".jsx"].includes(extname(item.name))) {
      const code = readFileSync(absolutePath, "utf8");
      const imports = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g;
      let match;
      while ((match = imports.exec(code))) {
        checked++;
        const target = resolve(dirname(absolutePath), match[1]);
        if (!extensions.some((extension) => existsSync(target + extension))) {
          console.error(`Unresolved: ${absolutePath} → ${match[1]}`);
          failures++;
        }
      }
    }
  }
}
walk(sourceRoot);
console.log(`Checked ${checked} relative imports: ${failures} unresolved.`);
if (failures) process.exitCode = 1;

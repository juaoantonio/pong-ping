import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_ROOT = join(process.cwd(), "src", "modules", "core");
const FORBIDDEN_IMPORTS = [
  /from\s+["']@nestjs\//,
  /from\s+["']typeorm["']/,
  /from\s+["']class-validator["']/,
  /@Entity\b/,
  /@Column\b/,
  /@Primary/,
];

function collectCoreDomainFiles(root: string, insideDomain = false): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry);
    const stat = statSync(path);
    const isDomainPath = insideDomain || entry === "domain";

    if (stat.isDirectory()) {
      files.push(...collectCoreDomainFiles(path, isDomainPath));
    } else if (isDomainPath && path.endsWith(".ts") && !path.endsWith(".spec.ts")) {
      files.push(path);
    }
  }

  return files;
}

describe("independencia do dominio em relacao a frameworks", () => {
  it("mantem arquivos de dominio core livres de imports de framework e persistencia", () => {
    const files = collectCoreDomainFiles(CORE_ROOT);
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");

      return FORBIDDEN_IMPORTS.filter((pattern) => pattern.test(source)).map(
        (pattern) => `${file}: ${pattern}`,
      );
    });

    expect(violations).toEqual([]);
  });
});

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOMAIN_ROOT = join(process.cwd(), "src", "modules");
const FORBIDDEN_IMPORTS = [
  /from\s+["']@nestjs\//,
  /from\s+["']typeorm["']/,
  /from\s+["']class-validator["']/,
  /@Entity\b/,
  /@Column\b/,
  /@Primary/,
];

function collectDomainFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...collectDomainFiles(path));
    } else if (path.endsWith(".ts") && !path.endsWith(".spec.ts")) {
      files.push(path);
    }
  }

  return files;
}

describe("independencia do dominio em relacao a frameworks", () => {
  it("mantem arquivos de dominio livres de imports de framework e persistencia", () => {
    const files = collectDomainFiles(DOMAIN_ROOT);
    const violations = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");

      return FORBIDDEN_IMPORTS.filter((pattern) => pattern.test(source)).map(
        (pattern) => `${file}: ${pattern}`,
      );
    });

    expect(violations).toEqual([]);
  });
});

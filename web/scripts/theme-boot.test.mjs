import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(path, require) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const context = { exports: {}, require };
  vm.runInNewContext(outputText, context);
  return context.exports;
}

const config = loadModule("../src/lib/preferences/preferences-config.ts");
const { ThemeBootScript } = loadModule("../src/scripts/theme-boot.tsx", (id) => {
  if (id === "react/jsx-runtime") return { jsx: (_tag, props) => props };
  assert.equal(id, "@/lib/preferences/preferences-config");
  return config;
});
const script = ThemeBootScript().dangerouslySetInnerHTML.__html;

function boot(cookie) {
  const attrs = new Map();
  const root = {
    classList: { toggle() {} },
    style: {},
    setAttribute(key, value) {
      attrs.set(key, value);
    },
  };
  const warnings = [];
  vm.runInNewContext(script, {
    document: { documentElement: root, cookie },
    window: {},
    console: { warn: (...args) => warnings.push(args) },
  });
  return { attrs, root, warnings };
}

test("a malformed preference cookie falls back without discarding other choices", () => {
  const { attrs, root, warnings } = boot("theme_mode=dark; font=%; sidebar_variant=inset");
  assert.equal(attrs.get("data-theme-mode"), "dark");
  assert.equal(root.style.colorScheme, "dark");
  assert.equal(attrs.get("data-font"), "geist");
  assert.equal(attrs.get("data-sidebar-variant"), "inset");
  assert.deepEqual(warnings, []);
});

test("valid percent-encoded values still restore the preference", () => {
  const { attrs } = boot("theme_mode=%64ark; font=geist");
  assert.equal(attrs.get("data-theme-mode"), "dark");
});

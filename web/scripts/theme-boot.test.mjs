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

function requireI18n(id) {
  assert.equal(id, "@/i18n");
  return { t: (label) => label };
}

const modules = {
  "react/jsx-runtime": { jsx: (_tag, props) => props },
  "@/lib/fonts/registry": { fontRegistry: { geist: {}, geistMono: {} } },
  "@/lib/preferences/layout": loadModule("../src/lib/preferences/layout.ts", requireI18n),
  "@/lib/preferences/preferences-config": loadModule("../src/lib/preferences/preferences-config.ts"),
  "@/lib/preferences/theme": loadModule("../src/lib/preferences/theme.ts", requireI18n),
};
const { ThemeBootScript } = loadModule("../src/scripts/theme-boot.tsx", (id) => {
  assert.ok(Object.hasOwn(modules, id), id);
  return modules[id];
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

test("unsupported saved preferences fall back to valid defaults", () => {
  const { attrs } = boot("theme_mode=dark; theme_preset=retired; font=removed; sidebar_variant=old-layout");
  assert.equal(attrs.get("data-theme-mode"), "dark");
  assert.equal(attrs.get("data-theme-preset"), "default");
  assert.equal(attrs.get("data-font"), "geist");
  assert.equal(attrs.get("data-sidebar-variant"), "floating");
});

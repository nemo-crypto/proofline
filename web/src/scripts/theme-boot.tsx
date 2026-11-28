/**
 * Boot script that reads user preference values (theme mode, theme preset,
 * content layout, navbar style) from cookies or localStorage based on the
 * configured persistence mode.
 *
 * Runs early in <head> to apply the correct data attributes before hydration,
 * preventing layout or theme flicker and keeping RootLayout fully static.
 */
import { fontRegistry } from "@/lib/fonts/registry";
import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
} from "@/lib/preferences/layout";
import { PREFERENCE_DEFAULTS, PREFERENCE_PERSISTENCE, type PreferenceKey } from "@/lib/preferences/preferences-config";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "@/lib/preferences/theme";

const allowedValues = {
  theme_mode: THEME_MODE_VALUES,
  theme_preset: THEME_PRESET_VALUES,
  font: Object.keys(fontRegistry),
  content_layout: CONTENT_LAYOUT_VALUES,
  navbar_style: NAVBAR_STYLE_VALUES,
  sidebar_variant: SIDEBAR_VARIANT_VALUES,
  sidebar_collapsible: SIDEBAR_COLLAPSIBLE_VALUES,
} satisfies Record<PreferenceKey, readonly string[]>;

export function ThemeBootScript() {
  const code = `
    (function () {
      try {
        var root = document.documentElement;
        var PERSISTENCE = ${JSON.stringify(PREFERENCE_PERSISTENCE)};
        var DEFAULTS = ${JSON.stringify(PREFERENCE_DEFAULTS)};

        var ALLOWED = ${JSON.stringify(allowedValues)};

        function readCookie(name) {
          var prefix = name + "=";
          var match = document.cookie.split(";").map(function(c) {
            return c.trimStart();
          }).find(function(c) {
            return c.startsWith(prefix);
          });
          if (!match) return null;
          try {
            return decodeURIComponent(match.slice(prefix.length));
          } catch (e) {
            return null;
          }
        }

        function readLocal(name) {
          try {
            return window.localStorage.getItem(name);
          } catch (e) {
            return null;
          }
        }

        function readPreference(key) {
          var mode = PERSISTENCE[key];
          var value = null;

          if (mode === "localStorage") {
            value = readLocal(key);
          }

          if (!value && (mode === "client-cookie" || mode === "server-cookie")) {
            value = readCookie(key);
          }

          return ALLOWED[key].includes(value) ? value : DEFAULTS[key];
        }

        var mode = readPreference("theme_mode");
        var preset = readPreference("theme_preset");
        var font = readPreference("font");
        var contentLayout = readPreference("content_layout");
        var navbarStyle = readPreference("navbar_style");
        var sidebarVariant = readPreference("sidebar_variant");
        var sidebarCollapsible = readPreference("sidebar_collapsible");

        var resolvedMode =
          mode === "system" && window.matchMedia
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            : mode;

        root.classList.toggle("dark", resolvedMode === "dark");
        root.setAttribute("data-theme-mode", mode);
        root.setAttribute("data-theme-preset", preset);
        root.setAttribute("data-font", font);
        root.setAttribute("data-content-layout", contentLayout);
        root.setAttribute("data-navbar-style", navbarStyle);
        root.setAttribute("data-sidebar-variant", sidebarVariant);
        root.setAttribute("data-sidebar-collapsible", sidebarCollapsible);

        root.style.colorScheme = resolvedMode === "dark" ? "dark" : "light";

      } catch (e) {
        console.warn("ThemeBootScript error:", e);
      }
    })();
  `;

  /* biome-ignore lint/security/noDangerouslySetInnerHtml: required for pre-hydration boot script */
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

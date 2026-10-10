import opentype from "opentype.js";

const FONT_NAME = "WebJamIcons";
const FONT_MIME = "font/otf";

const UNITS_PER_EM = 1000;
const ASCENDER = 800;
const DESCENDER = -200;
const ADVANCE_WIDTH = 1000;

export type IconPaths = Record<string, string | opentype.Path>;

export interface IconFontResult {
  css: string;
  font: ArrayBuffer;
}

/**
 * Converts an ArrayBuffer to a percent-encoded data URL.
 *
 * We deliberately encode bytes rather than using encodeURIComponent()
 * on a binary string, which would incorrectly UTF-8 encode bytes > 127.
 */
function arrayBufferToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  let encoded = "";

  for (const byte of bytes) {
    encoded += `%${byte.toString(16).padStart(2, "0")}`;
  }

  return `data:${FONT_MIME},${encoded}`;
}

/**
 * Generates a font and CSS from a map of icon names → SVG path data.
 *
 * Example:
 *
 * {
 *   house: 'M0 500 L500 0 L1000 500 ...',
 *   person: 'M...',
 * }
 *
 * Produces selectors such as:
 *
 * [icon-house]::before {
 *   content: "\\E000";
 * }
 */
export function generateIconFont(icons: IconPaths): IconFontResult {
  const notdef = new opentype.Glyph({
    name: ".notdef",
    advanceWidth: ADVANCE_WIDTH,
    path: new opentype.Path(),
  });

  const glyphs: opentype.Glyph[] = [notdef];

  const cssRules: string[] = [];

  let unicode = 0xe000;

  for (const [name, iconPath] of Object.entries(icons)) {
    let path: opentype.Path;
    if (typeof iconPath === "string") {
      // No types for opentype.js 2.0 yet
      // @ts-expect-error
      path = opentype.Path.fromSVG(iconPath, {
        flipY: true,
        flipYBase: UNITS_PER_EM,
      }) as opentype.Path;
    } else {
      path = iconPath;
    }

    const glyph = new opentype.Glyph({
      name,
      unicode,
      advanceWidth: ADVANCE_WIDTH,
      path,
    });

    glyphs.push(glyph);

    const hex = unicode.toString(16).toUpperCase().padStart(4, "0");

    cssRules.push(`
.icon-${name} {
  font-family: "${FONT_NAME}";
  font-style: normal;
}

.icon-${name}::before {
  content: "\\${hex}";
}`);

    unicode++;
  }

  const font = new opentype.Font({
    familyName: FONT_NAME,
    styleName: "Regular",
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  });

  const buffer = font.toArrayBuffer();
  const dataUrl = arrayBufferToDataUrl(buffer);

  const css = `
@font-face {
  font-family: "${FONT_NAME}";
  src: url("${dataUrl}") format("opentype");
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

${cssRules.join("\n")}
`;

  return {
    css,
    font: buffer,
  };
}

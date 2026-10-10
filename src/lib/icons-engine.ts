import { generateIconFont } from "@/lib/font-icons-gen";

import opentype from "opentype.js";

import regular2 from "../../public/font-awesome/regular.json";
import solid2 from "../../public/font-awesome/solid.json";
import brands2 from "../../public/font-awesome/brands.json";

const regular = regular2 as Record<string, string>;
const solid = solid2 as Record<string, string>;
const brands = brands2 as Record<string, string>;

export type IconsAvailable = "faSolid" | "faRegular" | "faBrands";

export const iconsPrefixes: Record<IconsAvailable, string> = {
  faSolid: "fa",
  faRegular: "far",
  faBrands: "fab",
};

export const iconsFontsNames: Record<IconsAvailable, string> = {
  faSolid: "Font Awesome 7 Solid",
  faRegular: "Font Awesome 7 Regular",
  faBrands: "Font Awesome 7 Brands",
};

export type IconsDeclaration = Record<IconsAvailable, string[]>;

export const iconsMaps: Record<IconsAvailable, Record<string, string>> = {
  faSolid: solid,
  faRegular: regular,
  faBrands: brands,
};

async function fetchFont(path: string) {
  const response = await fetch(path);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const font = opentype.parse(buffer);
    return font;
  } else {
    throw new Error(response.statusText);
  }
}

export async function generateIconsFontCss(
  iconsExtracts: Record<IconsAvailable, string[]>,
) {
  const fonts: Record<IconsAvailable, opentype.Font> = {
    faSolid: await fetchFont("/font-awesome/fa-solid-900.ttf"),
    faRegular: await fetchFont("/font-awesome/fa-regular-400.ttf"),
    faBrands: await fetchFont("/font-awesome/fa-brands-400.ttf"),
  };

  const icons: { [key: string]: opentype.Path } = {};

  Object.entries(iconsExtracts).forEach(([iconFontName, iconsToExtract]) => {
    const prefix = iconsPrefixes[iconFontName as IconsAvailable];
    iconsToExtract.forEach((iconName) => {
      const unicodeChar = iconsMaps[iconFontName as IconsAvailable][iconName];
      if (unicodeChar) {
        icons[`${prefix}-${iconName}`] =
          fonts[iconFontName as IconsAvailable].charToGlyph(unicodeChar).path;
      } else {
        throw new Error(`Could not find icon ${iconName} in ${iconFontName}`);
      }
    });
  });

  const { css } = generateIconFont(icons);

  return css;
}

export function scanForIcons(text: string): IconsDeclaration {
  const icons: IconsDeclaration = {
    faSolid: [],
    faRegular: [],
    faBrands: [],
  };

  Object.entries(iconsPrefixes).forEach(([iconFontName, prefix]) => {
    // const names = Object.keys(iconsMaps[iconFontName as IconsAvailable]);

    const regex = new RegExp(`\\bicon-${prefix}-([a-zA-Z0-9-]+)\\b`, "g");
    text.matchAll(regex).forEach((match) => {
      icons[iconFontName as IconsAvailable].push(match[1]!);
    });
  });

  return icons;
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// tokens.css custom property -> DESIGN.md colour name, per colour scheme. `--footer-bg` is the footer
// background: it keeps its light-mode value in dark mode, so it has no dark entry.
const LIGHT = {
  '--primary': 'primary',
  '--on-primary': 'on-primary',
  '--secondary': 'secondary',
  '--on-secondary': 'on-secondary',
  '--surface': 'neutral',
  '--on-surface': 'on-surface',
  '--surface-soft': 'surface-soft',
  '--footer-bg': 'on-surface',
} as const;

const DARK = {
  '--surface': 'neutral-dark',
  '--on-surface': 'on-surface-dark',
  '--surface-soft': 'surface-soft-dark',
} as const;

const design = parse(readFileSync('DESIGN.md', 'utf8').split('---')[1]) as {
  colors: Record<string, string>;
};
const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Custom properties declared in the block that opens with `selector {`. */
function declared(selector: RegExp): Record<string, string> {
  const block =
    css.match(new RegExp(selector.source + String.raw`\s*\{([^}]*)\}`, selector.flags))?.[1] ?? '';
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, name, value]) => [
      name,
      value.toUpperCase(),
    ]),
  );
}

const light = declared(/^:root/m);
const dark = declared(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root/);

describe('tokens.css matches DESIGN.md', () => {
  for (const [property, colour] of Object.entries(LIGHT)) {
    it(`light ${property} is colors.${colour}`, () => {
      expect(light[property]).toBe(design.colors[colour].toUpperCase());
    });
  }

  for (const [property, colour] of Object.entries(DARK)) {
    it(`dark ${property} is colors.${colour}`, () => {
      expect(dark[property]).toBe(design.colors[colour].toUpperCase());
    });
  }

  it('theme-color meta tags are the Hero green in both colour schemes', () => {
    const layout = readFileSync('src/layouts/Page.astro', 'utf8');
    const themeColour = (scheme: 'light' | 'dark') =>
      layout
        .match(new RegExp(String.raw`name="theme-color" content="(#[0-9a-fA-F]{6})" media="\(prefers-color-scheme: ${scheme}\)"`))?.[1]
        ?.toUpperCase();
    expect(themeColour('light')).toBe(design.colors['primary'].toUpperCase());
    expect(themeColour('dark')).toBe(design.colors['primary'].toUpperCase());
  });

  it('every DESIGN.md colour is mapped to a token', () => {
    const mapped = new Set<string>([...Object.values(LIGHT), ...Object.values(DARK)]);
    expect(Object.keys(design.colors).filter((name) => !mapped.has(name))).toEqual([]);
  });
});

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

// Every text-on-background pair the Home page and not-found page use, by DESIGN.md colour name.
const PAIRS = [
  ['on-primary', 'primary'],
  ['on-secondary', 'secondary'],
  ['on-surface', 'neutral'],
  ['on-surface', 'surface-soft'],
  ['on-primary', 'on-surface'],
  ['on-surface-dark', 'neutral-dark'],
  ['on-surface-dark', 'surface-soft-dark'],
] as const;

describe('text colours meet WCAG AA', () => {
  for (const [foreground, background] of PAIRS) {
    it(`${foreground} on ${background} is at least 4.5:1`, () => {
      expect(contrast(design.colors[foreground], design.colors[background])).toBeGreaterThanOrEqual(4.5);
    });
  }
});

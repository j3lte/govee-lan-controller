import { colord, random, extend, AnyColor, Colord } from "colord";
import a11yPlugin from "colord/plugins/a11y";
import cmykPlugin from "colord/plugins/cmyk";
import harmoniesPlugin from "colord/plugins/harmonies";
import hwbPlugin from "colord/plugins/hwb";
import labPlugin from "colord/plugins/lab";
import lchPlugin from "colord/plugins/lch";
import mixPlugin from "colord/plugins/mix";
import namesPlugin from "colord/plugins/names";
import xyzPlugin from "colord/plugins/xyz";

extend([
  a11yPlugin,
  cmykPlugin,
  harmoniesPlugin,
  hwbPlugin,
  labPlugin,
  lchPlugin,
  mixPlugin,
  namesPlugin,
  xyzPlugin,
]);

type ColorInput = AnyColor | Colord;
export { colord, random, ColorInput, Colord };

const slope = (n: number, m: number): number => {
  if (n > m * 2) {
    return slope(n - m * 2, m);
  } else if (n > m) {
    return m * 2 - n;
  } else if (n < 0) {
    return slope(n + m * 2, m);
  } else {
    return n;
  }
};

/**
 * Fade between two colors. Returns an array of Colord objects.
 *
 * @param steps Amount of steps to fade between the two colors. Minimum 3.
 * @param from Color to fade from. Should be a Colord object.
 * @param to Color to fade to. Should be a Colord object.
 * @returns Array of Colord objects.
 */
export const fade = (steps: number, from: Colord, to: Colord): Colord[] => {
  const fromRgb = from.toRgb();
  const toRgb = to.toRgb();

  const result: Colord[] = [from];
  const intAmount = steps - 1;

  const rDiff = (toRgb.r - fromRgb.r) / intAmount;
  const gDiff = (toRgb.g - fromRgb.g) / intAmount;
  const bDiff = (toRgb.b - fromRgb.b) / intAmount;
  const colour = { r: fromRgb.r, g: fromRgb.g, b: fromRgb.b };

  for (let i = 0; i < intAmount - 1; i++) {
    colour.r = slope(colour.r + rDiff, 255);
    colour.g = slope(colour.g + gDiff, 255);
    colour.b = slope(colour.b + bDiff, 255);
    result.push(colord(colour));
  }

  result.push(to);

  return result;
};

/**
 * Get a random color. You can specify if you want a light or dark color, which is based on `Colord.brighness()`.
 *
 * @param isLight (Optional) If `true`, the color will be light. If `false`, the color will be dark. If `undefined`, the color will be random.
 * @returns Colord object.
 * @example
 *
 * const randomColor = getRandomColor();
 * const randomLightColor = getRandomColor(true);
 * const randomDarkColor = getRandomColor(false);
 */
export const getRandomColor = (isLight?: boolean): Colord => {
  const color = random();
  if (typeof isLight === "undefined") {
    return color;
  } else if (isLight) {
    return color.isLight() ? color : getRandomColor(true);
  } else {
    return color.isDark() ? color : getRandomColor(false);
  }
};

import { colord, fade, random, getRandomColor } from "./lib/color";
export type { Colord } from "./lib/color";
export * as actions from "./actions";
export * from "./types";
export { Govee } from "./govee";
export { Device, DeviceState } from "./device";

export const color = {
  colord,
  fade,
  random,
  getRandomColor,
};

import { Device, color, Colord } from "../";

// TODO implement more actions

/**
 * Fade to a random color
 *
 * @param device Govee device
 * @param steps Number of steps to fade, minimum 3
 * @param duration Duration of fade in milliseconds, minimum 100
 * @param lastColor (Optional) Last color to fade from (defaults to current color)
 * @returns Colord of the random color that was faded to
 */
export const fadeRandom = async (
  device: Device,
  steps: number,
  duration: number,
  lastColor?: Colord
): Promise<Colord> => {
  const fromColor = lastColor ?? device.colorObj;
  const randomColor = color.getRandomColor();
  await device.fadeToColor(randomColor, steps, duration, fromColor);
  return randomColor;
};

/**
 * Loop fade to a random color
 *
 * @param device Govee device
 * @param steps Number of steps to fade, minimum 3
 * @param duration Duration of fade in milliseconds, minimum 100
 * @param loop Function that returns a promise that resolves to a boolean. If true, the loop will continue.
 * @param lastColor (Optional) Last color to fade from (defaults to current color)
 * @returns Promise that resolves when the loop is finished
 */
export const loopFadeRandom = async (
  device: Device,
  steps: number,
  duration: number,
  loop: () => Promise<boolean>,
  lastColor?: Colord
): Promise<void> => {
  const lastRandomColor = await fadeRandom(device, steps, duration, lastColor);
  if (await loop()) {
    return loopFadeRandom(device, steps, duration, loop, lastRandomColor);
  }
};

/**
 * Flash a color
 *
 * @param device Govee device
 * @param color Color to flash
 * @param times Number of times to flash
 * @param offDuration Duration of off state in milliseconds
 * @param onDuration Duration of on state in milliseconds
 */
export const flashColor = async (
  device: Device,
  color: Colord,
  times: number,
  offDuration: number,
  onDuration: number
): Promise<void> => {
  await device.sync();
  const lastState = device.getState();
  await device.turnOff();
  await device.setColor(color);
  for (let i = 0; i < times; i++) {
    await device.turnOff();
    await sleep(offDuration);
    await device.turnOn();
    await sleep(onDuration);
  }
  if (lastState.onOff === 0) {
    await device.turnOff();
  }
  if (lastState.info.lastChanged === "color") {
    await device.setColor(lastState.color);
  } else if (lastState.info.lastChanged === "temp") {
    await device.setColorKelvin(lastState.colorTemInKelvin);
  }
};

/**
 * Sleep for a certain amount of milliseconds. Utility function for async/await.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

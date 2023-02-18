import { Socket } from "node:dgram";
import { EventEmitter } from "node:events";
import { sleep } from "./actions";
import { Colord, colord, ColorInput, fade } from "./lib/color";
import { rgb2colorTemperature } from "./lib/color-temp";
import { getDeviceModel } from "./lib/device-model";
import { sendSocketMsg } from "./lib/socket";
import { GoveeSocketMessage } from "./lib/socket-message";
import {
  GoveeDeviceData,
  GoveeDeviceStatusData,
  GoveeDeviceEventTypes,
  GoveeDeviceEvents,
  DeviceStateLastChanged,
  DeviceStateInfo,
} from "./types";

interface DeviceOpts {
  socket: Socket;
  debug: (msg: unknown, ...args: unknown[]) => void;
  updateInterval?: number;
  autoUpdate?: boolean;
}

export interface DeviceState {
  onOff: 0 | 1;
  brightness: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
  colorTemInKelvin: number;
}

export class Device extends EventEmitter {
  readonly id: string;
  readonly model: string;
  readonly versions: {
    ble: {
      hard: string;
      soft: string;
    };
    wifi: {
      hard: string;
      soft: string;
    };
  };
  readonly supported: boolean;
  readonly name: string;

  private ip: string;
  private socket: Socket;
  private debug: (msg: unknown, ...args: unknown[]) => void;

  private firstUpdate = false;
  private lastUpdate = -1;
  private lastStateChange = -1;
  /** Not used yet */
  private busy = false;
  /** Used in the device state to determine which one we have to send to the device when restoring state */
  private lastChanged: DeviceStateLastChanged = null;

  private readonly updateIntervalNumber: number;
  private updateInterval: NodeJS.Timeout | null = null;

  private state: DeviceState = {
    onOff: 0,
    brightness: 0,
    color: {
      r: 0,
      g: 0,
      b: 0,
    },
    colorTemInKelvin: 0,
  };

  constructor(data: GoveeDeviceData, options: DeviceOpts) {
    super();
    const { socket, debug, updateInterval, autoUpdate } = options;

    this.socket = socket;
    this.debug = debug;

    const { name, supported } = getDeviceModel(data.sku);
    this.name = name;
    this.supported = supported;

    this.id = data.device;
    this.model = data.sku;
    this.ip = data.ip;
    this.versions = {
      ble: {
        hard: data.bleVersionHard,
        soft: data.bleVersionSoft,
      },
      wifi: {
        hard: data.wifiVersionHard,
        soft: data.wifiVersionSoft,
      },
    };

    this.updateIntervalNumber = updateInterval ?? 60_000;
    if (typeof autoUpdate === "undefined" || autoUpdate) {
      this.autoUpdate();
    }
  }

  private _sendMsg(msg: string): Promise<number> {
    this.debug(`Sending message to ${this.ip}: ${msg}`);
    return new Promise((resolve, reject) => {
      sendSocketMsg(this.socket, msg, this.ip, (error, bytes) => {
        if (error) {
          return reject(error);
        }
        resolve(bytes);
      });
    });
  }

  get ipAddr(): string {
    return this.ip;
  }

  get isOn(): boolean {
    return this.state.onOff === 1;
  }

  get brightness(): number {
    return this.state.brightness;
  }

  get color(): {
    r: number;
    g: number;
    b: number;
  } {
    return { ...this.state.color };
  }

  get colorObj(): Colord {
    return colord(this.color);
  }

  get colorTemperature(): number {
    return this.state.colorTemInKelvin;
  }

  /**
   * Destroy the device. This will stop the update interval and remove all listeners
   */
  destroy(): void {
    this.autoUpdate(false);
    this.removeAllListeners();
  }

  /**
   * This is called when the device sends an update. Should not be called by the user. It checks if the ip has changed and emits an event if it has
   *
   * @param data Device data
   */
  updateDevice(data: GoveeDeviceData): void {
    if (this.ip !== data.ip) {
      this.emit(GoveeDeviceEventTypes.IpChange, data.ip);
      this.ip = data.ip;
    }
  }

  /**
   * This is called when the device sends a status update. Should not be called by the user
   *
   * @param data Device status data
   */
  updateState(data: GoveeDeviceStatusData): void {
    let hasChanges = false;
    const oldState = this.getState();

    if (oldState.onOff !== data.onOff) {
      this.state.onOff = data.onOff;
      hasChanges = true;
    }

    if (oldState.brightness !== data.brightness) {
      this.state.brightness = data.brightness;
      hasChanges = true;
    }

    if (
      oldState.color.r !== data.color.r ||
      oldState.color.g !== data.color.g ||
      oldState.color.b !== data.color.b
    ) {
      this.state.color = data.color;
      this.lastChanged = "color";
      hasChanges = true;
    }

    if (data.colorTemInKelvin) {
      if (oldState.colorTemInKelvin !== data.colorTemInKelvin) {
        this.state.colorTemInKelvin = data.colorTemInKelvin;
        this.lastChanged = "temp";
        hasChanges = true;
      }
    } else {
      const temp = rgb2colorTemperature({
        red: data.color.r,
        green: data.color.g,
        blue: data.color.b,
      });
      if (oldState.colorTemInKelvin !== temp) {
        this.state.colorTemInKelvin = temp;
        hasChanges = true;
      }
    }

    if (!this.firstUpdate || hasChanges) {
      this.lastStateChange = Date.now();
      this.firstUpdate = true;
    }
    this.lastUpdate = Date.now();

    this.debug(
      `Device ${this.id} state updated: ${hasChanges ? "yes" : "no"}}`
    );
    if (hasChanges) {
      this.debug(JSON.stringify(this.getState()));
      this.emit(GoveeDeviceEventTypes.StateChange, this.getState());
    }
    this.emit(GoveeDeviceEventTypes.GotUpdate);
  }

  /**
   * Switch auto update of the state on/off
   *
   * @param on Whether to turn on or off the auto update
   */
  autoUpdate(on = true): void {
    if (on) {
      if (!this.updateInterval) {
        this.triggerUpdate();
        this.updateInterval = setInterval(() => {
          this.triggerUpdate();
        }, this.updateIntervalNumber);
      }
    } else if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Trigger the Govee API to update the device state
   */
  triggerUpdate(): void {
    void this._sendMsg(GoveeSocketMessage.UpdateDevice());
  }

  /**
   * Get the current state of the device. This is not guaranteed to be up to date. Use `waitForFirstUpdate` to make sure the state is up to date
   * before using this. It also includes some extra information about the last update and last state change.
   *
   * @returns The current state of the device
   */
  getState(): DeviceState & DeviceStateInfo {
    return {
      info: {
        lastUpdate: this.lastUpdate,
        lastStateChange: this.lastStateChange,
        lastChanged: this.lastChanged,
      },
      ...this.state,
    };
  }

  /**
   * Wait for the first state update to be received to make sure the device state is in sync with the device
   *
   * @returns Promise that resolves when the first state update is received
   */
  waitForFirstUpdate(): Promise<void> {
    if (this.firstUpdate) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.once(GoveeDeviceEventTypes.StateChange, () => {
        resolve();
      });
    });
  }

  /**
   * Wait for an update to be received to make sure the device state is in sync with the device
   * @returns Promise that resolves when an update is received
   */
  sync(): Promise<void> {
    this.debug(`Wait for an update for ${this.id}`);
    return new Promise((resolve) => {
      // Because we're working with UDP we can't be sure that the message will be received. So we'll just keep sending the message until we get an update
      const interval = setInterval(() => {
        this.triggerUpdate();
      }, 50);
      this.once(GoveeDeviceEventTypes.GotUpdate, () => {
        clearInterval(interval);
        resolve();
      });
    });
  }

  /**
   * Turn on the device
   */
  async turnOn(): Promise<void> {
    this.debug(`Turning on device ${this.id}`);
    await this._sendMsg(GoveeSocketMessage.TurnOn());
    this.state.onOff = 1;
  }

  /**
   * Turn off the device
   */
  async turnOff(): Promise<void> {
    this.debug(`Turning off device ${this.id}`);
    await this._sendMsg(GoveeSocketMessage.TurnOff());
    this.state.onOff = 0;
  }

  /**
   * Set the brightness of the device
   *
   * @param brightness 0-100
   */
  async setBrightness(brightness: number): Promise<void> {
    const setBrightness = Math.max(0, Math.min(100, brightness));
    this.debug(`Setting brightness of device ${this.id} to ${setBrightness}`);
    await this._sendMsg(GoveeSocketMessage.SetBrightness(setBrightness));
    this.state.brightness = setBrightness;
  }

  /**
   * Set the color temperature of the device
   *
   * @param colorTemp 2000-9000
   * @param safe If true, the color temperature will be clamped to the range 2000-9000 (default true)
   */
  async setColorKelvin(colorTemp: number, safe = true): Promise<void> {
    const setTemp = safe
      ? Math.max(1000, Math.min(9000, colorTemp))
      : colorTemp;
    this.debug(`Setting color temperature of device ${this.id} to ${setTemp}`);
    this.lastChanged = "temp";
    await this._sendMsg(GoveeSocketMessage.SetColorKelvin(setTemp));
    this.state.colorTemInKelvin = setTemp;
  }

  /**
   * Set the color of the device
   *
   * @param color `{ r: 0-255, g: 0-255, b: 0-255 }`
   */
  async setColorRGB(color: { r: number; g: number; b: number }): Promise<void> {
    const newColor = {
      r: Math.max(0, Math.min(255, color.r)),
      g: Math.max(0, Math.min(255, color.g)),
      b: Math.max(0, Math.min(255, color.b)),
    };
    this.debug(
      `Setting color of device ${this.id} to ${JSON.stringify(newColor)}`
    );
    this.lastChanged = "color";
    await this._sendMsg(
      GoveeSocketMessage.SetColorRGB(newColor.r, newColor.g, newColor.b)
    );
    this.state.color = newColor;
  }

  /**
   * Set the color of the device, using Colord
   *
   * @param input Colord | color input
   * @param brightness 0-100 (optional)
   */
  async setColor(
    input: ColorInput,
    brightness: number | null = null
  ): Promise<void> {
    const setBrightness =
      brightness !== null ? Math.max(0, Math.min(100, brightness)) : null;
    const color = colord(input);
    if (color.isValid()) {
      const { r, g, b } = color.toRgb();
      this.debug(
        `Setting color of device ${this.id} to ${JSON.stringify({ r, g, b })}`
      );
      this.lastChanged = "color";
      await this._sendMsg(GoveeSocketMessage.SetColorRGB(r, g, b));
      this.state.color = { r, g, b };
      if (setBrightness !== null) {
        await this._sendMsg(GoveeSocketMessage.SetBrightness(setBrightness));
        this.state.brightness = setBrightness;
      }
    } else {
      throw new Error(`Invalid color :, ${JSON.stringify(input)}`);
    }
  }

  /**
   * Fade the device to a color
   * @param inputColor Colord | color input
   * @param steps Number of steps to fade (min 3, max 100000000)
   * @param duration Duration of fade in milliseconds (min 100, max 100000000)
   * @param fromColor Colord | color input (optional)
   * @returns Promise that resolves when the fade is complete
   * @throws Error if the input color is invalid
   * @throws Error if the from color is invalid
   */
  async fadeToColor(
    inputColor: ColorInput,
    steps: number,
    duration: number,
    fromColor: ColorInput | null = null
  ): Promise<void> {
    const dur = Math.min(100_000_000, Math.max(100, duration));
    const stepsClamped = Math.min(100_000_000, Math.max(3, steps));
    const sleepTime = dur / stepsClamped;
    const to = colord(inputColor);
    const from = colord(fromColor ?? this.state.color);
    if (to.isValid() && from.isValid()) {
      const fadeRange = fade(stepsClamped, from, to);
      for (const color of fadeRange) {
        await this.setColor(color);
        await sleep(sleepTime);
      }
    } else {
      throw new Error(
        `Invalid fade to:, ${JSON.stringify(
          inputColor
        )}, from: ${JSON.stringify(fromColor)}`
      );
    }
  }

  //   async flash(onOff: number, duration: number): Promise<void> {
  //     const dur = Math.min(100_000_000, Math.max(100, duration));
  //     await this._sendMsg(SOCKET_MSG_FLASH(onOff, dur));
  //   }
}

export interface Device {
  addListener<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  on<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  once<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  prependListener<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  prependOnceListener<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  off<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  removeAllListeners<E extends keyof GoveeDeviceEvents>(event?: E): this;
  removeListener<E extends keyof GoveeDeviceEvents>(
    event: E,
    listener: GoveeDeviceEvents[E]
  ): this;
  emit<E extends keyof GoveeDeviceEvents>(
    event: E,
    ...args: Parameters<GoveeDeviceEvents[E]>
  ): boolean;
  eventNames(): (keyof GoveeDeviceEvents | string | symbol)[];
  rawListeners<E extends keyof GoveeDeviceEvents>(
    event: E
  ): GoveeDeviceEvents[E][];
  listeners<E extends keyof GoveeDeviceEvents>(
    event: E
  ): GoveeDeviceEvents[E][];
  listenerCount<E extends keyof GoveeDeviceEvents>(event: E): number;
  getMaxListeners(): number;
  setMaxListeners(maxListeners: number): this;
}

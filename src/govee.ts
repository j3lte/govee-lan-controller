import { RemoteInfo, Socket } from "node:dgram";
import { EventEmitter } from "node:events";
import { debug } from "debug";
import { Device } from "./device";
import { createListenSocket, sendSocketMsg } from "./lib/socket";
import { GoveeSocketMessage } from "./lib/socket-message";
import {
  GoveeEventTypes,
  GoveeResponseMessage,
  GoveeDeviceStatusData,
  GoveeEvents,
} from "./types";

export interface GoveeOptions {
  /**
   * Address to bind to. If not provided, will bind to all available addresses
   */
  listenTo?: string;
  /**
   * Whether to automatically discover devices on the network
   */
  discover: boolean;
  /**
   * Interval in milliseconds to send a discovery message to the network
   */
  discoverInterval: number;
  /**
   * Whether to enable debug logging
   */
  debug: boolean;
}

export class Govee extends EventEmitter {
  private isReady = false;
  private discoverInterval: NodeJS.Timeout | null = null;
  private opts: GoveeOptions;
  private socket: Socket | null = null;
  private deviceMap = new Map<string, Device>();
  private debugger = debug("govee");

  constructor(options?: Partial<GoveeOptions>) {
    super();
    this.opts = {
      discover: options?.discover ?? true,
      discoverInterval: options?.discoverInterval ?? 300_000,
      debug: options?.debug ?? false,
      listenTo: options?.listenTo,
    };
    if (this.opts.debug) {
      this.debugger.enabled = true;
    }
    this.init().catch((err: Error) => {
      this.debug("Error initializing Govee instance: %s", err.message);
      this.emit(GoveeEventTypes.Error, err);
    });
  }

  private async init(): Promise<void> {
    this.debug("Govee instance initializing, waiting for socket to be ready");
    this.socket = await createListenSocket(this.opts.listenTo);
    this.socket.on("message", this.onReceiveMessage.bind(this));

    if (this.opts.discover) {
      this.discover();
      this.discoverInterval = setInterval(() => {
        this.discover();
      }, this.opts.discoverInterval);
    }

    this.debug("Govee instance initialized");
    this.isReady = true;
    this.emit(GoveeEventTypes.Ready);
  }

  private onReceiveMessage(msg: Buffer, info: RemoteInfo): void {
    try {
      const data = JSON.parse(msg.toString()) as GoveeResponseMessage;
      if (data.msg?.cmd === "scan") {
        const deviceID = data.msg.data.device;
        if (!this.deviceMap.has(deviceID)) {
          const device = new Device(data.msg.data, {
            socket: this.socket!,
            debug: this.debug.bind(this),
          });
          this.deviceMap.set(deviceID, device);
          this.debug(`New device discovered: ${deviceID}`);
          this.emit(GoveeEventTypes.NewDevice, device);
        } else {
          const device = this.deviceMap.get(deviceID)!;
          this.debug(`Device scan update: ${deviceID}`);
          device.updateDevice(data.msg.data);
        }
        this.emit(GoveeEventTypes.Scan, data.msg.data);
      } else if (data.msg?.cmd === "devStatus") {
        this.updateDeviceStateByIP(info.address, data.msg.data);
      } else {
        this.debug(`Unknown message received`);
        this.debug(data);
        this.emit(GoveeEventTypes.UnknownMessage, data);
      }
    } catch (error) {
      this.emit(GoveeEventTypes.Error, error);
    }
  }

  private updateDeviceStateByIP(ip: string, data: GoveeDeviceStatusData): void {
    const device = this.devices.find((device) => device.ipAddr === ip);
    if (device) {
      this.debug(`Device state update: ${ip} :: ${device.id}`);
      device.updateState(data);
    } else {
      this.debug(`Device state update: ${ip} :: unknown device`);
      this.emit(GoveeEventTypes.UnknownDevice, data);
    }
  }

  private debug(msg: unknown, ...args: unknown[]): void {
    if (this.opts.debug) {
      if (args.length === 0) {
        this.debugger(msg);
      } else {
        this.debugger(msg, args);
      }
    }
  }

  setDebug(debug: boolean): void {
    this.opts.debug = debug;
    this.debugger.enabled = debug;
  }

  get devices(): Device[] {
    return Array.from(this.deviceMap.values());
  }

  async getDevice(id?: string): Promise<Device> {
    await this.waitForDevices();
    if (!id) {
      return this.devices[0];
    }
    if (!this.deviceMap.has(id)) {
      throw new Error(`Device ${id} not found`);
    }
    return this.deviceMap.get(id)!;
  }

  async waitForReady(): Promise<Govee> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve(this);
      } else {
        this.once(GoveeEventTypes.Ready, () => resolve(this));
      }
    });
  }

  async waitForDevices(): Promise<Govee> {
    await this.waitForReady();
    return new Promise((resolve) => {
      if (this.devices.length > 0) {
        resolve(this);
      } else {
        this.once(GoveeEventTypes.NewDevice, () => {
          resolve(this);
        });
      }
    });
  }

  discover() {
    this.debug(
      `Discovering devices on ${this.socket?.address()?.address ?? "unknown"}`
    );
    this.socket &&
      sendSocketMsg(this.socket, GoveeSocketMessage.BroadCastDiscover());
  }

  stopDiscover() {
    if (this.discoverInterval) {
      this.debug("Stopping discovery");
      clearInterval(this.discoverInterval);
      this.discoverInterval = null;
    }
  }

  destroy() {
    this.stopDiscover();
    this.devices.forEach((device) => device.destroy());
    this.socket?.close();
    this.removeAllListeners();
    this.emit(GoveeEventTypes.Destroy);
  }
}

export interface Govee {
  addListener<E extends keyof GoveeEvents>(
    event: E,
    listener: GoveeEvents[E]
  ): this;
  on<E extends keyof GoveeEvents>(event: E, listener: GoveeEvents[E]): this;
  once<E extends keyof GoveeEvents>(event: E, listener: GoveeEvents[E]): this;
  prependListener<E extends keyof GoveeEvents>(
    event: E,
    listener: GoveeEvents[E]
  ): this;
  prependOnceListener<E extends keyof GoveeEvents>(
    event: E,
    listener: GoveeEvents[E]
  ): this;

  off<E extends keyof GoveeEvents>(event: E, listener: GoveeEvents[E]): this;
  removeAllListeners<E extends keyof GoveeEvents>(event?: E): this;
  removeListener<E extends keyof GoveeEvents>(
    event: E,
    listener: GoveeEvents[E]
  ): this;

  emit<E extends keyof GoveeEvents>(
    event: E,
    ...args: Parameters<GoveeEvents[E]>
  ): boolean;
  // The sloppy `eventNames()` return type is to mitigate type incompatibilities - see #5
  eventNames(): (keyof GoveeEvents | string | symbol)[];
  rawListeners<E extends keyof GoveeEvents>(event: E): GoveeEvents[E][];
  listeners<E extends keyof GoveeEvents>(event: E): GoveeEvents[E][];
  listenerCount<E extends keyof GoveeEvents>(event: E): number;

  getMaxListeners(): number;
  setMaxListeners(maxListeners: number): this;
}

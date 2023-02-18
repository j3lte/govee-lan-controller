import { Device, DeviceState } from "./device";

export enum GoveeSocketMsgCommand {
  Scan = "scan",
  DevStatus = "devStatus",
  Turn = "turn",
  Brightness = "brightness",
  ColorWc = "colorwc",
}

export interface GoveeDeviceData {
  ip: string;
  device: string;
  sku: string;
  bleVersionHard: string;
  bleVersionSoft: string;
  wifiVersionHard: string;
  wifiVersionSoft: string;
}

export interface GoveeDeviceStatusData {
  onOff: 0 | 1;
  brightness: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
  colorTemInKelvin: number;
}

interface GoveeGenericMessage<T> {
  cmd: GoveeSocketMsgCommand;
  data: T;
}

export interface GoveeScanMessage extends GoveeGenericMessage<GoveeDeviceData> {
  cmd: GoveeSocketMsgCommand.Scan;
}

export interface GoveeDeviceStatusMessage
  extends GoveeGenericMessage<GoveeDeviceStatusData> {
  cmd: GoveeSocketMsgCommand.DevStatus;
}

export interface GoveeResponseMessage {
  msg?: GoveeScanMessage | GoveeDeviceStatusMessage;
}

export enum GoveeEventTypes {
  Ready = "ready",
  Destroy = "destroy",
  Error = "error",
  NewDevice = "new_device",
  UnknownDevice = "unknown_device",
  Scan = "scan",
  UnknownMessage = "unknown_message",
}

export interface GoveeEvents {
  [GoveeEventTypes.Ready]: () => void;
  [GoveeEventTypes.Destroy]: () => void;
  [GoveeEventTypes.Error]: (err: Error | unknown) => void;
  [GoveeEventTypes.NewDevice]: (device: Device) => void;
  [GoveeEventTypes.UnknownDevice]: (data: GoveeDeviceStatusData) => void;
  [GoveeEventTypes.Scan]: (data: GoveeDeviceData) => void;
  [GoveeEventTypes.UnknownMessage]: (data: GoveeResponseMessage) => void;
}

export enum GoveeDeviceEventTypes {
  IpChange = "ip_change",
  StateChange = "state_change",
  GotUpdate = "got_update",
}

/** Indicates if color or temp is last changed */
export type DeviceStateLastChanged = "color" | "temp" | null;

/** Extra information on the device state */
export interface DeviceStateInfo {
  info: {
    lastUpdate: number;
    lastStateChange: number;
    lastChanged: DeviceStateLastChanged;
  };
}

export interface GoveeDeviceEvents {
  [GoveeDeviceEventTypes.IpChange]: (ip: string) => void;
  [GoveeDeviceEventTypes.StateChange]: (
    state: DeviceState & DeviceStateInfo
  ) => void;
  [GoveeDeviceEventTypes.GotUpdate]: () => void;
}

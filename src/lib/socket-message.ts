import { GoveeSocketMsgCommand } from "../types";

export const getSocketMsg = (cmd: string, data: unknown) => {
  return JSON.stringify({
    msg: {
      cmd,
      data,
    },
  });
};

export const GoveeSocketMessage = {
  BroadCastDiscover: () =>
    getSocketMsg(GoveeSocketMsgCommand.Scan, {
      account_topic: "reserve",
    }),
  UpdateDevice: () => getSocketMsg(GoveeSocketMsgCommand.DevStatus, {}),
  TurnOn: () => getSocketMsg(GoveeSocketMsgCommand.Turn, { value: 1 }),
  TurnOff: () => getSocketMsg(GoveeSocketMsgCommand.Turn, { value: 0 }),
  SetBrightness: (value: number) =>
    getSocketMsg(GoveeSocketMsgCommand.Brightness, { value }),
  SetColorKelvin: (value: number) =>
    getSocketMsg(GoveeSocketMsgCommand.ColorWc, { colorTemInKelvin: value }),
  SetColorRGB: (r: number, g: number, b: number) =>
    getSocketMsg(GoveeSocketMsgCommand.ColorWc, { color: { r, g, b } }),
};

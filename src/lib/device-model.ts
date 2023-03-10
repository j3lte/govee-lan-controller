export const supportedModels = [
  "H6046",
  "H6047",
  "H6051",
  "H6052",
  "H6056",
  "H6059",
  "H6061",
  "H6062",
  "H6065",
  "H6066",
  "H6067",
  "H6072",
  "H6073",
  "H6076",
  "H6087",
  "H610A",
  "H610B",
  "H6110",
  "H6117",
  "H6141",
  "H6143",
  "H6144",
  "H6159",
  "H615A",
  "H615B",
  "H615C",
  "H6163",
  "H6172",
  "H618A",
  "H618C",
  "H618E",
  "H618F",
  "H619A",
  "H619B",
  "H619C",
  "H619D",
  "H619E",
  "H619Z",
  "H61A0",
  "H61A1",
  "H61A2",
  "H61A3",
  "H61A5",
  "H61B2",
  "H61E1",
  "H7050",
  "H7060",
  "H7061",
  "H7062",
  "H7065",
];
export const supportedModelsNameMap: Record<string, string> = {
  H6046: "Govee RGBIC TV Light Bars",
  H6047: "Govee RGBIC Gaming Light Bars",
  H6051: "Govee Aura Lite Table Lamp",
  H6052: "Govee Aura Smart Table Lamp",
  H6056: "Govee RGBICWW WiFi + Bluetooth Flow Plus Light Bars",
  H6059: "Govee RGBWW Night Light",
  H6061: "Govee Glide Hexa Light Panels",
  H6062: "Govee Glide Wall Light",
  H6065: "Govee Glide Y Lights",
  H6066: "Govee Glide Hexa Pro Light Panels",
  H6067: "Govee Triangle Light Panels",
  H6072: "Govee Lyra RGBICWW Corner Floor Lamp",
  H6073: "Govee LED Floor Lamp",
  H6076: "Govee RGBICWW Smart Corner Floor Lamp",
  H6087: "Govee RGBIC Smart Wall Sconces",
  H610A: "Govee RGBIC LED Wall Light",
  H610B: "Govee RGBIC LED Wall Lights",
  H6110: "Govee Wi-Fi RGB LED Strip Lights",
  H6117: "Govee 32.8ft RGBIC LED Strip Lights",
  H6141: "Govee Smart LED Strip Lights",
  H6143: "Govee RGBIC Alexa LED Strip Lights",
  H6144: "Govee RGBIC Wi-Fi+Bluetooth LED Strip Lights",
  H6159: "Govee Smart LED Strip Lights",
  H615A: "Govee Smart WiFi LED Strip Lights",
  H615B: "Govee LED Strip Lights",
  H615C: "Govee Smart WiFi LED Strip Lights",
  H6163: "Govee 16.4ft RGBIC LED Strip Lights",
  H6172: "Govee Wi-Fi RGBIC Outdoor Strip Lights",
  H618A: "Govee RGBIC Basic Wi-Fi + Bluetooth LED Strip Lights",
  H618C: "Govee RGBIC Basic Wi-Fi + Bluetooth LED Strip Lights (1*10m)",
  H618E: "Govee RGBIC Basic Wi-Fi + Bluetooth LED Strip Lights (2*10m)",
  H618F: "Govee RGBIC Basic Wi-Fi + Bluetooth LED Strip Lights (1*50m)",
  H619A: "Govee RGBIC Wi-Fi + Bluetooth Strip Lights (1*5m)",
  H619B: "Govee RGBIC Wi-Fi + Bluetooth LED Strip Lights",
  H619C: "Govee RGBIC Wi-Fi + Bluetooth Strip Lights (1*10m)",
  H619D: "Govee RGBIC Wi-Fi + Bluetooth Strip Lights (2*10m)",
  H619E: "Govee RGBIC Wi-Fi + Bluetooth Strip Lights (2*10m)",
  H619Z: "Govee RGBIC Pro LED Strip Lights",
  H61A0: "Govee Neon LED Strip Light (3m)",
  H61A1: "Govee Neon LED Strip Light (2m)",
  H61A2: "Govee Neon LED Strip Light (5m)",
  H61A3: "Govee RGBIC Neon Rope Light (4m)",
  H61A5: "Govee Neon LED Strip Light (10m)",
  H61B2: "Govee RGBIC Neon TV Backlight",
  H61E1: "Govee LED Strip Light M1",
  H7050: "Govee RGBIC Wi-Fi + Bluetooth Outdoor Ground Lights",
  H7060: "Govee RGBICWW LED Smart Flood Lights",
  H7061: "Govee RGBICWW LED Smart Flood Lights",
  H7062: "Govee RGBICWW LED Smart Flood Lights",
  H7065: "Govee RGBICWW LED Smart Flood Lights",
};

/**
 * Attempts to get the device model name from the model string.
 *
 * @param model Model of the device, e.g. "H619A". This is the model that is returned by the Govee device as `GoveeDeviceData.sku`
 * @returns Object with supported and name properties.
 *
 * - `supported` is a boolean indicating if the model is supported by this library.
 * - `name` is the name of the model.
 *
 * Keep in mind that this is not a guarantee that the device is supported by this library, as Govee may update their devices, add new models, etc.
 */
export const getDeviceModel = (model: string) => {
  const supported = supportedModels.map((m) => m.toLowerCase()).includes(model);
  const name = supportedModelsNameMap[model] || "Govee - Unknown";
  return { supported, name };
};

Govee LAN Controller
====================

[![npm](https://img.shields.io/npm/v/@j3lte/govee-lan-controller?label=NPM&logo=npm&style=flat-square)](https://www.npmjs.com/package/@j3lte/govee-lan-controller)
[![License](https://img.shields.io/github/license/j3lte/govee-lan-controller?color=%2344cc10&label=License&logo=github&style=flat-square)](https://github.com/j3lte/govee-lan-controller/blob/main/LICENSE)
[![GitHub Bugs](https://img.shields.io/github/issues-search/j3lte/govee-lan-controller?label=Bugs&logo=github&query=is%3Aopen%20label%3Abug&style=flat-square)](https://github.com/j3lte/govee-lan-controller/issues)
[![GitHub issues](https://img.shields.io/github/issues/j3lte/govee-lan-controller?label=Issues&style=flat-square)](https://github.com/j3lte/govee-lan-controller/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/j3lte/govee-lan-controller?label=Last%20Commit&logo=github&style=flat-square)](https://github.com/j3lte/govee-lan-controller/commits/main)
![npm type definitions](https://img.shields.io/npm/types/@j3lte/govee-lan-controller?style=flat-square)
[![Bundlephobia](https://img.shields.io/bundlephobia/min/@j3lte/govee-lan-controller?label=Size&style=flat-square)](https://bundlephobia.com/package/@j3lte/govee-lan-controller@latest)

This is a Node.js library for controlling Govee devices over the LAN.


## Installation

```bash
npm install @j3lte/govee-lan-controller
```

## Usage

```typescript
import { Govee } from '@j3lte/govee-lan-controller';

const run = async () => {
    const govee = new Govee();
    const device = await govee.getDevice();

    if (device) {
        await device.turnOn();
        await device.setBrightness(50);
        await device.setColor('red');
    }
}

run();
```

## API

API documentation is available [here](https://j3lte.github.io/govee-lan-controller/).

## License

MIT

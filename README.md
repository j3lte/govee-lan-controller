Govee LAN Controller
====================

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

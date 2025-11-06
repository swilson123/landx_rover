# Waveshare DDSM Driver HAT (A) - Node.js Driver

Node.js implementation with auto-connect and complete motor control API.

## Quick Install

```bash
npm install
```

## Enable I2C First

```bash
sudo raspi-config
# Interface Options > I2C > Enable
sudo usermod -a -G i2c $USER
# Log out and back in
```

## Usage

### Interactive CLI
```bash
node cli.js
```

### Run Example
```bash
node example.js
```

### Run Tests
```bash
npm test
```

### Quick Code Example
```javascript
const WaveshareDriverHAT = require('./driver');

const driver = new WaveshareDriverHAT();
await driver.connect();
await driver.forward('M1', 50);
await driver.sleep(2000);
await driver.stop('M1');
await driver.disconnect();
```

See `README.md` for full documentation.

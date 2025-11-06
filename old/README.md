# Waveshare DDSM Driver HAT (A) - Node.js Driver

Complete Node.js driver for the Waveshare DDSM Driver HAT (A) on Raspberry Pi 5, with auto-connect and full motor control capabilities.

## Features

- **Auto-detection and connection** to the Driver HAT via I2C
- **Dual motor control** (M1, M2) with independent speed and direction
- **Speed control** from 0-100% with direction (forward/backward)
- **Brake and stop commands** for immediate or coasting stops
- **PWM frequency configuration** (24-1526 Hz)
- **Raw I2C command** send/receive for advanced control
- **Status monitoring** with register readouts
- **Error handling** with validation and clear error messages

## Hardware Requirements

- Raspberry Pi 5 (or compatible)
- Waveshare DDSM Driver HAT (A)
- Motors connected to M1 and/or M2 terminals

## Prerequisites

### 1. Enable I2C on Raspberry Pi

```bash
sudo raspi-config
# Navigate to: Interface Options > I2C > Enable
# Reboot if prompted
```

Verify I2C is enabled:
```bash
ls /dev/i2c-*
# Should show: /dev/i2c-1
```

### 2. Install I2C Tools (Optional, for testing)

```bash
sudo apt-get update
sudo apt-get install -y i2c-tools
```

Detect the Driver HAT:
```bash
sudo i2cdetect -y 1
# Should show device at address 0x40
```

### 3. Set I2C Permissions

Add your user to the i2c group:
```bash
sudo usermod -a -G i2c $USER
```

Log out and log back in for changes to take effect.

## Installation

### Install Node.js Dependencies

```bash
cd /home/rover/rover_hat
npm install
```

This will install the required `i2c-bus` package.

## Quick Start

### Basic Usage

```javascript
const WaveshareDriverHAT = require('./driver');

async function main() {
  const driver = new WaveshareDriverHAT();
  
  try {
    // Auto-connect
    await driver.connect();
    
    // Move Motor 1 forward at 50% speed
    await driver.forward('M1', 50);
    
    // Wait 2 seconds
    await driver.sleep(2000);
    
    // Stop Motor 1
    await driver.stop('M1');
    
    // Disconnect
    await driver.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### Run Example Script

```bash
node example.js
```

The example script demonstrates all available commands.

### Run Tests

```bash
node test.js
```

## API Documentation

### Constructor

```javascript
const driver = new WaveshareDriverHAT(options);
```

**Options:**
- `busNumber` (number): I2C bus number (default: 1)
- `address` (number): I2C address (default: 0x40)
- `frequency` (number): PWM frequency in Hz (default: 1000)

### Connection Methods

#### `connect()`
Auto-detect and connect to the Driver HAT.

```javascript
await driver.connect();
```

Returns: `Promise<boolean>` - Connection status

#### `disconnect()`
Disconnect from the Driver HAT and stop all motors.

```javascript
await driver.disconnect();
```

### Motor Control Methods

#### `setMotor(motor, speed)`
Set motor speed and direction.

```javascript
await driver.setMotor('M1', 75);   // M1 forward at 75%
await driver.setMotor('M2', -50);  // M2 backward at 50%
```

**Parameters:**
- `motor` (string): Motor name ('M1' or 'M2')
- `speed` (number): Speed percentage (-100 to 100, negative for reverse)

#### `forward(motor, speed)`
Run motor forward.

```javascript
await driver.forward('M1', 60);  // M1 forward at 60%
```

**Parameters:**
- `motor` (string): Motor name ('M1' or 'M2')
- `speed` (number): Speed percentage (0-100, default: 100)

#### `backward(motor, speed)`
Run motor backward.

```javascript
await driver.backward('M2', 80);  // M2 backward at 80%
```

**Parameters:**
- `motor` (string): Motor name ('M1' or 'M2')
- `speed` (number): Speed percentage (0-100, default: 100)

#### `stop(motor)`
Stop a specific motor (coast to stop).

```javascript
await driver.stop('M1');
```

**Parameters:**
- `motor` (string): Motor name ('M1' or 'M2')

#### `brake(motor)`
Brake a specific motor (immediate stop).

```javascript
await driver.brake('M1');
```

**Parameters:**
- `motor` (string): Motor name ('M1' or 'M2')

#### `stopAll()`
Stop all motors.

```javascript
await driver.stopAll();
```

#### `brakeAll()`
Brake all motors immediately.

```javascript
await driver.brakeAll();
```

#### `setBothMotors(speed)`
Set both motors to the same speed (for driving straight).

```javascript
await driver.setBothMotors(70);   // Both forward at 70%
await driver.setBothMotors(-50);  // Both backward at 50%
```

**Parameters:**
- `speed` (number): Speed percentage (-100 to 100)

#### `setDifferentialSpeed(leftSpeed, rightSpeed)`
Set different speeds for left and right motors (for turning).

```javascript
await driver.setDifferentialSpeed(30, 70);  // Turn right
```

**Parameters:**
- `leftSpeed` (number): Left motor speed (-100 to 100)
- `rightSpeed` (number): Right motor speed (-100 to 100)

### Configuration Methods

#### `setPWMFrequency(frequency)`
Set PWM frequency for motor control.

```javascript
await driver.setPWMFrequency(800);  // Set to 800Hz
```

**Parameters:**
- `frequency` (number): Frequency in Hz (24-1526)

### Status and Monitoring

#### `readStatus()`
Read status from the PCA9685 controller.

```javascript
const status = await driver.readStatus();
console.log(status);
// {
//   connected: true,
//   mode1: '0x00',
//   mode2: '0x04',
//   prescale: 30,
//   frequency: 1000,
//   i2cBus: 1,
//   i2cAddress: '0x40'
// }
```

Returns: `Promise<Object>` - Status information

### Raw I2C Commands

#### `sendCommand(register, value)`
Send a raw I2C command.

```javascript
await driver.sendCommand(0x00, 0x00);  // Write to MODE1 register
```

**Parameters:**
- `register` (number): Register address
- `value` (number): Value to write

#### `receiveCommand(register)`
Read from a register.

```javascript
const value = await driver.receiveCommand(0x00);  // Read MODE1 register
console.log(`Register value: 0x${value.toString(16)}`);
```

**Parameters:**
- `register` (number): Register address

Returns: `Promise<number>` - Register value

### Utility Methods

#### `sleep(ms)`
Sleep utility for delays.

```javascript
await driver.sleep(2000);  // Wait 2 seconds
```

**Parameters:**
- `ms` (number): Milliseconds to sleep

## Complete Command Reference

| Command | Description | Parameters |
|---------|-------------|------------|
| `connect()` | Auto-connect to Driver HAT | None |
| `disconnect()` | Disconnect and cleanup | None |
| `setMotor(motor, speed)` | Set motor speed and direction | motor: 'M1'/'M2', speed: -100 to 100 |
| `forward(motor, speed)` | Run motor forward | motor: 'M1'/'M2', speed: 0-100 |
| `backward(motor, speed)` | Run motor backward | motor: 'M1'/'M2', speed: 0-100 |
| `stop(motor)` | Stop motor (coast) | motor: 'M1'/'M2' |
| `brake(motor)` | Brake motor (immediate) | motor: 'M1'/'M2' |
| `stopAll()` | Stop all motors | None |
| `brakeAll()` | Brake all motors | None |
| `setBothMotors(speed)` | Set both motors same speed | speed: -100 to 100 |
| `setDifferentialSpeed(left, right)` | Set different speeds | left/right: -100 to 100 |
| `setPWMFrequency(freq)` | Set PWM frequency | freq: 24-1526 Hz |
| `readStatus()` | Read controller status | None |
| `sendCommand(reg, val)` | Send raw I2C command | reg: address, val: value |
| `receiveCommand(reg)` | Read I2C register | reg: address |
| `sleep(ms)` | Delay execution | ms: milliseconds |

## Example Use Cases

### Drive Straight Forward

```javascript
await driver.connect();
await driver.setBothMotors(70);  // Both motors 70% forward
await driver.sleep(3000);        // Run for 3 seconds
await driver.stopAll();
await driver.disconnect();
```

### Turn in Place

```javascript
await driver.connect();
await driver.setDifferentialSpeed(50, -50);  // Left forward, right backward
await driver.sleep(2000);                     // Turn for 2 seconds
await driver.stopAll();
await driver.disconnect();
```

### Gradual Acceleration

```javascript
await driver.connect();
for (let speed = 0; speed <= 100; speed += 10) {
  await driver.setBothMotors(speed);
  await driver.sleep(200);
}
await driver.brakeAll();
await driver.disconnect();
```

## Troubleshooting

### I2C Device Not Found

**Error:** `Failed to connect to Driver HAT: ENOENT`

**Solutions:**
1. Verify I2C is enabled: `sudo raspi-config`
2. Check device connection: `sudo i2cdetect -y 1`
3. Verify HAT is properly seated on GPIO pins
4. Check permissions: `ls -l /dev/i2c-1`

### Permission Denied

**Error:** `Failed to connect to Driver HAT: EACCES`

**Solution:**
```bash
sudo usermod -a -G i2c $USER
# Log out and log back in
```

### Wrong I2C Bus

If using Raspberry Pi 4 or older, you may need bus 0:

```javascript
const driver = new WaveshareDriverHAT({ busNumber: 0 });
```

### Motors Not Responding

1. Check power supply to the HAT
2. Verify motor connections to terminals
3. Try different PWM frequency: `await driver.setPWMFrequency(500);`
4. Check motor voltage requirements match HAT output

## Technical Details

### Hardware Specifications

- **Controller:** PCA9685 PWM controller
- **Motor Driver:** TB6612FNG dual motor driver
- **Interface:** I2C (default address: 0x40)
- **PWM Channels:** 16 channels (6 used for dual motor control)
- **PWM Resolution:** 12-bit (4096 levels)
- **Frequency Range:** 24-1526 Hz

### Channel Mapping

| Motor | PWM Channel | IN1 Channel | IN2 Channel |
|-------|-------------|-------------|-------------|
| M1    | 0           | 1           | 2           |
| M2    | 5           | 3           | 4           |

## License

MIT

## Support

For issues specific to this driver, please check:
- Waveshare wiki: https://www.waveshare.com/wiki/DDSM_Driver_HAT_(A)
- I2C troubleshooting: https://www.raspberrypi.org/documentation/hardware/raspberrypi/

## Contributing

Contributions welcome! Please test on actual hardware before submitting pull requests.

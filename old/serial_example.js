/**
 * Example showing how to use serial_driver.js to connect over UART
 * Adjust `portPath` to match your Raspberry Pi serial device (e.g. /dev/serial0 or /dev/ttyS0 or /dev/ttyAMA0)
 */

const SerialDriver = require('./serial_driver');

async function run() {
  const portPath = process.argv[2] || '/dev/serial0';
  const baud = parseInt(process.argv[3], 10) || 115200;
  const driver = new SerialDriver({ path: portPath, baudRate: baud, debug: true, timeout: 3000 });

  try {
    console.log(`Connecting to serial port ${portPath} @ ${baud}...`);
    await driver.connect();
    console.log('Connected');

    // Try a STATUS query
    try {
      const status = await driver.readStatus();
      console.log('Status response:', status);
    } catch (e) {
      console.warn('STATUS command timed out or returned no JSON:', e.message);
    }

    // Example: set motor M1 to 50%
    try {
      const r = await driver.setMotor('M1', 50);
      console.log('SET M1 50 ->', r);
    } catch (e) {
      console.warn('setMotor timed out or failed:', e.message);
    }

    // Cleanup
    await driver.disconnect();
    console.log('Disconnected');
  } catch (err) {
    console.error('Error:', err.message);
    try { await driver.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();

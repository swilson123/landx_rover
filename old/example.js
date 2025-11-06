/**
 * Example usage script for Waveshare DDSM Driver HAT (A)
 * Demonstrates all available commands and motor control functions
 */

const WaveshareDriverHAT = require('./driver');

async function runExample() {
  // Create driver instance with optional configuration
  const driver = new WaveshareDriverHAT({
    busNumber: 1,        // I2C bus (usually 1 on Raspberry Pi)
    address: 0x40,       // I2C address (default: 0x40)
    frequency: 1000      // PWM frequency in Hz (default: 1000)
  });

  try {
    console.log('=== Waveshare DDSM Driver HAT Example ===\n');

    // 1. Auto-connect to the driver hat
    console.log('1. Connecting to Driver HAT...');
    await driver.connect();
    console.log('✓ Connected!\n');

    // 2. Read and display status
    console.log('2. Reading status...');
    const status = await driver.readStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('');

    // 3. Test Motor 1 - Forward
    console.log('3. Motor 1: Forward at 50% speed for 2 seconds...');
    await driver.forward('M1', 50);
    await driver.sleep(2000);
    await driver.stop('M1');
    console.log('');

    // 4. Test Motor 1 - Backward
    console.log('4. Motor 1: Backward at 50% speed for 2 seconds...');
    await driver.backward('M1', 50);
    await driver.sleep(2000);
    await driver.stop('M1');
    console.log('');

    // 5. Test Motor 2 - Forward
    console.log('5. Motor 2: Forward at 75% speed for 2 seconds...');
    await driver.forward('M2', 75);
    await driver.sleep(2000);
    await driver.stop('M2');
    console.log('');

    // 6. Test Motor 2 - Backward
    console.log('6. Motor 2: Backward at 75% speed for 2 seconds...');
    await driver.backward('M2', 75);
    await driver.sleep(2000);
    await driver.stop('M2');
    console.log('');

    // 7. Test both motors forward
    console.log('7. Both motors: Forward at 60% speed for 2 seconds...');
    await driver.setBothMotors(60);
    await driver.sleep(2000);
    await driver.stopAll();
    console.log('');

    // 8. Test both motors backward
    console.log('8. Both motors: Backward at 60% speed for 2 seconds...');
    await driver.setBothMotors(-60);
    await driver.sleep(2000);
    await driver.stopAll();
    console.log('');

    // 9. Test differential speed (turning)
    console.log('9. Differential speed: M1=30%, M2=70% for 2 seconds (turning)...');
    await driver.setDifferentialSpeed(30, 70);
    await driver.sleep(2000);
    await driver.stopAll();
    console.log('');

    // 10. Test using setMotor with negative speed
    console.log('10. Using setMotor: M1=-80% (reverse) for 2 seconds...');
    await driver.setMotor('M1', -80);
    await driver.sleep(2000);
    await driver.stop('M1');
    console.log('');

    // 11. Test brake command
    console.log('11. Motor 1: Accelerate then brake...');
    await driver.forward('M1', 100);
    await driver.sleep(1000);
    await driver.brake('M1');
    console.log('');

    // 12. Test brake all
    console.log('12. Both motors: Accelerate then brake all...');
    await driver.setBothMotors(80);
    await driver.sleep(1000);
    await driver.brakeAll();
    console.log('');

    // 13. Send raw command
    console.log('13. Sending raw I2C command...');
    await driver.sendCommand(0x00, 0x00); // Write to MODE1 register
    console.log('');

    // 14. Receive raw command
    console.log('14. Receiving raw I2C command...');
    const mode1Value = await driver.receiveCommand(0x00); // Read MODE1 register
    console.log(`MODE1 register value: 0x${mode1Value.toString(16)}`);
    console.log('');

    // 15. Change PWM frequency
    console.log('15. Changing PWM frequency to 500Hz...');
    await driver.setPWMFrequency(500);
    console.log('');

    // 16. Final status check
    console.log('16. Final status check...');
    const finalStatus = await driver.readStatus();
    console.log('Final Status:', JSON.stringify(finalStatus, null, 2));
    console.log('');

    // Cleanup
    console.log('=== Example Complete ===');
    console.log('Disconnecting...');
    await driver.disconnect();
    console.log('✓ Disconnected!\n');

  } catch (error) {
    console.error('Error:', error.message);
    await driver.disconnect();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  process.exit(0);
});

// Run the example
runExample();

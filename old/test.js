/**
 * Test script for Waveshare DDSM Driver HAT (A)
 * Quick validation of all commands without running motors
 */

const WaveshareDriverHAT = require('./driver');

async function runTests() {
  console.log('=== Waveshare DDSM Driver HAT Tests ===\n');
  
  const driver = new WaveshareDriverHAT();
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Connection
  console.log('Test 1: Auto-connect to Driver HAT');
  try {
    await driver.connect();
    console.log('✓ PASSED: Connection successful\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
    process.exit(1);
  }

  // Test 2: Read Status
  console.log('Test 2: Read status');
  try {
    const status = await driver.readStatus();
    if (status.connected && status.i2cAddress === '0x40') {
      console.log('✓ PASSED: Status read successfully');
      console.log('  Status:', JSON.stringify(status, null, 2), '\n');
      testsPassed++;
    } else {
      throw new Error('Invalid status response');
    }
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Motor Commands (no movement, just API calls)
  console.log('Test 3: Motor command APIs');
  try {
    await driver.setMotor('M1', 0);
    await driver.setMotor('M2', 0);
    await driver.forward('M1', 0);
    await driver.backward('M2', 0);
    await driver.stop('M1');
    await driver.stop('M2');
    console.log('✓ PASSED: Motor commands executed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Speed validation
  console.log('Test 4: Speed validation');
  try {
    let errorCaught = false;
    try {
      await driver.setMotor('M1', 150); // Invalid: over 100
    } catch (e) {
      errorCaught = true;
    }
    
    if (errorCaught) {
      console.log('✓ PASSED: Speed validation working\n');
      testsPassed++;
    } else {
      throw new Error('Speed validation failed to catch invalid input');
    }
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Brake commands
  console.log('Test 5: Brake commands');
  try {
    await driver.brake('M1');
    await driver.brake('M2');
    await driver.brakeAll();
    console.log('✓ PASSED: Brake commands executed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Stop all
  console.log('Test 6: Stop all motors');
  try {
    await driver.stopAll();
    console.log('✓ PASSED: Stop all executed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 7: Both motors
  console.log('Test 7: Both motors command');
  try {
    await driver.setBothMotors(0);
    await driver.stopAll();
    console.log('✓ PASSED: Both motors command executed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 8: Differential speed
  console.log('Test 8: Differential speed');
  try {
    await driver.setDifferentialSpeed(0, 0);
    await driver.stopAll();
    console.log('✓ PASSED: Differential speed executed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 9: PWM frequency
  console.log('Test 9: PWM frequency change');
  try {
    await driver.setPWMFrequency(800);
    console.log('✓ PASSED: PWM frequency changed\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Test 10: Raw commands
  console.log('Test 10: Raw I2C commands');
  try {
    await driver.sendCommand(0x00, 0x00);
    const value = await driver.receiveCommand(0x00);
    if (typeof value === 'number') {
      console.log('✓ PASSED: Raw commands working\n');
      testsPassed++;
    } else {
      throw new Error('Invalid response from receiveCommand');
    }
  } catch (error) {
    console.error('✗ FAILED:', error.message, '\n');
    testsFailed++;
  }

  // Cleanup
  console.log('Cleaning up...');
  await driver.disconnect();

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✓ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed.\n');
    process.exit(1);
  }
}

runTests();

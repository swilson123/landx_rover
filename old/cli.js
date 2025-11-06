#!/usr/bin/env node

/**
 * Interactive CLI for Waveshare DDSM Driver HAT (A)
 * Provides a simple command-line interface for motor control
 */

const readline = require('readline');
const WaveshareDriverHAT = require('../driver');

const driver = new WaveshareDriverHAT();
let connected = false;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'driver> '
});

// Display help
function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║         Waveshare DDSM Driver HAT (A) - Interactive CLI          ║
╚═══════════════════════════════════════════════════════════════════╝

CONNECTION COMMANDS:
  connect                    Auto-connect to Driver HAT
  disconnect                 Disconnect from Driver HAT
  status                     Show connection status and registers

MOTOR CONTROL COMMANDS:
  forward <motor> <speed>    Run motor forward (speed: 0-100)
  backward <motor> <speed>   Run motor backward (speed: 0-100)
  set <motor> <speed>        Set motor speed (-100 to 100)
  stop <motor>               Stop motor (coast)
  brake <motor>              Brake motor (immediate)
  stopall                    Stop all motors
  brakeall                   Brake all motors

DUAL MOTOR COMMANDS:
  both <speed>               Set both motors to same speed
  diff <left> <right>        Set differential speed for turning

CONFIGURATION:
  freq <frequency>           Set PWM frequency (24-1526 Hz)

RAW I2C COMMANDS:
  send <register> <value>    Send raw I2C command
  receive <register>         Read from I2C register

UTILITY:
  help                       Show this help message
  exit                       Exit the CLI

EXAMPLES:
  forward M1 50              Run Motor 1 forward at 50%
  backward M2 75             Run Motor 2 backward at 75%
  set M1 -60                 Run Motor 1 backward at 60%
  both 70                    Both motors forward at 70%
  diff 30 70                 M1 at 30%, M2 at 70% (turn right)
  stop M1                    Stop Motor 1
  stopall                    Stop all motors

NOTE: Motors are M1 and M2
`);
}

// Parse and execute commands
async function executeCommand(line) {
  const parts = line.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  
  try {
    switch (cmd) {
      case 'help':
      case 'h':
      case '?':
        showHelp();
        break;

      case 'connect':
        console.log('Connecting to Driver HAT...');
        await driver.connect();
        connected = true;
        console.log('✓ Connected!');
        break;

      case 'disconnect':
        if (!connected) {
          console.log('Not connected.');
          break;
        }
        console.log('Disconnecting...');
        await driver.disconnect();
        connected = false;
        console.log('✓ Disconnected!');
        break;

      case 'status':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        const status = await driver.readStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        break;

      case 'forward':
      case 'fwd':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 3) {
          console.log('Usage: forward <motor> <speed>');
          break;
        }
        await driver.forward(parts[1].toUpperCase(), parseInt(parts[2]));
        break;

      case 'backward':
      case 'back':
      case 'bwd':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 3) {
          console.log('Usage: backward <motor> <speed>');
          break;
        }
        await driver.backward(parts[1].toUpperCase(), parseInt(parts[2]));
        break;

      case 'set':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 3) {
          console.log('Usage: set <motor> <speed>');
          break;
        }
        await driver.setMotor(parts[1].toUpperCase(), parseInt(parts[2]));
        break;

      case 'stop':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 2) {
          console.log('Usage: stop <motor>');
          break;
        }
        await driver.stop(parts[1].toUpperCase());
        break;

      case 'brake':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 2) {
          console.log('Usage: brake <motor>');
          break;
        }
        await driver.brake(parts[1].toUpperCase());
        break;

      case 'stopall':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        await driver.stopAll();
        break;

      case 'brakeall':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        await driver.brakeAll();
        break;

      case 'both':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 2) {
          console.log('Usage: both <speed>');
          break;
        }
        await driver.setBothMotors(parseInt(parts[1]));
        break;

      case 'diff':
      case 'differential':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 3) {
          console.log('Usage: diff <left> <right>');
          break;
        }
        await driver.setDifferentialSpeed(parseInt(parts[1]), parseInt(parts[2]));
        break;

      case 'freq':
      case 'frequency':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 2) {
          console.log('Usage: freq <frequency>');
          break;
        }
        await driver.setPWMFrequency(parseInt(parts[1]));
        console.log(`✓ PWM frequency set to ${parts[1]} Hz`);
        break;

      case 'send':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 3) {
          console.log('Usage: send <register> <value>');
          break;
        }
        const sendReg = parseInt(parts[1], 16);
        const sendVal = parseInt(parts[2], 16);
        await driver.sendCommand(sendReg, sendVal);
        break;

      case 'receive':
      case 'read':
        if (!connected) {
          console.log('Not connected. Use "connect" first.');
          break;
        }
        if (parts.length < 2) {
          console.log('Usage: receive <register>');
          break;
        }
        const recvReg = parseInt(parts[1], 16);
        const value = await driver.receiveCommand(recvReg);
        console.log(`Value: 0x${value.toString(16)} (${value})`);
        break;

      case 'exit':
      case 'quit':
      case 'q':
        if (connected) {
          console.log('Disconnecting...');
          await driver.disconnect();
        }
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
        break;

      case '':
        // Empty line, do nothing
        break;

      default:
        console.log(`Unknown command: ${cmd}`);
        console.log('Type "help" for available commands.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Handle line input
rl.on('line', async (line) => {
  await executeCommand(line);
  rl.prompt();
});

// Handle Ctrl+C
rl.on('SIGINT', async () => {
  console.log('\nReceived SIGINT');
  if (connected) {
    console.log('Disconnecting...');
    await driver.disconnect();
  }
  process.exit(0);
});

// Start
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  Waveshare DDSM Driver HAT (A) - Interactive CLI');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('Type "help" for available commands.');
console.log('Type "connect" to connect to the Driver HAT.');
console.log('');
rl.prompt();

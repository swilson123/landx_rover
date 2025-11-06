/**
 * Waveshare DDSM Driver HAT (A) Node.js Driver
 * 
 * This driver supports dual motor control via I2C communication
 * with PCA9685 PWM controller and TB6612FNG motor drivers.
 * 
 * Features:
 * - Auto-detection and connection
 * - Dual motor control (M1, M2)
 * - Speed control (0-100%)
 * - Direction control (forward, backward)
 * - Brake and stop commands
 * - PWM frequency configuration
 */

const i2c = require('i2c-bus');

// Default I2C address for PCA9685
const DEFAULT_I2C_ADDRESS = 0x40;
const DEFAULT_I2C_BUS = 1;

// PCA9685 Registers
const MODE1 = 0x00;
const MODE2 = 0x01;
const PRESCALE = 0xFE;
const LED0_ON_L = 0x06;
const LED0_ON_H = 0x07;
const LED0_OFF_L = 0x08;
const LED0_OFF_H = 0x09;

// Motor channel mappings for DDSM Driver HAT (A)
const MOTOR_CHANNELS = {
  M1: {
    PWM: 0,   // PWM channel for Motor 1 speed
    IN1: 1,   // Direction control 1
    IN2: 2    // Direction control 2
  },
  M2: {
    PWM: 5,   // PWM channel for Motor 2 speed
    IN1: 3,   // Direction control 1
    IN2: 4    // Direction control 2
  }
};

class WaveshareDriverHAT {
  constructor(options = {}) {
    this.i2cBus = options.busNumber || DEFAULT_I2C_BUS;
    this.i2cAddress = options.address || DEFAULT_I2C_ADDRESS;
    this.bus = null;
    this.connected = false;
    this.frequency = options.frequency || 1000; // Default PWM frequency: 1kHz
  }

  /**
   * Auto-detect and connect to the Driver HAT
   * @returns {Promise<boolean>} Connection status
   */
  async connect() {
    try {
      console.log(`Attempting to connect to Driver HAT on bus ${this.i2cBus}, address 0x${this.i2cAddress.toString(16)}...`);
      
      // Open I2C bus
      this.bus = await i2c.openPromisified(this.i2cBus);
      
      // Test connection by reading MODE1 register
      const mode1 = await this.bus.readByte(this.i2cAddress, MODE1);
      console.log(`Driver HAT detected! MODE1 register: 0x${mode1.toString(16)}`);
      
      // Initialize the PCA9685
      await this.initialize();
      
      this.connected = true;
      console.log('Driver HAT connected and initialized successfully!');
      return true;
    } catch (error) {
      console.error('Failed to connect to Driver HAT:', error.message);
      this.connected = false;
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize the PCA9685 PWM controller
   */
  async initialize() {
    try {
      // Reset
      await this.bus.writeByte(this.i2cAddress, MODE1, 0x00);
      await this.sleep(5);
      
      // Set PWM frequency
      await this.setPWMFrequency(this.frequency);
      
      // Configure MODE2 for totem pole output
      await this.bus.writeByte(this.i2cAddress, MODE2, 0x04);
      
      // Stop all motors initially
      await this.stopAll();
      
      console.log(`PCA9685 initialized with frequency ${this.frequency}Hz`);
    } catch (error) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  /**
   * Set PWM frequency for motor control
   * @param {number} frequency - Frequency in Hz (24-1526)
   */
  async setPWMFrequency(frequency) {
    if (frequency < 24 || frequency > 1526) {
      throw new Error('Frequency must be between 24 and 1526 Hz');
    }

    try {
      // Calculate prescale value
      const prescaleValue = Math.round(25000000.0 / (4096 * frequency)) - 1;
      
      // Read current MODE1
      const oldMode = await this.bus.readByte(this.i2cAddress, MODE1);
      
      // Sleep mode
      const newMode = (oldMode & 0x7F) | 0x10;
      await this.bus.writeByte(this.i2cAddress, MODE1, newMode);
      
      // Set prescale
      await this.bus.writeByte(this.i2cAddress, PRESCALE, prescaleValue);
      
      // Restore MODE1
      await this.bus.writeByte(this.i2cAddress, MODE1, oldMode);
      await this.sleep(5);
      
      // Auto-increment enabled
      await this.bus.writeByte(this.i2cAddress, MODE1, oldMode | 0x80);
      
      this.frequency = frequency;
    } catch (error) {
      throw new Error(`Failed to set PWM frequency: ${error.message}`);
    }
  }

  /**
   * Set PWM value for a specific channel
   * @param {number} channel - PWM channel (0-15)
   * @param {number} on - On time (0-4095)
   * @param {number} off - Off time (0-4095)
   */
  async setPWM(channel, on, off) {
    if (channel < 0 || channel > 15) {
      throw new Error('Channel must be between 0 and 15');
    }
    if (on < 0 || on > 4095 || off < 0 || off > 4095) {
      throw new Error('PWM values must be between 0 and 4095');
    }

    try {
      const baseReg = LED0_ON_L + 4 * channel;
      await this.bus.writeByte(this.i2cAddress, baseReg, on & 0xFF);
      await this.bus.writeByte(this.i2cAddress, baseReg + 1, on >> 8);
      await this.bus.writeByte(this.i2cAddress, baseReg + 2, off & 0xFF);
      await this.bus.writeByte(this.i2cAddress, baseReg + 3, off >> 8);
    } catch (error) {
      throw new Error(`Failed to set PWM: ${error.message}`);
    }
  }

  /**
   * Set motor speed and direction
   * @param {string} motor - Motor name ('M1' or 'M2')
   * @param {number} speed - Speed percentage (-100 to 100, negative for reverse)
   */
  async setMotor(motor, speed) {
    this.ensureConnected();
    
    if (!MOTOR_CHANNELS[motor]) {
      throw new Error(`Invalid motor: ${motor}. Use 'M1' or 'M2'`);
    }
    if (speed < -100 || speed > 100) {
      throw new Error('Speed must be between -100 and 100');
    }

    const channels = MOTOR_CHANNELS[motor];
    const direction = speed >= 0 ? 'forward' : 'backward';
    const absSpeed = Math.abs(speed);
    
    // Convert percentage to PWM value (0-4095)
    const pwmValue = Math.round((absSpeed / 100) * 4095);

    try {
      // Set direction
      if (direction === 'forward') {
        await this.setPWM(channels.IN1, 0, 4095); // HIGH
        await this.setPWM(channels.IN2, 0, 0);    // LOW
      } else {
        await this.setPWM(channels.IN1, 0, 0);    // LOW
        await this.setPWM(channels.IN2, 0, 4095); // HIGH
      }
      
      // Set speed
      await this.setPWM(channels.PWM, 0, pwmValue);
      
      console.log(`${motor} set to ${speed}% (${direction}, PWM: ${pwmValue})`);
    } catch (error) {
      throw new Error(`Failed to set motor ${motor}: ${error.message}`);
    }
  }

  /**
   * Run motor forward
   * @param {string} motor - Motor name ('M1' or 'M2')
   * @param {number} speed - Speed percentage (0-100)
   */
  async forward(motor, speed = 100) {
    if (speed < 0 || speed > 100) {
      throw new Error('Speed must be between 0 and 100');
    }
    await this.setMotor(motor, speed);
  }

  /**
   * Run motor backward
   * @param {string} motor - Motor name ('M1' or 'M2')
   * @param {number} speed - Speed percentage (0-100)
   */
  async backward(motor, speed = 100) {
    if (speed < 0 || speed > 100) {
      throw new Error('Speed must be between 0 and 100');
    }
    await this.setMotor(motor, -speed);
  }

  /**
   * Stop a specific motor (coast to stop)
   * @param {string} motor - Motor name ('M1' or 'M2')
   */
  async stop(motor) {
    this.ensureConnected();
    
    if (!MOTOR_CHANNELS[motor]) {
      throw new Error(`Invalid motor: ${motor}. Use 'M1' or 'M2'`);
    }

    const channels = MOTOR_CHANNELS[motor];
    
    try {
      await this.setPWM(channels.PWM, 0, 0);
      await this.setPWM(channels.IN1, 0, 0);
      await this.setPWM(channels.IN2, 0, 0);
      console.log(`${motor} stopped`);
    } catch (error) {
      throw new Error(`Failed to stop motor ${motor}: ${error.message}`);
    }
  }

  /**
   * Brake a specific motor (immediate stop)
   * @param {string} motor - Motor name ('M1' or 'M2')
   */
  async brake(motor) {
    this.ensureConnected();
    
    if (!MOTOR_CHANNELS[motor]) {
      throw new Error(`Invalid motor: ${motor}. Use 'M1' or 'M2'`);
    }

    const channels = MOTOR_CHANNELS[motor];
    
    try {
      // Both IN pins HIGH for brake
      await this.setPWM(channels.IN1, 0, 4095);
      await this.setPWM(channels.IN2, 0, 4095);
      await this.setPWM(channels.PWM, 0, 4095);
      console.log(`${motor} braked`);
    } catch (error) {
      throw new Error(`Failed to brake motor ${motor}: ${error.message}`);
    }
  }

  /**
   * Stop all motors
   */
  async stopAll() {
    this.ensureConnected();
    
    try {
      await this.stop('M1');
      await this.stop('M2');
      console.log('All motors stopped');
    } catch (error) {
      throw new Error(`Failed to stop all motors: ${error.message}`);
    }
  }

  /**
   * Brake all motors
   */
  async brakeAll() {
    this.ensureConnected();
    
    try {
      await this.brake('M1');
      await this.brake('M2');
      console.log('All motors braked');
    } catch (error) {
      throw new Error(`Failed to brake all motors: ${error.message}`);
    }
  }

  /**
   * Set both motors to the same speed (for driving straight)
   * @param {number} speed - Speed percentage (-100 to 100)
   */
  async setBothMotors(speed) {
    await this.setMotor('M1', speed);
    await this.setMotor('M2', speed);
  }

  /**
   * Set different speeds for left and right motors (for turning)
   * @param {number} leftSpeed - Left motor speed (-100 to 100)
   * @param {number} rightSpeed - Right motor speed (-100 to 100)
   */
  async setDifferentialSpeed(leftSpeed, rightSpeed) {
    await this.setMotor('M1', leftSpeed);
    await this.setMotor('M2', rightSpeed);
  }

  /**
   * Read status from the PCA9685
   * @returns {Object} Status information
   */
  async readStatus() {
    this.ensureConnected();
    
    try {
      const mode1 = await this.bus.readByte(this.i2cAddress, MODE1);
      const mode2 = await this.bus.readByte(this.i2cAddress, MODE2);
      const prescale = await this.bus.readByte(this.i2cAddress, PRESCALE);
      
      return {
        connected: this.connected,
        mode1: `0x${mode1.toString(16)}`,
        mode2: `0x${mode2.toString(16)}`,
        prescale: prescale,
        frequency: this.frequency,
        i2cBus: this.i2cBus,
        i2cAddress: `0x${this.i2cAddress.toString(16)}`
      };
    } catch (error) {
      throw new Error(`Failed to read status: ${error.message}`);
    }
  }

  /**
   * Send a raw I2C command
   * @param {number} register - Register address
   * @param {number} value - Value to write
   */
  async sendCommand(register, value) {
    this.ensureConnected();
    
    try {
      await this.bus.writeByte(this.i2cAddress, register, value);
      console.log(`Command sent: Register 0x${register.toString(16)} = 0x${value.toString(16)}`);
    } catch (error) {
      throw new Error(`Failed to send command: ${error.message}`);
    }
  }

  /**
   * Read from a register
   * @param {number} register - Register address
   * @returns {Promise<number>} Register value
   */
  async receiveCommand(register) {
    this.ensureConnected();
    
    try {
      const value = await this.bus.readByte(this.i2cAddress, register);
      console.log(`Command received: Register 0x${register.toString(16)} = 0x${value.toString(16)}`);
      return value;
    } catch (error) {
      throw new Error(`Failed to receive command: ${error.message}`);
    }
  }

  /**
   * Disconnect from the Driver HAT
   */
  async disconnect() {
    if (this.bus) {
      try {
        await this.stopAll();
        await this.bus.close();
        this.connected = false;
        console.log('Driver HAT disconnected');
      } catch (error) {
        console.error('Error during disconnect:', error.message);
      }
    }
  }

  /**
   * Ensure connection is established
   */
  ensureConnected() {
    if (!this.connected || !this.bus) {
      throw new Error('Not connected to Driver HAT. Call connect() first.');
    }
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WaveshareDriverHAT;

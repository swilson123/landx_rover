/**
 * Serial driver for Waveshare DDSM Driver HAT (A) -- generic UART client
 *
 * This module implements a simple newline-delimited text protocol client.
 * It is deliberately generic because the DDSM HAT doesn't officially
 * publish a UART protocol. If your HAT exposes UART, configure the exact
 * commands the HAT expects via the high-level methods, or adapt the
 * low-level `sendRaw`/`sendAndWait` methods.
 *
 * Usage:
 *   const SerialDriver = require('./serial_driver');
 *   const d = new SerialDriver({ path: '/dev/serial0', baudRate: 115200 });
 *   await d.connect();
 *   await d.sendAndWait('STATUS');
 */

const { SerialPort } = require('serialport');
const readline = require('readline');

class SerialDriver {
  constructor(options = {}) {
    this.path = options.path || process.env.SERIAL_PORT || '/dev/serial0';
    this.baudRate = options.baudRate || 115200;
    this.timeout = options.timeout || 2000; // ms for command responses
    this.port = null;
    this.rl = null; // readline interface for incoming lines
    this.connected = false;
    this._pending = new Map(); // id => {resolve, reject, timer}
    this._idCounter = 1;
    this.debug = !!options.debug;
  }

  async connect() {
    if (this.connected) return;

    this.port = new SerialPort({ path: this.path, baudRate: this.baudRate, autoOpen: false });

    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) return reject(new Error(`Failed to open serial port ${this.path}: ${err.message}`));

        // create readline on the underlying stream
        this.rl = readline.createInterface({ input: this.port });
        this.rl.on('line', (line) => this._handleLine(line));

        this.port.on('error', (e) => {
          console.error('Serial port error:', e.message);
        });

        this.connected = true;
        if (this.debug) console.log(`Serial port ${this.path} opened at ${this.baudRate}bps`);
        resolve(true);
      });
    });
  }

  async disconnect() {
    if (!this.connected) return;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    return new Promise((resolve) => {
      this.port.close(() => {
        this.connected = false;
        if (this.debug) console.log('Serial port closed');
        resolve();
      });
    });
  }

  _handleLine(line) {
    if (this.debug) console.log('[serial Rx]', line);

    // If line contains an id token like "#id:..." we match pending promises.
    // We support simple JSON responses or plain OK/ERROR lines.
    // Format convention: responses MAY include an id token `@id=<n>` to correlate responses.

    const idMatch = line.match(/@id=(\d+)/);
    if (idMatch) {
      const id = Number(idMatch[1]);
      const pending = this._pending.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        pending.resolve(line);
        this._pending.delete(id);
        return;
      }
    }

    // If no id given, try to resolve oldest pending request (FIFO)
    const first = this._pending.keys().next();
    if (!first.done) {
      const id = first.value;
      const pending = this._pending.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        pending.resolve(line);
        this._pending.delete(id);
        return;
      }
    }

    // Otherwise emit event if user provided a handler
    if (this.onData) {
      try { this.onData(line); } catch (e) { console.error('onData handler error', e); }
    }
  }

  sendRaw(data) {
    if (!this.connected || !this.port) throw new Error('Serial port not connected. Call connect() first.');
    if (this.debug) console.log('[serial Tx]', data.toString());
    this.port.write(data);
  }

  sendLine(line) {
    if (!line.endsWith('\n')) line += '\n';
    this.sendRaw(line);
  }

  sendAndWait(line, opts = {}) {
    // Returns a promise that resolves with the response line or rejects on timeout
    if (!this.connected) return Promise.reject(new Error('Not connected'));
    const id = this._idCounter++;
    const tagged = line.trim() + ` @id=${id}`;
    const timeout = opts.timeout || this.timeout;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error('Timeout waiting for serial response'));
      }, timeout);

      this._pending.set(id, { resolve, reject, timer });
      this.sendLine(tagged);
    });
  }

  // High-level API (text-based commands). The format below is generic and
  // intended to be adapted to your HAT's actual serial protocol (if any).

  async setMotor(motor, speed) {
    if (!['M1','M2'].includes(motor)) throw new Error("motor must be 'M1' or 'M2'");
    if (typeof speed !== 'number' || speed < -100 || speed > 100) throw new Error('speed must be -100..100');
    const cmd = `SET ${motor} ${speed}`;
    const res = await this.sendAndWait(cmd);
    return res;
  }

  async forward(motor, speed = 100) {
    return await this.setMotor(motor, Math.abs(speed));
  }

  async backward(motor, speed = 100) {
    return await this.setMotor(motor, -Math.abs(speed));
  }

  async stop(motor) {
    const cmd = `STOP ${motor}`;
    return await this.sendAndWait(cmd);
  }

  async stopAll() {
    const cmd = `STOP ALL`;
    return await this.sendAndWait(cmd);
  }

  async brake(motor) {
    const cmd = `BRAKE ${motor}`;
    return await this.sendAndWait(cmd);
  }

  async readStatus() {
    const res = await this.sendAndWait('STATUS');
    // try to parse JSON if returned
    try {
      const json = res.replace(/^[^{]*/,'').replace(/[^}]*$/,'');
      return JSON.parse(json);
    } catch (_) {
      return res;
    }
  }
}

module.exports = SerialDriver;

import { SerialPort } from "serialport";

const port = new SerialPort({ path: "/dev/ttyAMA0", baudRate: 115200 });

port.on("open", () => {
  console.log("Serial port open");

  // Example setup sequence
  port.write('{"T":10012,"id":1,"mode":3}\n'); // Position mode
  port.write('{"T":11002,"id":1}\n');           // Enable motor
  port.write('{"T":11001,"time":-1}\n');        // Keep enabled
  setTimeout(() => {
    // Rotate 180 degrees (cmd=16384 ≈ 180°)
    port.write('{"T":10010,"id":1,"cmd":16384,"act":3}\n');
  }, 500);
});

let buffer = "";

// Collect ASCII hex lines
port.on("data", data => {
  buffer += data.toString(); // append new chunk

  // Only parse when we detect a full line ending with \r\n
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\r\n")) >= 0) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 2);

    parseHexLine(line);
  }
});

function parseHexLine(line) {
  // Match all 0xXX patterns
  const hexMatches = line.match(/0x[0-9A-Fa-f]{2}/g);
  if (!hexMatches || hexMatches.length < 8) return;

  // Convert ASCII hex to bytes
  const bytes = hexMatches.map(h => parseInt(h, 16));

  // Scan for valid frames: 0x01 ... 0x03
  for (let i = 0; i <= bytes.length - 8; i++) {
    if (bytes[i] === 0x01 && bytes[i + 7] === 0x03) {
      const frame = bytes.slice(i, i + 8);

      const pos = (frame[1] << 8) | frame[2];
      const spd = (frame[3] << 8) | frame[4];
      const cur = (frame[5] << 8) | frame[6];
      const posDeg = (pos / 32767) * 360;

      console.log(`→ Position: ${posDeg.toFixed(1)}°, Speed: ${spd} RPM, Current: ${cur} mA`);
    }
  }
}

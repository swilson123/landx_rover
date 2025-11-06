// serial_probe.js
// Sweep common baud rates and send simple probes to a serial device.
// Usage: node serial_probe.js /dev/serial0

const { SerialPort } = require('serialport');

const portPath = process.argv[2] || '/dev/serial0';
const probes = [Buffer.from('PING\n'), Buffer.from('STATUS\n'), Buffer.from([0xFF]), Buffer.from([0x00])];
const baudRates = [9600, 19200, 38400, 57600, 115200, 230400];

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async ()=>{
  console.log(`Probing ${portPath} with probes: ${probes.map(p=>p.toString()).join(', ')}\n`);

  for (const baud of baudRates) {
    console.log('------------------------------------------------------------');
    console.log(`Trying baud ${baud} ...`);

    const port = new SerialPort({ path: portPath, baudRate: baud, autoOpen: false });
    let opened = false;
    let responses = [];

    try {
      await new Promise((res, rej)=> port.open(err=> err ? rej(err) : res()));
      opened = true;
      console.log(`Serial port ${portPath} opened at ${baud}bps`);

      port.on('data', (chunk)=>{
        const hex = chunk.toString('hex');
        const text = chunk.toString('utf8').replace(/\r/g,'');
        responses.push({ hex, text });
      });

      // send probes
      for (const p of probes) {
        try {
          port.write(p);
        } catch(e) {
          // ignore
        }
        await sleep(200);
      }

      // wait for responses
      await sleep(1000);

      // report
      if (responses.length===0) {
        console.log('No response at this baud rate.');
      } else {
        console.log(`Responses (${responses.length}):`);
        responses.forEach((r,i)=> console.log(`#${i+1} hex:${r.hex} text:${JSON.stringify(r.text)}`));
      }

    } catch (err) {
      console.log('Error opening/using port:', err.message);
    } finally {
      if (opened) {
        try { await new Promise(res=>port.close(res)); } catch(e){}
      }
    }

    // small delay between attempts
    await sleep(200);
  }

  console.log('\nProbe complete.');
  process.exit(0);
})();

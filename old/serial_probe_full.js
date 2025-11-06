// serial_probe_full.js
// Sweep a broad set of baud rates on /dev/ttyAMA0 and send simple probes.
const { SerialPort } = require('serialport');

const portPath = process.argv[2] || '/dev/ttyAMA0';
const probes = [Buffer.from('STATUS\n'), Buffer.from('PING\n'), Buffer.from([0x00]), Buffer.from([0xFF])];
const baudRates = [300,600,1200,2400,4800,9600,14400,19200,38400,57600,76800,115200,230400,250000,460800,921600,1000000];

const sleep = (ms) => new Promise(r=>setTimeout(r,ms));

(async ()=>{
  console.log(`Probing ${portPath} with baud rates: ${baudRates.join(', ')}`);

  for (const baud of baudRates) {
    console.log('\n------------------------------------------------------------');
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
        try { port.write(p); } catch(e) {}
        await sleep(200);
      }

      // wait for responses
      await sleep(800);

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
    await sleep(150);
  }

  console.log('\nProbe sweep complete.');
  process.exit(0);
})();

const { SerialPort } = require('serialport');

const path = process.argv[2] || '/dev/serial0';
const baud = parseInt(process.argv[3],10) || 115200;
const token = `LOOP-${Math.floor(Math.random()*1000000)}`;
let received = '';

console.log(`Loopback test on ${path} @ ${baud}. Send token: ${token}`);

const port = new SerialPort({ path, baudRate: baud, autoOpen: false });

port.open((err)=>{
  if (err) { console.error('Failed to open port:', err.message); process.exit(2);} 
  console.log('Port opened. Listening for data...');

  port.on('data', (chunk)=>{
    const s = chunk.toString('utf8');
    received += s;
    process.stdout.write(`RX: ${s}`);
    if (received.includes(token)) {
      console.log('\nLoopback SUCCESS: received token back');
      port.close(()=>process.exit(0));
    }
  });

  // send the token
  setTimeout(()=>{
    port.write(token+"\n", (e)=>{
      if (e) { console.error('Write error', e.message); port.close(()=>process.exit(3)); }
      console.log('Token written, waiting 2s for echo...');
    });
  }, 200);

  // timeout
  setTimeout(()=>{
    console.error('\nLoopback FAILED: no echo received within timeout');
    try { port.close(()=>process.exit(1)); } catch(e){process.exit(1);}  
  }, 4000);
});

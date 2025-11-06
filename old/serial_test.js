import { SerialPort } from 'serialport'

const UART_PATH = '/dev/ttyAMA0'
const BAUD_RATE = 115200
const MOTOR_ID = 0x01
const TARGET_RPM = 50

const port = new SerialPort({ path: UART_PATH, baudRate: BAUD_RATE })

function checksum(bytes) {
  let sum = 0
  for (let i = 1; i < bytes.length - 1; i++) sum = (sum + bytes[i]) & 0xff
  return sum
}

function makeFrame(id, cmd, d1 = 0, d2 = 0, d3 = 0, d4 = 0) {
  const frame = [0x3E, id, cmd, d1, d2, d3, d4, 0x00]
  frame[7] = checksum(frame)
  return Buffer.from(frame)
}

const CMD_MODE_SPEED = 0xA0
const CMD_SET_SPEED  = 0xA2
const CMD_READ_STATE = 0x9C

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

port.on('open', async () => {
  console.log(`Serial open on ${UART_PATH} @${BAUD_RATE}`)

  // Send the requested JSON command once the port is open
  const jsonCmd = { T: 10010, id: 1, cmd: TARGET_RPM, act: 3 }
  const jsonLine = JSON.stringify(jsonCmd) + '\n';
  port.write(jsonLine)
  console.log('→ Sent JSON command:', jsonLine.trim())

  // enter speed mode
  port.write(makeFrame(MOTOR_ID, CMD_MODE_SPEED))
  console.log('→ Entered speed mode')
  await delay(200)

  // compute speed in 0.01 r/s
  const speed = Math.round((TARGET_RPM / 60) * 100)
  const high = (speed >> 8) & 0xff
  const low = speed & 0xff

  port.write(makeFrame(MOTOR_ID, CMD_SET_SPEED, high, low))
  console.log(`→ Set speed to ${TARGET_RPM} rpm`)

  // periodic status query
  setInterval(() => port.write(makeFrame(MOTOR_ID, CMD_READ_STATE)), 1000)
})
port.on('data', d => {
  const hex = d.toString('hex')
  const txt = d.toString('utf8').replace(/\r/g, '')
 

  // If the device sent ASCII hex (like '657473...'), decode it to readable text
  const compact = txt.replace(/[^0-9a-fA-F]/g, '')
  if (compact.length >= 2 && compact.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(compact) && compact.length >= 8) {
    try {
    const decoded = Buffer.from(compact, 'hex').toString('utf8').replace(/\r/g, '')
    // Print decoded text with real line breaks, indent subsequent lines for readability
    console.log('   decoded:')
    decoded.split('\n').forEach(line => console.log('     ' + line))
    } catch (e) {
      // ignore decode errors
    }
  }

  if (txt && txt.trim()) {
    // Print raw text with real line breaks (incoming chunks may contain partial lines)
    console.log('   txt:')
    txt.split('\n').forEach(line => {
      if (line.length === 0) return
      console.log('     ' + line)
    })

    // Try parsing JSON only when the chunk looks like a complete JSON object
    const trimmed = txt.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const obj = JSON.parse(trimmed)
        console.log('   json:', obj)
      } catch (_) {
        // not JSON
      }
    }
  }
})
port.on('error', e => console.error('Serial error:', e))

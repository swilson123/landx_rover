
var rover = {

    waveshare: {
        baudrate: 115200,
        port_path: '/dev/ttyAMA0', //ttyACM0 = usb, ttyAMA0 = gpio
        connected: false,
        serial: null,
        parser: null
    },
    SerialPort: require("serialport").SerialPort,
    Readline: require('@serialport/parser-readline').ReadlineParser,
    ByteLengthParser: require('@serialport/parser-byte-length').ByteLengthParser,
    connect_to_waveshare: require("./lib/waveshare/connect_to_waveshare"),
    create_waveshare_message: require("./lib/waveshare/create_waveshare_message"),
}


rover.connect_to_waveshare(rover);

// command constants from Waveshare example (ddsm_example/json_cmd.h)
const CMD_DDSM_CTRL = 10010;        // speed/current/position control
const CMD_DDSM_CHANGE_ID = 10011;   // change motor ID
const CMD_CHANGE_MODE = 10012;      // change mode
const CMD_DDSM_ID_CHECK = 10031;    // query motor ID (only one motor connected)
const CMD_DDSM_INFO = 10032;        // get info for a motor
const CMD_HEARTBEAT_TIME = 11001;   // set heartbeat time

const motor_id = 1;
const motor_speed_cmd = 200;

//set motor type
setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": 11002, "id": 115 };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 500);

// send change ID (example: set motor with physical connection to ID 1 -> change to 2)
setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": CMD_DDSM_CHANGE_ID, "id": motor_id };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 1000);

setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": CMD_CHANGE_MODE, "id": motor_id, "mode": 2 };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 2000);

// set heartbeat time (-1 disables automatic stop)
setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": CMD_HEARTBEAT_TIME, "time": 2000 };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 3000);






setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": 11003, "id": 1, "freq": 10 };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 3800);

// send control command (speed/current/position depending on mode)
setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": CMD_DDSM_CTRL, "id": motor_id, "cmd": motor_speed_cmd, "act": 3 };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 4000);

// request motor info
setTimeout(() => {
    if (rover.waveshare.connected) {
        var message = { "T": CMD_DDSM_INFO, "id": motor_id };
        rover.create_waveshare_message(rover, message);
    } else {
        console.log("Waveshare not connected");
    }
}, 5000);





	// lazy-require serialport to avoid throwing at module load if native bindings missing
	if (!rover.SerialPort) {
		try {
			const sp = require('serialport');
			// serialport v9+ exports SerialPort and a static list() method that returns a Promise
			rover.SerialPort = sp.SerialPort || sp;
		} catch (err) {
			console.error('update_serialports: failed to require serialport', err);
			return;
		}
	}

	try {
		(async () => {
			const ports = await rover.SerialPort.list();
			ports.forEach(function (port) {
				
					console.log(port.path);
				
				
			});
		})();
	} catch (err) {
		console.error('update_serialports: error listing ports', err);
	}


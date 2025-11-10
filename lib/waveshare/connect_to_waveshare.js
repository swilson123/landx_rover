var connect_to_waveshare = function (rover) {
	if (rover.waveshare.port_path) {
		rover.waveshare.serial = new rover.SerialPort({
			path: rover.waveshare.port_path,
			baudRate: rover.waveshare.baudrate,
		});

		//When port is open
		rover.waveshare.serial.on('open', function () {

			console.log("Waveshare Port is open");
			rover.waveshare.connected = true;


			rover.waveshare.serial.write('EN1\r\n');



			// Raw data listener to parse 10-byte DDSM frames and emit 'feedback'
			rover.waveshare.serial.on('data', function (data) {
				//console.log(data);
			});


			rover.waveshare.parser = rover.waveshare.serial.pipe(new rover.Readline(
				{
					delimiter: '\r\n'
				}));


			rover.waveshare.parser.on('data', function (input) {

				console.log('Waveshare Data:', input);


			});

			rover.waveshare.parser.on('error', function (e) {
				console.log('rover.waveshare.parser: ', e);

			});


		});


		rover.waveshare.serial.on('close', function (e) {
			rover.waveshare.connected = false;
			console.log("Waveshare Port closed: ", e);



		});

		rover.waveshare.serial.on('error', function (e) {

			if (e) {
				console.log("Waveshare Port error: ", e);

			}
		});

	}
	else {
		console.log('Missing waveshare port');

	}
};


module.exports = connect_to_waveshare;
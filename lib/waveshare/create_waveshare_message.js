var create_arduino_message = function (rover, message) {
	if (rover.waveshare.connected) {
		if (message) {
			console.log('Sending waveshare Message: ', message);

			var jsonLine = JSON.stringify(message) + '\n';
			rover.waveshare.serial.write(jsonLine);


		} else {
			console.log('Missing waveshare message');
		}
	} else {
		console.log('Waveshare not connected!');
	}
};

module.exports = create_arduino_message;

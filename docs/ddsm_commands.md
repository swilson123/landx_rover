# DDSM Driver HAT JSON command reference

This file lists the JSON command `T` values supported by the Waveshare DDSM Driver HAT example firmware.

Format: JSON commands are objects with at least a numeric `T` field. Example: `{ "T": 10010, "id": 1, "cmd": 50 }`.

Feedback codes

- FB_MOTOR (20010): Feedback: motor data (binary or JSON depending on firmware)
- FB_INFO (20011): Feedback: info data

Motor control commands

- CMD_DDSM_STOP (10000)
  - Stop motor. Example: `{ "T": 10000, "id": 1 }`

- CMD_DDSM_CTRL (10010)
  - Control motor (current/speed/position depending on mode).
  - Example: `{ "T": 10010, "id": 1, "cmd": 50, "act": 3 }`

  Details:

  - `cmd` meaning and units depend on the current motor mode (set with `CMD_CHANGE_MODE`, T=10012).
    - For DDSM115 (default):
      - mode 1 (current loop): `cmd` is a signed 16-bit value (-32767..32767) mapped to current; protocol maps full range to ~±8A but DDSM115 hardware limits to ~2.7A. Do not exceed motor-rated current.
      - mode 2 (speed loop): `cmd` is target speed in RPM (signed). Typical safe range for DDSM115 is about -200..200 rpm (no-load ~200 rpm).
      - mode 3 (position loop): `cmd` is a 0..32767 value mapping to 0..360°.
    - For DDSM210 (if you set type to 210):
      - mode 0 (open loop): `cmd` is signed -32767..32767 (open-loop control / PWM-like).
      - mode 2 (speed loop): `cmd` units are 0.1 rpm (so `cmd`=100 → 10.0 rpm). Example valid range mentioned in examples: -2100..2100 → -210..210 rpm.
      - mode 3 (position loop): `cmd` is 0..32767 mapping to 0..360°.

  - `act` (acceleration): a single byte (0..255) stored in packet_move[6].
    - Described in Waveshare docs as "acceleration time per revolution"; the larger the `act`, the smoother/slower the speed change.
    - Example firmware and examples use `act: 3` as a working default. Increase `act` (e.g., 10, 20) for smoother ramps; set lower for faster response.
    - Practical behavior: larger `act` → longer/softer ramp; smaller `act` → more aggressive acceleration.

  - Safety / practical notes:
    - Always set the correct motor type (`CMD_TYPE`, 11002) for mixed setups.
    - For commands that query ID (10031), ensure only one motor is connected.
    - If the motor shaft is unsecured, consider keeping a short heartbeat or a watchdog rather than disabling heartbeat entirely.


- CMD_DDSM_CHANGE_ID (10011)
  - Change motor ID. Example: `{ "T": 10011, "id": 2 }` (note: may only allow once per power cycle)

- CMD_CHANGE_MODE (10012)
  - Change motor mode. Example: `{ "T": 10012, "id": 1, "mode": 2 }`
  - DDSM115 modes: 1=current, 2=speed (default), 3=position
  - DDSM210 modes: 0=open, 2=speed, 3=position

- CMD_DDSM_ID_CHECK (10031)
  - Query motor ID. Only use when a single motor is connected. Example: `{ "T": 10031 }`

- CMD_DDSM_INFO (10032)
  - Request motor info. Example: `{ "T": 10032, "id": 1 }`

Heartbeat and type

- CMD_HEARTBEAT_TIME (11001)
  - Set heartbeat timeout in ms. `-1` disables automatic stop. Example: `{ "T": 11001, "time": -1 }`

- CMD_TYPE (11002)
  - Set DDSM type to 115 or 210. Example: `{ "T": 11002, "type": 115 }`

WiFi & web/ESP32 commands

- CMD_WIFI_ON_BOOT (10401) — set wifi on boot mode. Example: `{ "T": 10401, "cmd": 3 }`
- CMD_SET_AP (10402) — set AP config. Example: `{ "T": 10402, "ssid": "ESP32-AP", "password": "12345678" }`
- CMD_SET_STA (10403) — set STA config. Example: `{ "T": 10403, "ssid": "MySSID", "password": "mypw" }`
- CMD_WIFI_APSTA (10404) — set both AP and STA. Example: `{ "T": 10404, "ap_ssid": "ESP32-AP", "ap_password": "12345678", "sta_ssid": "MyNet", "sta_password": "pw" }`
- CMD_WIFI_INFO (10405) — query wifi info. Example: `{ "T": 10405 }`
- CMD_WIFI_CONFIG_CREATE_BY_STATUS (10406) — create wifiConfig.json from status. Example: `{ "T": 10406 }`
- CMD_WIFI_CONFIG_CREATE_BY_INPUT (10407) — create wifiConfig.json from input. Example: `{ "T": 10407, "mode": 3, ... }`
- CMD_WIFI_STOP (10408) — disconnect wifi. Example: `{ "T": 10408 }`

ESP32 / system

- CMD_REBOOT (600) — Reboot device: `{ "T": 600 }`
- CMD_FREE_FLASH_SPACE (601) — Query free flash: `{ "T": 601 }`
- CMD_RESET_WIFI_SETTINGS (603) — Reset wifi settings: `{ "T": 603 }`
- CMD_NVS_CLEAR (604) — Clear NVS: `{ "T": 604 }`

Notes

- The example firmware bridges JSON commands on the serial/USB interface to raw 10-byte DDSM motor frames on the motor bus. Depending on the board mode and how you are attached to the board you may see either JSON responses (e.g., `{"T":20011,...}`) or raw 10-byte packets (binary frames). If you receive binary frames, parse them according to the example `ddsm_ctrl` implementation (CRC-8/MAXIM and field meanings).

Usage with the repo

- Require the helper module: `const cmds = require('../lib/waveshare/commands');`
- Build a command: `const msg = cmds.buildCommandByName('CMD_DDSM_CTRL', 1, 50, 3); // {T:10010,id:1,cmd:50,act:3}`

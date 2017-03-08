# Intelipod Setup
## Connect Bluetooth Devices using Linux

(If using Mac, these steps are not necessary)

1. Install bluez and bluez-utils from official repo

2. Follow instructions on Bluetooth ArchWiki page under Configuration via the CLI - but not necessary to do last step (connect)

3. Once paired to BT device, set up serial ports
4. sudo killall rfcomm
5. sudo rfcomm connect 0 XX:XX:XX:XX:XX 1 (connects pod with MAC address XX:XX:XX:XX:XX to /dev/rfcomm0 on channel 1)
6. sudo rfcomm connect 1 XX:XX:XX:XX:XX 1 (connects pod with MAC address XX:XX:XX:XX:XX to /dev/rfcomm1 on channel 1)
7. sudo rfcomm connect 2 XX:XX:XX:XX:XX 1 (connects pod with MAC address XX:XX:XX:XX:XX to /dev/rfcomm2 on channel 1)
  
  Steps 5, 6, and 7 will establish /dev/rfcommX, where X is the desired port number; prior to these steps, /dev/rfcommX wil not exist

8. View serial output using software of choice (e.g. minicom) or cat /dev/rfcommX

<br />
**IMPORTANT NOTES**
 * If error is produced stating there is no permission to create lock file, run chmod a+x AND chmod -R 777 on /var/lock and /run/lock
 * If error persists, run OpenSensorHub as root (this was done for testing)
  
---

## Running OpenSensorHub

1. Inside OpenSensorHub folder, run ./launch.sh (may need to run as root if lock file permission error can't be fixed with chmod)

2. In browser, go to http://localhost:8181/sensorhub/admin (localhost can be replaced with IP address of OpenSensorHub node)

3. Configure the communication settings for each Intelipod sensor
  1. In the communication settings tab, ensure the correct name is input into the Port Name field for the given sensor (in our case /dev/rfcommX, where X is the desired port number)
  2. Click Apply Changes and then Save to save the current configuration
  3. Under the Sensors menu, right-click the Intelipod VNTDevXX module and select Start
  4. In the Inputs/Outputs section of the selected module, click Refresh (beside the Inputs/Outputs title) to view live data from the Intelipod
  5. Repeat a-d for each Intelipod sensor

<br />
**NOTES**
* The Intelipod sensors are currently configured to NOT start automatically
    * If desired, they can be configured to start automatically by checking the Auto Start box, then Apply Changes and Save

 * If a module is started (including auto-started) with an incorrect or non-existent Port Name, OpenSensorHub will throw an error

 * Sensor Observation Service (SOS) is already configured to offer data from Intelipods VNTDev24, VNTDev26, and VNTDev27
    * hese offerings can be viewed and configured in the Services -> SOS Service menu
 * Storage is also already configured to archive data from Intelipods VNTDev24, VNTDev26, and VNTDev27
    * These storage items can be viewed and configured in the Storage menu

 * All settings can be configured by editing the file osh-venti/config.json
    * An example of the communication settings, as a JSON object, for a given Intelipod sensor module is given below:

```json
{
  "objClass": "org.sensorhub.impl.sensor.intelipod.IntelipodConfig",
  "serialNumber": "vnt24",
  "commSettings": {
    "objClass": "org.sensorhub.impl.comm.rxtx.RxtxSerialCommProviderConfig",
    "protocol": {
      "objClass": "org.sensorhub.impl.comm.UARTConfig",
      "portName": "/dev/rfcomm0",
      "baudRate": 9600,
      "dataBits": 8,
      "stopBits": 1,
      "parity": "PARITY_NONE",
      "receiveTimeout": 60000,
      "receiveThreshold": 1
    },
    "moduleClass": "org.sensorhub.impl.comm.rxtx.RxtxSerialCommProvider",
    "autoStart": false
  },
  "id": "urn:osh:intelipod:vnt24",
  "moduleClass": "org.sensorhub.impl.sensor.intelipod.IntelipodSensor",
  "name": "Intelipod VNTDev24",
  "autoStart": false
}
```
---

## Viewing Data in Web Client

1. With OpenSensorHub running, in browser go to http://localhost:8181/Clients/Intelipod (localhost can be replaced with IP address of OpenSensorHub node) to view the web client

2. If needed, edit the file osh-venti/Web/Clients/Intelipod/js/osh-config.js to configure the client.
  1. var hostName = "localhost" at the top of this file can be changed to the IP address of the OpenSensorHub node if not running locally (e.g. "192.168.0.101" instead of "localhost")
  2. The function addIntelipod() (shown in lines 40-42) can be used to add additional Intelipod sensors to the client
    1. arguments: addIntelipod(String entityID, String entityName, String offeringID)

**NOTES**
* The client is currently configured to show data for VNTDev24, VNTDev26, and VNTDev27
  * Intelipod icons should be visible on a 3D map showing current Latitude, Longitude, and Altitude
  * Plots of temperature and pressure for each sensor should appear on the right side of the browser window
  * Plots may be closed individually
  * To show plots, right-click an Intelipod entity in the Entities window and select Show Temperature or Show Pressure

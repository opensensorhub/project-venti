function init() {

  var hostName = "localhost";
  var startTime = "now";
  var endTime = "2100-01-01";

  var sync = false;
  var dataStreamTimeOut = 60000;
  var useFFmpegWorkers = true;

  // menu ids
  var treeMenuId = "tree-menu-";
  var mapMenuId = "map-menu-";
  var menuGroupId = "allmenus";


	//---------------------------------------------------------------//
  //------------------- Data Sources Controller -------------------//
  //---------------------------------------------------------------//

  var dataSourceController = new OSH.DataReceiver.DataReceiverController({
      replayFactor: 1.0
  });


  //--------------------------------------------------------------//
  //-------------------------  Map View  -------------------------//
  //--------------------------------------------------------------//

	var cesiumMapView = new OSH.UI.CesiumView("main-container", [],
			{autoZoomOnFirstMarker: false}
	);

  //--------------------------------------------------------------//
  //---------------------- Intelipod Entities --------------------//
  //--------------------------------------------------------------//

  var treeItems = [];

    addIntelipod("intelipodVNT24", "Intelipod VNTDev24", "urn:osh:intelipod:vnt24-sos");
    addIntelipod("intelipodVNT26", "Intelipod VNTDev26", "urn:osh:intelipod:vnt26-sos");
    addIntelipod("intelipodVNT27", "Intelipod VNTDev27", "urn:osh:intelipod:vnt27-sos");


  //--------------------------------------------------------------//
  //------------------------- Tree View  -------------------------//
  //--------------------------------------------------------------//
  var entityTreeDialog = new OSH.UI.DialogView(document.body.id, {
      css: "tree-dialog",
      name: "Entities",
      show: true,
      draggable: true,
      dockable: false,
      closeable: true
  });

  var entityTreeView = new OSH.UI.EntityTreeView(entityTreeDialog.popContentDiv.id, treeItems,
      {
          css: "tree-container"
      }
  );


  //--------------------------------------------------------------//
  //------------------------ Time Slider  ------------------------//
  //--------------------------------------------------------------//
  // var rangeSlider = new OSH.UI.RangeSlider("rangeSlider",{
  //     startTime: "now",
  //     endTime: "2117-01-01T19:22:00Z",
  //     refreshRate:1
  // });


  //--------------------------------------------------------------//
  //------------------ Discovery Dialog and Menu -----------------//
  //--------------------------------------------------------------//
  cssCircleMenu('.js-menu');

  var discoveryDialog    = new OSH.UI.DialogView(document.body.id,{
      css: "discovery-dialog",
      name: "Discovery",
      show:false,
      draggable:true,
      dockable: false,
      closeable: true
  });

  var discoveryView = new OSH.UI.DiscoveryView("",{
      services: ["http://" + hostName + ":8181/"],
      css: "discovery-view",
      dataReceiverController: dataSourceController,
      swapId: "main-container",
      entities: [],
      views: [{
          name: 'Cesium 3D Map',
          viewId: cesiumMapView.id,
          type : OSH.UI.DiscoveryView.Type.MARKER_GPS
      },{
          name: 'Video dialog(H264)',
          type : OSH.UI.DiscoveryView.Type.DIALOG_VIDEO_H264
      },{
          name: 'Video dialog(MJPEG)',
          type : OSH.UI.DiscoveryView.Type.DIALOG_VIDEO_MJPEG
      },{
          name: 'Chart dialog',
          type : OSH.UI.DiscoveryView.Type.DIALOG_CHART
      }]
  });

  discoveryView.attachTo(discoveryDialog.popContentDiv.id);

  $("add-entity-button").on("click",function(event){
      discoveryDialog.show({
          viewId : discoveryDialog.id
      });
  });


  dataSourceController.connectAll();



  //--------------------------------------------------------------//
  //------ Helper methods to add specific types of sensors -------//
  //--------------------------------------------------------------//

  function addIntelipod(entityID, entityName, offeringID) {
		console.log("Adding Intelipod Network '" + entityName + "'");

      // create data sources
			var intelipodData = new OSH.DataReceiver.DataSourceIntelipod("Intelipod", {
          protocol : "ws",
          service: "SOS",
          endpointUrl: hostName + ":8181/sensorhub/sos",
          offeringID: offeringID,
          observedProperty: "http://sensorml.com/ont/swe/property/IntelipodData",
          startTime: startTime,
          endTime: endTime,
          replaySpeed: "1",
          syncMasterTime: sync,
          bufferingTime: 60000,
          timeOut: dataStreamTimeOut
      });

      var locationData = new OSH.DataReceiver.LatLonAlt("Location", {
          protocol : "ws",
          service: "SOS",
          endpointUrl: hostName + ":8181/sensorhub/sos",
          offeringID: offeringID,
          observedProperty: "http://www.opengis.net/def/property/OGC/0/SensorLocation",
          startTime: startTime,
          endTime: endTime,
          replaySpeed: "1",
          syncMasterTime: sync,
          bufferingTime: 60000,
          timeOut: dataStreamTimeOut
      });

      // create entity
      var entity = {
          id: entityID,
          name: entityName,
          dataSources: [intelipodData, locationData]
      };
      dataSourceController.addEntity(entity);

      // add item to tree
      treeItems.push({
          entity : entity,
          path: "Intelipods",
          treeIcon : "images/WirelessSensor.png",
          contextMenuId: treeMenuId + entity.id
      })

      // add marker to map
      cesiumMapView.addViewItem({
          name: entityName,
          entityId : entity.id,
          styler : new OSH.UI.Styler.PointMarker({
              locationFunc : {
                  dataSourceIds : [locationData.getId()],
                  handler : function(rec) {
                      return {
                          x : rec.lon,
                          y : rec.lat,
                          z : rec.alt
                      };
                  }
              },
              icon : "./models/Intelipod.glb",
              label: entityName
          }),
          contextMenuId: mapMenuId+entityID
      });

			// temperature chart view
			var tempChartDialog = new OSH.UI.DialogView("dialog-main-container", {
					draggable: false,
					css: "video-dialog",
					name: entityName + " - Temp",
					show: true,
					dockable: true,
					closeable: true,
					canDisconnect : true,
					swapId: "main-container",
					connectionIds: [intelipodData.getId()],
					keepRatio: true
			});

			var tempChartView = new OSH.UI.Nvd3CurveChartView(tempChartDialog.popContentDiv.id,
			[{
					styler: new OSH.UI.Styler.Curve({
							valuesFunc: {
									dataSourceIds: [intelipodData.getId()],
									handler: function (rec, timeStamp) {
											return {
													x : timeStamp,
													y : rec.airTemp
											};
									}
							},
							color: '#ff7f0e'
					})
			}],
			{
				entityId : entity.id,
				css: "chart-view",
				cssSelected: "video-selected",
				maxPoints: 50,
				yLabel: 'Temperature (' + String.fromCharCode(176) + 'F)',
				height: 200,
				minY: 85,
				maxY: 95
			});

			// pressure chart view
			var pressureChartDialog = new OSH.UI.DialogView("dialog-main-container", {
					draggable: false,
					css: "video-dialog",
					name: entityName + " - Pressure",
					show: true,
					dockable: true,
					closeable: true,
					canDisconnect : true,
					swapId: "main-container",
					connectionIds: [intelipodData.getId()],
					keepRatio: true
			});

			var pressureChartView = new OSH.UI.Nvd3CurveChartView(pressureChartDialog.popContentDiv.id,
			[{
					styler: new OSH.UI.Styler.Curve({
							valuesFunc: {
									dataSourceIds: [intelipodData.getId()],
									handler: function (rec, timeStamp) {
											return {
													x : timeStamp,
													y : rec.airPres
											};
									}
							},
							color: '#33f0ff'
					})
			}],
			{
				entityId : entity.id,
				css: "chart-view",
				cssSelected: "video-selected",
				maxPoints: 50,
				yLabel: 'Pressure (hPa)',
				height: 200,
				minY: 990,
				maxY: 1000
			});

      // add tree and map context menus
      var menuItems = [{
          name: "Show Temperature",
          viewId: tempChartDialog.getId(),
          css: "fa fa-fire",
          action: "show"
      },
			{
          name: "Show Pressure",
          viewId: pressureChartDialog.getId(),
          css: "fa fa-compress",
          action: "show"
      }
		];

      var markerMenu = new OSH.UI.ContextMenu.CircularMenu({id:mapMenuId+entityID, groupId: menuGroupId, items: menuItems});
      var treeMenu = new OSH.UI.ContextMenu.StackMenu({id: treeMenuId+entityID, groupId: menuGroupId, items: menuItems});

      return entity;
  }
}

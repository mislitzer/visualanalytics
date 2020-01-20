jq = jQuery.noConflict();

var countrySelection = [];
var filteredData = [];

function openPopup() {
	jq("#vrModal").modal('toggle');
}

function loadAirplaneData(countries, amount, type = "VR", update = false) {
	var dataUrl = "https://opensky-network.org/api/states/all";
	jq.get(dataUrl, function(data) {
		filteredData = [];
		jq.each(data.states, function(key, flight) {
			var countryFlight = flight[getField("origin_country")];
			if (countries.indexOf(countryFlight) != -1) {
				filteredData.push(flight);
			}
		});

        filteredData = filteredData.slice(0, amount);

        if (type === "VR") {
            drawAirplaneDataVr(filteredData, update);
        }
        else if (type === "MAP") {
            drawAirplaneDataMap(filteredData);
        }
	});
}

function drawAirplaneDataVr(filteredData, update) {
    var scene = "";
    scene += '<a-entity id="inner-data">';
    jq.each(filteredData, function(key, val) {
        var lat = val[getField("latitude")];
        var lng = val[getField("longitude")];
        var alt = val[getField("baro_altitude")];

        if (!update) {
            registerComponents(key, val);
        }
        else {
            updateComponents(key, val);
        }

        if (alt != null && alt > 1000) {
            scene += '<a-box height=".5" width="1" position="' + lat + ' ' + (alt / 200) + ' ' + lng + '" rotation="0 45 0" color="'+getColor(val[getField("origin_country")])+'" aircraft_'+key+'>';
            //scene += '<a-box height=".5" width="1" position="' + (lat) + ' ' + (alt / 200) + ' ' + lng + '" rotation="0 45 0" src="#aircraft_texture" aircraft_'+key+'>';
            scene += '</a-box>';
        }
    });

    scene += '</a-entity>';

    if (update) {
        jq(".main-scene #main-scene-wrapper #inner-data").html(scene);
    }
    else {
        jq(".main-scene #main-scene-wrapper").append(scene);
    }
}

function drawAirplaneDataMap(filteredData) {

    var heatmapData = [];
    filteredData.forEach(filtered => {
        var lat = filtered[getField("latitude")];
        var lng = filtered[getField("longitude")];

        heatmapData.push(
            new google.maps.LatLng(lat, lng)
        );
    });

    var centerMap = new google.maps.LatLng(25.267406, 55.292681);

    map = new google.maps.Map(document.getElementById('heatmap'), {
        center: centerMap,
        zoom: 3,
        mapTypeId: 'satellite'
    });

    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });
    heatmap.setMap(map);
}

function registerComponents(key, val) {
	AFRAME.registerComponent('aircraft_' + key, {
		schema: {
			airplanedata: {
				default: val
			}
		},
		init: function() {
			var el = this.el;
			var data = this.data;
			el.addEventListener('mouseenter', function () {
				console.log(data);
			});
		}
	});
}

function updateComponents(key, val) {
	var component = AFRAME.components["aircraft_" + key];
	if (typeof component != "undefined") {
		component.schema.airplanedata.default = val;
	}
}

function openScene(frameid) {
	return typeof frameid != "undefined" ? '<a-scene id="'+frameid+'" vr-mode-ui="enabled: true;">' : '<a-scene>';
}

function closeScene() {
	return '</a-scene>';
}

function drawGround() {
	var ground = "";
	for (var i = 0; i < 10; i++) {
		for (var j = 0; j < 10; j++) {
			ground += '<a-box color="#35682d" width="1" height="1" position="'+i+' 0 -'+j+'"></a-box>';
			ground += '<a-box color="#35682d" width="1" height="1" position="-'+i+' 0 -'+j+'"></a-box>';
			ground += '<a-box color="#35682d" width="1" height="1" position="'+i+' 0 '+j+'"></a-box>';
			ground += '<a-box color="#35682d" width="1" height="1" position="-'+i+' 0 '+j+'"></a-box>';
		}
	}

	return ground;
}

function drawTrees(amount, type) {
	var generatedPosition = [];
	var trees = "";
	for (var i = 0; i < amount; i++) {
		var randX = Math.floor(Math.random() * 9);
		var randZ = Math.floor(Math.random() * 9);

		if (type[0] == "b") {
			randZ = randZ * (-1);
		}
		if (type[1] == "l") {
			randX = randX * (-1);
		}

		var posSelector = randX + ";" + randZ;
		if (generatedPosition.indexOf(posSelector) == -1) {
			trees += '<a-box color="#4c2f26" position="'+randX+' .6 '+randZ+'" depth=".01" width=".01" height=".1"></a-box>';
			trees += '<a-sphere color="#31372B" radius=".05" position="'+randX+' .7 '+randZ+'"></a-sphere>';
			generatedPosition.push(posSelector);
		}
	}

	return trees;
}

function doRequests(autosync = false, type = "VR", interval) {
	loadAirplaneData(countrySelection, 1000, type, false);

	if (autosync) {
		var updateInt = setInterval(function() {
			console.log('update');
			loadAirplaneData(countrySelection, 1000, type, true);
		}, interval);
	}
}

function drawAthmosphere() {
	var athmosphere = "";
	athmosphere += openScene("main-scene-wrapper");
	athmosphere += drawGround();
	athmosphere += drawTrees(20, ["t", "r"]);
	athmosphere += drawTrees(20, ["b", "r"]);
	athmosphere += drawTrees(20, ["t", "l"]);
	athmosphere += drawTrees(20, ["b", "l"]);
	athmosphere += '<a-sky color="lightblue"></a-sky>';
	athmosphere += '<a-entity camera="userHeight: 1.6" look-controls><a-cursor></a-cursor></a-entity>';
	athmosphere += closeScene();

	jq(".main-scene").append(athmosphere);
}

function getField(selector) {
	var table = {
		"icao24":0,
		"callsign":1,
		"origin_country":2,
		"time_position":3,
		"last_contact":4,
		"longitude":5,
		"latitude":6,
		"geo_altitude":7,
		"on_ground":8,
		"velocity":9,
		"heading":10,
		"vertical_rate":11,
		"sensors":12,
		"baro_altitude":13,
		"squawk":14,
		"spi":15,
		"position_source":16
	}

	return table[selector];
}

function getColor(country) {
	var colors = {
		"Austria":"red",
		"Italia":"green",
		"Switzerland":"darkred",
		"United States":"blue",
		"Japan":"orange",
		"South Africa":"yellow",
		"default":"black"
    }

	return typeof colors[country] != "undefined" ? colors[country] : colors["default"];
}

function registerPopupEvents() {
	jq("body").on("click", "#vrModal .selecting button", function() {
		var content = jq(this).text();
		if (jq(this).hasClass("all")) {
			if (countrySelection.length) {
				jq(this).text("Select All");
				countrySelection = [];
				jq("#vrModal .selecting button").not(".all").removeClass("btn-primary").addClass("btn-outline-primary");
			}
			else {
				jq(this).text("Remove All");
				jq("#vrModal .selecting button").each(function() {
					if (!jq(this).hasClass("all")) {
						var value = jq(this).text();
						countrySelection.push(value);
						jq("#vrModal .selecting button").removeClass("btn-outline-primary").addClass("btn-primary");
					}
				})
			}
		}
		else {
			if (countrySelection.indexOf(content) == -1) {
				jq(this).removeClass("btn-outline-primary").addClass("btn-primary");
				countrySelection.push(content);
			}
			else {
				jq.each(countrySelection, function(key, val) {
					if (val == content) {
						console.log(key);
						countrySelection.splice(key, 1);
					}
				});
				jq(this).removeClass("btn-primary").addClass("btn-outline-primary");
			}
		}
	});

	jq("body").on("click", "#applyCountries", function() {
		if (countrySelection.length) {
			jq("#vrModal").modal('toggle');
            jq("#vrModal #alert").hide();

            drawAthmosphere();
			doRequests(true, "VR", 10000);
		}
		else {
            jq("#vrModal #alert").slideToggle();
		}
    });
    
    jq("body").on("click", ".show-map-btn", function() {
        if (countrySelection.length) {
            jq("#vrModal").modal('toggle');
            jq("#vrModal #alert").hide();

            drawAirplaneDataMap(filteredData);
            jq(".main-scene").css("display", "none");
        }
        else {
            jq("#vrModal #alert").slideToggle();
		}
	});
}

jq(window).on("load", function() {
	// drawAthmosphere();
	openPopup();
	registerPopupEvents();
});
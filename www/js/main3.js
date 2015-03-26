var loaded = 0;
var selectedUser, getItem, marker, map;

document.addEventListener("DOMContentLoaded", function () {
	loaded++;
	if (loaded === 2) {
		initialize();
	}
});

document.addEventListener("deviceready", function () {
	loaded++;
	if (loaded === 2) {
		initialize();
	}
});

function initialize() {
	loadContacts();
	loadMap();
}

function loadContacts() {

	history.pushState({
		page: 1
	}, "Contact List", "?page=1");

	var myPPL = [];
	var list = document.querySelector("#contact-list");

	function onSuccess(contacts) {
		for (var i = 0; i < contacts.length; i++) {
			if (contacts[i].displayName && contacts[i].phoneNumbers != null) {

				if (myPPL.length <= 11) {
					var person = {};
					person.id = contacts[i].id;
					person.name = contacts[i].displayName;

					if (contacts[i].phoneNumbers.length > 1) {
						person.numbers = [{
							"number1": contacts[i].phoneNumbers[0].value
							}, {
							"number2": contacts[i].phoneNumbers[1].value
							}];
					} else {
						person.numbers = [{
							"number1": contacts[i].phoneNumbers[0].value
							}];
					}
					
					person.lat = null;
					person.lng = null;
					myPPL.push(person);

					var li = document.createElement("li");
					li.id = "contact-name";
					li.innerHTML = contacts[i].displayName;
					list.appendChild(li);

				} else {
					localStorage.setItem("dube0141_mid", JSON.stringify(myPPL));
					loadModal();
					getItem = JSON.parse(localStorage.getItem("dube0141_mid"));
					return;
				}
			}
		}
	}

	function onError(contactError) {
		console.log("ERROR: Could not load contacts!");
	}

	getItem = JSON.parse(localStorage.getItem("dube0141_mid"));

	if (getItem == null) {
		var options = new ContactFindOptions();
		options.filter = "";
		options.multiple = true;
		var fields = ["displayName", "phoneNumbers"];
		navigator.contacts.find(fields, onSuccess, onError, options);
	} else {
		for (var i = 0; i < getItem.length; i++) {
			var li = document.createElement("li");
			li.id = "contact-name";
			li.innerHTML = getItem[i].name;
			list.appendChild(li);
		}
		loadModal();
	}
}

function loadMap() {
	var onSuccess = function (position) {

		var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		var mapOptions = {
			zoom: 8,
			disableDoubleClickZoom: true,
			center: myLatlng
		}

		var a = document.getElementById("map");
		a.style.height = (window.innerHeight - 105) + "px";

		map = new google.maps.Map(a, mapOptions);

		google.maps.event.addListener(map, "dblclick", function (ev) {
			if (marker != undefined) {
				marker.setMap(null);
			}

			for (var i = 0; i < getItem.length; i++) {
				if (getItem[i].name == selectedUser) {
					getItem[i].lat = ev.latLng.k;
					getItem[i].lng = ev.latLng.D;
					getItem[i].latlng = new google.maps.LatLng(ev.latLng.D, ev.latLng.k);

					placeMarker(ev.latLng);
					localStorage.setItem("dube0141_mid", JSON.stringify(getItem));
					getItem = JSON.parse(localStorage.getItem("dube0141_mid"));
					return;
				}
			}
		});
	}

	function onError(error) {
		alert('code: ' + error.code + '\n' +
			'message: ' + error.message + '\n');
	}

	navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function placeMarker(location) {
	if (marker != undefined) {
		marker.setMap(null);
		marker = null;
	}

	marker = new google.maps.Marker({
		draggable: false,
		animation: google.maps.Animation.BOUNCE,
		position: location,
		center: location,
		map: map
	});
	map.panTo(marker.getPosition());

	var contentString = '<div id="content"><p><b>' + selectedUser + '</b></p></div>';

	var infowindow = new google.maps.InfoWindow({
		content: contentString
	});

	infowindow.open(map, marker);

	google.maps.event.addListener(marker, 'click', function () {
		infowindow.open(map, marker);
	});

}

function showMap(ev) {

	history.pushState({
		page: 2
	}, "Google Maps", "?page=2");

	var a = selectedUser;
	selectedUser = ev.target.innerHTML;
	var b = selectedUser;

	if (a != b) {
		if (marker != undefined) {
			marker.setMap(null);
		}
	}

	for (var i = 0; i < getItem.length; i++) {
		if (getItem[i].name == selectedUser) {
			if (getItem[i].latlng != null) {
				var c = new google.maps.LatLng(getItem[i].lat, getItem[i].lng);
				placeMarker(c);
			} else {
				alert("Double tap on the map to set a position for the contact.");
			}
		}
	}

	contactPage = document.querySelector("#contacts");
	mapPage = document.querySelector("#map");
	backButton = document.querySelector("#back-button");

	contactPage.style.display = "none";
	mapPage.style.display = "block";
	backButton.style.display = "block";

	google.maps.event.trigger(map, 'resize');

	window.addEventListener("popstate", function () {
		hideMap();
	});

	var backB = new Hammer(backButton);
	backB.on('tap', function (ev) {
		hideMap();
	});
}

function hideMap() {

	contactPage = document.querySelector("#contacts");
	mapPage = document.querySelector("#map");
	backButton = document.querySelector("#back-button");

	mapPage.style.display = "none";
	backButton.style.display = "none";
	contactPage.style.display = "block";
}

function loadModal() {
	var contacts = document.querySelectorAll("#contact-name");

	for (var i = 0; i < contacts.length; i++) {
		var mc = new Hammer.Manager(contacts[i]);

		mc.add(new Hammer.Tap({
			event: 'doubletap',
			taps: 2
		}));

		mc.add(new Hammer.Tap({
			event: 'singletap'
		}));

		mc.get('doubletap').recognizeWith('singletap');
		mc.get('singletap').requireFailure('doubletap');

		mc.on("doubletap", function (ev) {
			showMap(ev);
		});
		mc.on("singletap", function (ev) {
			buildModal(ev);
		});
	}
}

function buildModal(ev) {
	var header = document.querySelector("header");
	var modal = document.createElement("div");
	var modalContainer = document.createElement("div");
	var modalShadow = document.createElement("div");
	var img = document.createElement("img");
	var h3 = document.createElement("h3");
	var p = document.createElement("p");

	modal.id = "modal";
	modalContainer.id = "modal-container";
	modalShadow.id = "modal-shadow";
	img.id = "modal-exit";
	img.src = "img/exit.svg";
	h3.innerHTML = ev.target.innerHTML;

	for (var i = 0; i < getItem.length; i++) {
		if (getItem[i].name == ev.target.innerHTML) {
			p.innerHTML = "Contact ID: " + getItem[i].id + "<br>";
			p.innerHTML += "Number 1: " + getItem[i].numbers[0].number1 + "<br>";
						
			if(getItem[i].numbers[1] != undefined){
				p.innerHTML += "Number 2: " + getItem[i].numbers[1].number2 + "<br>";
			}
			
			p.innerHTML += "Latitude: " + getItem[i].lat + "<br>";
			p.innerHTML += "Longitude: " + getItem[i].lng + "<br>";
		}
	}

	modalContainer.appendChild(img);
	modalContainer.appendChild(h3);
	modalContainer.appendChild(p);
	modal.appendChild(modalContainer);
	modal.appendChild(modalShadow);
	header.parentNode.insertBefore(modal, header);

	var mExit = document.querySelector("#modal-exit");
	var hammertime = new Hammer(mExit);
	hammertime.on('tap', function (ev) {
		var modalObj = document.querySelector("#modal");
		modalObj.remove();
	});

	var mShadow = document.querySelector("#modal-shadow");
	var hammertime = new Hammer(mShadow);
	hammertime.on('tap', function (ev) {
		var modalObj = document.querySelector("#modal");
		modalObj.remove();
	});
}
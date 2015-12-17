var map;
var marker;
var circles = {};
function initMap() {
	var pos = {lat: latitude, lng: longitude};
	map = new google.maps.Map(document.getElementById('map'), {
		center: pos,
		zoom: 16,
		disableDefaultUI: true
	});
	mapOptions = {
    	draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: false,
        zoomControl: false
    };
    map.setOptions(mapOptions);
    
    if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
		function(position) {
			var tracked = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
		  	};
		  	map.setCenter(tracked);
		  	marker = new google.maps.Marker({
				position: tracked,
				map: map,
				title: ''
			});
		},
		function(error) {
            console.log(error);
        },
		{
            maximumAge:60000,
            timeout:5000,
            enableHighAccuracy:false
        });
	}
	
	else{
		marker = new google.maps.Marker({
			position: pos,
			map: map,
			title: ''
		});
	}
}

function changeLocation(lat, lng){
	marker.setMap(null);
	var pos = {lat: lat, lng: lng};
	map.setCenter(pos);
	marker = new google.maps.Marker({
		position: pos,
		map: map,
		title: ''
	});
}

function postRadius(key, lat, lng){
	var pos = {lat: lat, lng: lng};
	var circle = new google.maps.Circle(
		{
			strokeColor: '#6699ff',
			strokeOpacity: 0.55,
			strokeWeight: 1,
			fillColor: '#6699ff',
			fillOpacity: 0.25,
			map: map,
			center: pos,
			radius: 100
		
		}
	);
	circles[key] = circle;
	map.setCenter(pos);
}

function removeRadius(key){
	var circle = circles[key];
	if (circle){
		circle.setMap(null);
	}
}

function removeAllRadius(){
	for (var key in circles) {
		circles[key].setMap(null);
	}
}
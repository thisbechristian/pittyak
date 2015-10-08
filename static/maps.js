var map;
var infoWindow;
function initMap() {
	var lat = parseFloat(document.getElementById('lat').innerHTML); 
	var lng  = parseFloat(document.getElementById('lng').innerHTML);
	var locationSet = !isNaN(lat) && !isNaN(lng);

	if(!locationSet){
		lat = 40.442014;
		lng = -79.962552;
	}

	map = new google.maps.Map(document.getElementById('map'), {
    	center: {lat: lat, lng: lng},
    	zoom: 15
    });
	 
	 if (navigator.geolocation && !locationSet) {
	 	infoWindow = new google.maps.InfoWindow({map: map});
		navigator.geolocation.getCurrentPosition(function(position) {
		  var pos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		  };
		  infoWindow.setPosition(pos);
		  infoWindow.setContent('There you are!');
		  map.setCenter(pos);
		});
	}
	
	else if(locationSet){
		var pos = {
			lat: lat,
			lng: lng
		};
		infoWindow = new google.maps.InfoWindow({map: map});
		infoWindow.setPosition(pos);
		infoWindow.setContent('See whats going on!');
	}
}
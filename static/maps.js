var map;
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
    	center: {lat: 40.442014, lng: -79.962552},
    	zoom: 15
    });
	var infoWindow = new google.maps.InfoWindow({map: map});
	 
	 if (navigator.geolocation) {
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
}
var map;
var infoWindow;
function initMap() {
	var lat = parseFloat(document.getElementById('lat').innerHTML); 
	var lng  = parseFloat(document.getElementById('lng').innerHTML);
	var locationSet = !isNaN(lat) && !isNaN(lng);

	if(!locationSet){
		lat = 40.444322;
		lng = -79.9609691;
	}
	
	var pos = {lat: lat, lng: lng};

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
	 
	if (navigator.geolocation && !locationSet) {
		navigator.geolocation.getCurrentPosition(
		function(position) {
			var tracked = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
		  	};
		  	map.setCenter(tracked);
		  	var marker = new google.maps.Marker({
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
		var marker = new google.maps.Marker({
			position: pos,
			map: map,
			title: ''
		});
  	}
	
}
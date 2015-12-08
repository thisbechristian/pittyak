var posts = new Object();
var lastLoad = 0;
var lastPost = 0;
var login = false;
var admin = false;
var timeOrder = true;
var loct = "GLOBAL";
var location_filter = "GLOBAL";
var user_filter = false;

if (navigator.geolocation) 
{
	navigator.geolocation.watchPosition(showPosition);
}

$(window).load(function() {
	$("#Loading").delay(500).fadeOut("slow");
});

function loggedIn(isAdmin){
	login = true;
	admin = isAdmin;
}

function parseBoolean(string){
	return (string.toLowerCase() === 'true');
}

////////////////////////////////////////////////////////////////////////////////////
//Ajax core functionality

function createXmlHttp() {
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	} 
	else{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
  	if(!(xmlhttp)){
		alert("Your browser does not support AJAX!");
	}
	return xmlhttp;
}

function sendData(params, toUrl, callbackFunction){
	var xmlHttp = createXmlHttp()
	if(!(xmlHttp)){
		return;
	}
	xmlHttp.onreadystatechange = function() {
		if(xmlHttp.readyState == 4){
			callbackFunction(xmlHttp, params);
		}
	}
	var parameters = '';
	for(var param in params){
		parameters += param + '=' + escape(params[param]) + '&';
	}
	xmlHttp.open("POST", toUrl, true);
	xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xmlHttp.send(parameters);
}

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
//JavaScript to HTML helper functions

function setHtml(id, text) {
	var tag = document.getElementById(id);
	if (tag) {
		tag.innerHTML = text;
	}
}

function getHtml(id) {
	var tag = document.getElementById(id);
	if (tag) {
		return tag.innerHTML;
	}
}

function getHtmlValue(id) {
	var result = null;
	var tag = document.getElementById(id);
	if (tag) {
		return tag.value;
	}
	return result;
}

function setHtmlValue(id, text) {
	var tag = document.getElementById(id);
	if (tag) {
		tag.value = text;
	}
}

function clearText(id) {
	var tag = document.getElementById(id);
	if (tag) {
		tag.value = '';
		tag.focus();
	}
}

function getRelativeTime(time) {
	var result = 'more than a week ago';
	var now = new Date().getTime();
	console.log(now);
	console.log(time);
	var diff = (now - time) / 1000;
	
	if (diff < 60){
		if(diff == 1){
			result = '1 second ago'
		}
		else{
			result = Math.round(diff) + ' seconds ago';
		}
	}
	
	else if (diff < (60 * 60)){
		var minutes = Math.round(diff / 60);
		if (minutes == 1){
			result = '1 minute ago';
		}
		else{
			result = minutes + ' minutes ago';
		}
	}
	
	else if (diff < (24 * 60 * 60)){
		var hours = Math.round(diff / (60 * 60));
		if(hours == 1){
			result = '1 hour ago';
		}
		else{
			result = hours + ' hours ago';
		}
	}
	
	else if (diff < (7 * 24 * 60 * 60)){
		var days = Math.round(diff / (24 * 60 * 60));
		if(days == 1){
			result = '1 day ago';
		}
		else{
			result = days + ' days ago';
		}
	}
	
	else {
		var weeks = Math.round(diff / (7 * 24 * 60 * 60));
		if(weeks == 1){
			result = '1 week ago';
		}
		else{
			result = weeks + ' weeks ago';
		}
	}
	
	return result;
}

////////////////////////////////////////////////////////////////////////////////////

function convertPostToHtml(post) {
	var text = '';
	text += '<br><br><br>';
	text += '<div class="row">';
	text += '<div id="post" class="col-sm-8 col-sm-offset-2 col-xs-10 col-xs-offset-1">';
	text += '<div class="row">';
	text += '<div class="col-sm-11 col-xs-10">';
	text += '<p>' + post.text + '</p><br><br>';
	text += '<p id="postdate">' + getRelativeTime(post.time) + '</p><br>';
	text +=	'<a href="#" data-toggle="modal" data-target="#ReplyModal" data-post="' + post.key + '">';
	text +=	'<p class="glyphicon glyphicon-share-alt"></p>';
	text +=	'</a>&nbsp&nbsp&nbsp';
	if (post.sub_comments.length > 0){
		text +=	'<a class="glyphicon glyphicon-sort-by-attributes-alt" onclick="toggleSubPostArea(\'' + post.key + '\')"></a>&nbsp&nbsp&nbsp';
	}
	if (admin || post.mine) {	
		text += '<a href="delete?id=' + post.key + '">';
		text += '<p class="glyphicon glyphicon-trash"></p>';	
		text += '</a>';
	}
	text += '</div>';
	text += '<div id="votes" class="col-xs-1">';
	if (login){
		text += '<a id="vote" onclick="updateVote(\'' + post.key + '\',\'up\')">';
		if (post.up_voted){
			text += '<p id ="postupvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-up" style="color:green"></p>';
		}
		else{
			text += '<p id ="postupvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-up" style="color:#6699ff"></p>';
		}
		text += '</a>';
		text += '<p id="votecount_' + post.key +'">' + post.vote_count + '</p>';
		text += '<a id="vote" onclick="updateVote(\'' + post.key + '\',\'down\')">';
		if (post.down_voted){
			text += '<p id ="postdownvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-down" style="color:red"></p>';
		}
		else{
			text += '<p id ="postdownvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-down" style="color:#6699ff"></p>';
		}
		text += '</a>';
	}
	text += '</div>';
	text += '</div>';
	text += '</div>';
	text += '</div>';
	text += '<div id="subpost-' + post.key + '"></input></div>';
	text += '<input id="toggle-' + post.key + '" type="hidden" value="">';
	return text;
}

function convertSubPostToHtml(post) {
	var text = '';
	text += '<br>';
	text += '<div class="row">';
	text += '<div id="post" class="col-sm-6 col-sm-offset-4 col-xs-9 col-xs-offset-2">';
	text += '<div class="row">';
	text += '<div class="col-sm-11 col-xs-10">';
	text += '<p>' + post.text + '</p><br><br>';
	text += '<p id="postdate">' + getRelativeTime(post.time) + '</p><br>';
	if (admin || post.mine) {	
		text += '<a href="delete?id=' + post.key + '">';
		text += '<p class="glyphicon glyphicon-trash"> </p>';	
		text += '</a>';
	}
	text += '</div>';
	text += '<div id="votes" class="col-xs-1">';
	if (login){
		text += '<a id="vote" onclick="updateVote(\'' + post.key + '\',\'up\')">';
		if (post.up_voted){
			text += '<p id ="postupvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-up" style="color:green"></p>';
		}
		else{
			text += '<p id ="postupvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-up" style="color:#6699ff"></p>';
		}
		text += '</a>';
		text += '<p id="votecount_' + post.key +'">' + post.vote_count + '</p>';
		text += '<a id="vote" onclick="updateVote(\'' + post.key + '\',\'down\')">';
		if (post.down_voted){
			text += '<p id ="postdownvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-down" style="color:red"></p>';
		}
		else{
			text += '<p id ="postdownvoted_' + post.key + '" class="glyphicon glyphicon-thumbs-down" style="color:#6699ff"></p>';
		}
		text += '</a>';
	}
	text += '</div>';
	text += '</div>';
	text += '</div>';
	text += '</div>';
	return text;
}

////////////////////////////////////////////////////////////////////////////////////
//sort / filter comments

function toggleSort(time){
	if(time && !timeOrder){
		timeOrder = true;
		setTimeout('loadPosts()', 250);
	}
	else if(!time && timeOrder){
		timeOrder = false;
		setTimeout('loadPosts()', 250);
	}
}

function swap(array, i0, i1) {
	var temp = array[i0];
	array[i0] = array[i1];
	array[i1] = temp;
}

function filterByLocation(location){
	//reset user post filter
	user_filter = false;
	location_filter = location;
	repositionMap();
	sendData( {'location': location} , '/location', handlePost);
}

function filterForUser(){
	user_filter = true;
	repositionMap();
	sendData( {'user': user_filter} , '/me', handlePost);
}

function repositionMap(){
	//re-position map
	if(location_filter === "North Oakland"){
		setHtml('lat', '40.4508487');
		setHtml('lng', '-79.9637237');
	}
	
	else if(location_filter === "Central Oakland"){
		setHtml('lat', '40.4385189');
		setHtml('lng', '-79.9579115');
	}
	
	else if(location_filter === "South Oakland"){
		setHtml('lat', '40.433010');
		setHtml('lng', '-79.958449');
	}
	
	else{
		setHtml('lat', 'none');
		setHtml('lng', 'none');
	}
	initMap();
}

function getSortedPosts() {
	var sortedPosts = new Array();
	for (var key in posts) {
		var p = posts[key];
		var i = sortedPosts.length;
		sortedPosts.push(p);
		while (i > 0 && sortedPosts[i].time < sortedPosts[i - 1].time) {
			swap(sortedPosts, i, i - 1);
			i--;
		}
  	}
	return sortedPosts;
}

function getSortedSubPosts(subPosts){
	var sortedSubPosts = new Array();
	for(var i=0; i < subPosts.length; i++){
		var j = sortedSubPosts.length;
		sortedSubPosts.push(subPosts[i]);
		while(j > 0 && sortedSubPosts[j].time < sortedSubPosts[j-1].time){
			swap(sortedSubPosts, j, j-1);
			j--;
		}
	}
	return sortedSubPosts;
}

function getReverseSortedPosts() {
	var sortedPosts = new Array();
	for (var key in posts) {
		var p = posts[key];
		var i = sortedPosts.length;
		sortedPosts.push(p);
		while (i > 0 && sortedPosts[i].time > sortedPosts[i - 1].time) {
    		swap(sortedPosts, i, i - 1);
      		i--;
    	}
	}
	return sortedPosts;
}

function getTopVoteSortedPosts() {
	var sortedPosts = new Array();
	for(var key in posts){
		var p = posts[key];
		var i = sortedPosts.length;
		sortedPosts.push(p);
		while(i > 0 && sortedPosts[i].vote_count > sortedPosts[i - 1].vote_count){
			swap(sortedPosts, i, i-1);
			i--;
		}
	}
	return sortedPosts;
}

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
//handle loading comments

function loadPostArea() {
	var sorted = timeOrder ? getReverseSortedPosts() : getTopVoteSortedPosts();
	var text = '';
	for (var i = 0; i < sorted.length; i++) {
    	text += convertPostToHtml(sorted[i]);
  	}
  	$('#posts').hide();
  	setHtml('posts', text);
  	$('#posts').fadeIn(600);
  	
  	for (var i = 0; i < sorted.length; i++) {
    	var subs = sorted[i].sub_comments;
    	if(subs){   
    		var key = sorted[i].key; 
    		var element = 'subpost-'+key;
    		var state = 'toggle-'+key;
    		var subtext = '';	
			var sortedSubs = getSortedSubPosts(subs)
			for(var j = 0; j < sortedSubs.length; j++){
				subtext += convertSubPostToHtml(sortedSubs[j]);
			}
			setHtml(element, subtext);
			$('#' + element).hide();
			setHtmlValue(state, "inactive");
    	}
  	}
}

function toggleSubPostArea(key){
	var element = 'subpost-'+key;
	var state = 'toggle-'+key;
	
	if(getHtmlValue(state) === "active"){
		$('#' + element).hide("slow");
		setHtmlValue(state, "inactive");
	}
	
	else{
		$('#' + element).show("slow");
		setHtmlValue(state, "active");
	}
}

function showSubPostArea(key){
	var element = 'subpost-'+key;
	var state = 'toggle-'+key;
	if(getHtmlValue(state) === "inactive"){
		$('#' + element).show("slow");
		setHtmlValue(state, "active");
	}
}

function loadPosts(){
	sendData({'since':lastPost, 'location':location_filter, 'user':user_filter }, '/comments', handlePosts);
}

function handlePosts(xmlHttp, params) {
	var pageData = JSON.parse(xmlHttp.responseText);
	handlePageData(pageData);
}

function handlePageData(pageData) {
	if (pageData) {
		if (pageData.posts) {
			posts = new Object();
  			var first = true;
  			for (var i = 0; i < pageData.posts.length; i++) {
				var p = pageData.posts[i];
				if (first) {
	  				first = false;
	 				lastPost = p.time;
				}
				p.time = parseInt(p.time);
				p.vote_count = parseInt(p.vote_count);
				p.up_voted = parseBoolean(p.up_voted);
				p.down_voted = parseBoolean(p.down_voted);
				p.mine = parseBoolean(p.mine);
				if (p.sub_comments) {
					for (var j = 0; j < p.sub_comments.length; j++) {
						var s = p.sub_comments[j];
						s.time = parseInt(s.time);
						s.vote_count = parseInt(s.vote_count);
						s.up_voted = parseBoolean(s.up_voted);
						s.down_voted = parseBoolean(s.down_voted);
						s.mine = parseBoolean(s.mine);
 					}
 				}
 				posts[p.key] = p;
 			}
 			loadPostArea();
		}
	}
}

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
//handle sending comments

//gets location
function showPosition(position) 
{
	var lat = position.coords.latitude;
	var lon = position.coords.longitude;
	var xmlHttp = createXmlHttp();
	xmlHttp.onreadystatechange=function() 
	{
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200) 
		{
			var responseT = xmlHttp.responseText;
			if(responseT.indexOf("North Oakland") >= 0)
			{
				loct="North Oakland";
			}
			else if(responseT.indexOf("South Oakland") >= 0)
			{
				loct="South Oakland";
			}
			else if(responseT.indexOf("Central Oakland") >= 0)
			{
				loct="Central Oakland";
			}
			else
			{
				loct="GLOBAL";
			}
		}
		else
		{
			loct="GLOBAL";
		}
	}
	postParameters(xmlHttp, 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon, '');
}

function postParameters(xmlHttp, target, parameters) 
{
	if (xmlHttp) 
	{
		xmlHttp.open("POST",target,true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send(parameters);
	}
}

function sendPost(){
	var text = getHtmlValue("PostTextArea");
	if(text) {
		if(text.length < 500){
			clearText("PostTextArea");
			sendData( {'comment': text, 'location': loct} , '/comment', handlePost);
		}
		else{
			alert("Your post is wayyyyyyy too long!");
			document.getElementById("PostTextArea").focus();
		}
	}
}

function sendSubPost(){
	var text = getHtmlValue("ReplyTextArea");
	var id = getHtmlValue("PostId");
	if(text) {
		if(text.length < 500){
			clearText("ReplyTextArea");
			sendData( {'reply': text, 'id': id} , '/reply', handleSubPost);
		}
		else{
			alert("Your post is wayyyyyyy too long!");
		}
	}
}

function handlePost(xmlHttp, params) {
	setTimeout('loadPosts()', 300);
}

function handleSubPost(xmlHttp, params) {
	setTimeout('loadPosts()', 300);
	var toggle = 'showSubPostArea("' + params['id'] + '")';
	setTimeout(toggle, 1000);
}

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
//handle up/down votes
function updateVote(id,vote){
	var params = {
		'id': id,
		'vote': vote
	};
	sendData(params, "/vote", handleVote);
}	

function handleVote(xmlHttp, params){
	var id = params['id'];
	var vote = params['vote'];
	document.getElementById('votecount_'+id).innerHTML = xmlHttp.responseText
	if (vote=='down') {
		document.getElementById("postdownvoted_"+id).style.color = "red";
		document.getElementById("postupvoted_"+id).style.color = "#6699ff";
	}
	if (vote=='up') {
		document.getElementById("postupvoted_"+id).style.color = "green";
		document.getElementById("postdownvoted_"+id).style.color = "#6699ff";
	}
}
////////////////////////////////////////////////////////////////////////////////////

//refresh comments
function loadLoop() {
	var msSinceLast = (new Date().getTime() - lastLoad);
	if (msSinceLast > 60000) {
		loadPosts();
		lastLoad = new Date().getTime();
	}
	setTimeout('loadLoop();', 1000);
}

var posts = new Object();
var filtered = new Object();
var lastLoad = 0;
var lastPost = 0;
var login = false;
var admin = false;
var windowScrollPositionY = 0;
var inOrder = true;

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
		result = 'a few seconds ago';
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
		if(hours == 1){
			result = '1 day ago';
		}
		else{
			result = hours + ' days ago';
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
	if (post.sub_comments){
		text +=	'<a class="glyphicon glyphicon-sort-by-attributes-alt" onclick="loadSubPostArea(\'' + post.key + '\')"></a>&nbsp&nbsp&nbsp';
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
//sort comments

function swap(array, i0, i1) {
	var temp = array[i0];
	array[i0] = array[i1];
	array[i1] = temp;
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

////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////
//handle loading comments

function loadPostArea() {
	var sorted = getReverseSortedPosts();
	var text = '';
	for (var i = 0; i < sorted.length; i++) {
    	text += convertPostToHtml(sorted[i]);
  	}
  	setHtml('posts', text);
  	
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

function loadSubPostArea(key){
	var post = posts[key];
	var element = 'subpost-'+key;
	var state = 'toggle-'+key;
	var subs = post.sub_comments;
	var text = '';
	
	console.log(getHtmlValue(state));
	
	if(getHtmlValue(state) === "active"){
		$('#' + element).hide("slow");
		setHtmlValue(state, "inactive");
	}
	
	else{
		$('#' + element).show("slow");
		setHtmlValue(state, "active")
	}
}

function loadPosts(){
	sendData({'since':lastPost}, '/comments', handlePosts);
}

function handlePosts(xmlHttp, params) {
	var pageData = JSON.parse(xmlHttp.responseText);
	handlePageData(pageData);
}

function handlePageData(pageData) {
	if (pageData) {
		if (pageData.posts) {
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

function sendPost(){
	var text = getHtmlValue("PostTextArea");
	if(text) {
		if(text.length < 500){
			clearText("PostTextArea");
			sendData( {'comment': text} , '/comment', handlePost);
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
			sendData( {'reply': text, 'id': id} , '/reply', handlePost);
		}
		else{
			alert("Your post is wayyyyyyy too long!");
		}
	}
}

function handlePost(xmlHttp, params) {
	setTimeout('loadPosts()', 300);
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
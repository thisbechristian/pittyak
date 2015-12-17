import time
import logging
import datetime

from random import randint
from google.appengine.api import memcache
from google.appengine.ext import ndb

class Post(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.IntegerProperty()
	profile_picture = ndb.IntegerProperty()
	location = ndb.StringProperty()
	latitude = ndb.StringProperty(default='40.444322')
	longitude = ndb.StringProperty(default='-79.9609691')
	
	##########################################################
	#add / change votes
	def add_up_vote(self, user):	
		if self.is_up_voted(user):
			return
		if self.is_down_voted(user):
			self.change_vote(user, "up")
			return
		self.add_vote(user, "up")
		
	def add_down_vote(self, user):
		if self.is_down_voted(user):
			return
		if self.is_up_voted(user):
			self.change_vote(user, "down")
			return
		self.add_vote(user, "down")	
		
	def add_vote(self, user, type):
		id = str(self.key.urlsafe()) + str(user)
		vote = PostVote(id=id, parent=self.key)
		vote.user = user
		vote.vote = type
		vote.put()
		self.add_vote_to_memcache(user,vote)
	
	def change_vote(self, user, type):
		vote = self.get_vote(user)
		vote.vote = type
		vote.put()
		self.add_vote_to_memcache(user,vote)	
	
	##########################################################	
	#add/update the vote memcache
		
	def add_vote_to_memcache(self, user, vote):
		key = self.key.urlsafe() + "votes"
		votes = self.get_votes()
		print user
		if user in votes:
			del votes[user]
		votes[user] = vote
		memcache.set(key, votes)

	##########################################################
	#get a vote or get all votes

	def get_vote(self,user):
		id = str(self.key.urlsafe()) + str(user)
		result = None
		votes = self.get_votes()
		if votes and (user in votes):
			result = votes[user]
		else:
			result = PostVote.get_by_id(id, parent=self.key)
			self.add_vote_to_memcache(user, result)
		return result
			
	def get_votes(self):
		key = self.key.urlsafe() + "votes"
		votes = memcache.get(key)
		if not votes:
			votes = dict()
			vote_list = PostVote.query(ancestor=self.key)
			for vote in vote_list:
				votes[vote.user] = vote
			memcache.set(key, votes)
		return votes
		
	##########################################################
	#count votes

	def count_votes(self):
		pos = 0
		neg = 0
		votes = self.get_votes().values()
		print self.key.urlsafe()
		for vote in votes:
			if vote and vote.vote == "up":
				pos = pos+1
			elif vote and vote.vote == "down":
				neg = neg+1
		print (pos - neg)
		return (pos - neg)
	
	##########################################################
	#check if user up-voted or down-voted

	def is_up_voted(self, user):
		result = False
		vote = self.get_vote(user)
		if vote and vote.user == user and vote.vote == "up":
			result = True
		return result
		
	def is_down_voted(self, user):
		result = False
		vote = self.get_vote(user)
		if vote and vote.user == user and vote.vote == "down":
			result = True
		return result
		
	##########################################################
	#subposts
	
	def create_sub(self, user, text):
		sub = PostSub(parent=self.key)
		sub.user = user
		sub.text = text
		sub.time_created = int(time.time() * 1000)
		sub.profile_picture = generate_sub_number(self, user)
		sub.put()
		add_subpost_to_memcache(sub.key.urlsafe(), sub)
		add_subpost_to_post_memcache(sub, self.key.urlsafe())
		return sub

	def get_subs(self):
		subposts = memcache.get(self.key.urlsafe())
		if not subposts:
			subposts = list()
			q = PostSub.query(ancestor=self.key)
			q = q.order(PostSub.time_created)
			for sub in q.fetch():
				subposts.append(sub)
			memcache.set(self.key.urlsafe(), subposts)
		return subposts

# 	def count_subs(self):
# 		q = PostSub.query(ancestor=self.key)
# 		return q.count()
		
	##########################################################
	
	def delete_post(self):
		delete_post_from_memcache(self.key.urlsafe());
		self.key.delete()

class PostVote(ndb.Model):
	user = ndb.StringProperty()
	vote = ndb.StringProperty()

class PostSub(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.IntegerProperty()
	profile_picture = ndb.IntegerProperty()
	
	##########################################################
	#add / change votes
	def add_up_vote(self, user):	
		if self.is_up_voted(user):
			return
		if self.is_down_voted(user):
			self.change_vote(user, "up")
			return
		self.add_vote(user, "up")
		
	def add_down_vote(self, user):
		if self.is_down_voted(user):
			return
		if self.is_up_voted(user):
			self.change_vote(user, "down")
			return
		self.add_vote(user, "down")	
		
	def add_vote(self, user, type):
		id = str(self.key.urlsafe()) + str(user)
		vote = SubPostVote(id=id, parent=self.key)
		vote.user = user
		vote.vote = type
		vote.put()
		self.add_vote_to_memcache(user,vote)
	
	def change_vote(self, user, type):
		vote = self.get_vote(user)
		vote.vote = type
		vote.put()
		self.add_vote_to_memcache(user,vote)	
	
	##########################################################	
	#add/update the vote memcache
		
	def add_vote_to_memcache(self, user, vote):
		key = self.key.urlsafe() + "votes"
		votes = self.get_votes()
		print user
		if user in votes:
			del votes[user]
		votes[user] = vote
		memcache.set(key, votes)

	##########################################################
	#get a vote or get all votes

	def get_vote(self,user):
		id = str(self.key.urlsafe()) + str(user)
		result = None
		votes = self.get_votes()
		if votes and (user in votes):
			result = votes[user]
		else:
			result = SubPostVote.get_by_id(id, parent=self.key)
			self.add_vote_to_memcache(user, result)
		return result
			
	def get_votes(self):
		key = self.key.urlsafe() + "votes"
		votes = memcache.get(key)
		if not votes:
			votes = dict()
			vote_list = SubPostVote.query(ancestor=self.key)
			for vote in vote_list:
				votes[vote.user] = vote
			memcache.set(key, votes)
		return votes
		
	##########################################################
	#count votes

	def count_votes(self):
		pos = 0
		neg = 0
		votes = self.get_votes().values()
		for vote in votes:
			if vote and vote.vote == "up":
				pos = pos+1
			elif vote and vote.vote == "down":
				neg = neg+1
		return (pos - neg)
	
	##########################################################
	#check if user up-voted or down-voted

	def is_up_voted(self, user):
		result = False
		vote = self.get_vote(user)
		if vote and vote.user == user and vote.vote == "up":
			result = True
		return result
		
	def is_down_voted(self, user):
		result = False
		vote = self.get_vote(user)
		if vote and vote.user == user and vote.vote == "down":
			result = True
		return result
		
	##########################################################
	
	def delete_post(self):
		delete_subpost_from_post_memcache(self, self.key.parent().urlsafe());
		self.key.delete()
		
class SubPostVote(ndb.Model):
	user = ndb.StringProperty()
	vote = ndb.StringProperty()

def generate_sub_number(post, user):  ##make sure there is only one picture per user
	if user == post.user: ##check if user is OP
		return 0
	else:
		number = randint(1,100) ##generate a random number
		search = True
		while search:
			search = False
			sub_comments = post.get_subs()
			for sub in sub_comments:
				if user == sub.user:    ##return the number already assigned to the user if they have posted in the thread before
					return sub.profile_picture
				if sub.profile_picture == number:    ##else check if the number is already assigned to another user
					search = True
					number = randint(1,100)
					break
		return number

def clean(value):
	result = ''
	if value:
		counter = 0
		for i in range(0, len(value)):
			c = value[i]
			if c == "'":
				result += '&#39;'
			elif c == '<':
				result += '&lt;'
			elif c == '"':
				result += '&quot;'
			elif c == '\n':
				result += '<br>'
			elif c == '\\':
				result += '\\\\'
			else:
				result += c
			if c == ' ':
				counter = 0
			if counter > 30:
				result += ' '
				counter = 0
			counter += 1
	return result

def get_posts_as_json(email, location, user):
	posts = get_posts(email, location, user)
	for post in posts:
		post.vote_count = post.count_votes()
		post.sub_comments = post.get_subs()
		if email:
			post.up_voted = post.is_up_voted(email)
			post.down_voted = post.is_down_voted(email)
			post.mine = False
			if post.user == email:
				post.mine = True
		for sub in post.sub_comments:
			sub.vote_count = sub.count_votes()
			if email:
				sub.up_voted = sub.is_up_voted(email)
				sub.down_voted = sub.is_down_voted(email)
				sub.mine = False
				if sub.user == email:
					sub.mine = True
	return build_posts_json(posts)
		
def build_posts_json(posts):
	result = '['
	first = True
	for post in posts:
		if first:
			first = False
		else:
			result += ','
		result += '{"text":"' + clean(post.text) + '",'
		result += '"time":"' + str(post.time_created) + '",'
		result += '"sub_comments":' + build_sub_posts_json(post) + ','
		result += '"key":"' + post.key.urlsafe() + '",'
		result += '"mine":"' + str(post.mine) + '",'
		result += '"vote_count":"' + str(post.vote_count) + '",'
		result += '"up_voted":"' + str(post.up_voted) + '",'
		result += '"down_voted":"' + str(post.down_voted) + '",'
		result += '"latitude":"' + str(post.latitude) + '",'
		result += '"longitude":"' + str(post.longitude) + '",'
		result += '"image":"/pictures/icons/' + str(post.profile_picture) + '.png"}'
  	result += ']'
  	complete = '{"posts":' + result + '}'
	return complete
	
def build_sub_posts_json(post):
	result = '['
	first = True
	for sub in post.sub_comments:
		if first:
			first = False
		else:
			result += ','
		result += '{"text":"' + clean(sub.text) + '",'
		result += '"time":"' + str(sub.time_created) + '",'
		result += '"key":"' + sub.key.urlsafe() + '",'
		result += '"mine":"' + str(sub.mine) + '",'
		result += '"vote_count":"' + str(sub.vote_count) + '",'
		result += '"up_voted":"' + str(sub.up_voted) + '",'
		result += '"down_voted":"' + str(sub.down_voted) + '",'
		result += '"image":"/pictures/icons/' + str( sub.profile_picture ) + '.png"}'
  	result += ']'
  	return result;

def create_post(user,text,location,lat,lng):
	post = Post(parent=get_post_ancestor())
	post.user = user
	post.text = text
	post.location = location
	post.latitude = lat
	post.longitude = lng
	post.time_created = int(time.time() * 1000)
	post.profile_picture = 0;
	post.put()
	add_post_to_memcache(post.key.urlsafe(), post)

def clear_memcache():
	memcache.flush_all()
	
def delete_post_from_memcache(id):
	posts = memcache.get('posts')
	if posts:
		del posts[id]
		memcache.set('posts',posts)
		
def add_post_to_memcache(id, post):
	posts = memcache.get('posts')
	if not posts:
		posts = dict()
	posts[id] = post
	memcache.set('posts',posts)
		
def delete_subpost_from_memcache(id):
	subposts = memcache.get('subposts')
	if subposts:
		del subposts[id]
		memcache.set('subposts',subposts)
		
def delete_subpost_from_post_memcache(subpost, parent_id):
	subposts = memcache.get(parent_id)
	if subposts:
		del subposts[subposts.index(subpost)]
		memcache.set(parent_id,subposts)
		
def add_subpost_to_memcache(id, subpost):
	subposts = memcache.get('subposts')
	if not subposts:
		subposts = dict()
	subposts[id] = subpost
	memcache.set('subposts',subposts)

def add_subpost_to_post_memcache(subpost, parent_id):
	subs = memcache.get(parent_id)
	if not subs:
		subs = list()
	subs.append(subpost)
	memcache.set(parent_id,subs)

def delete_post(post):
	if(type(post) is Post):
		post.sub_comments = post.get_subs()
		if post.sub_comments:
			for sub in post.sub_comments:
				sub.delete_post()
	post.delete_post()

def get_post(post_id):
	result = None
	posts = memcache.get('posts')
	if posts and (post_id in posts):
		result = posts[post_id]
	else:
		result = ndb.Key(urlsafe=post_id).get()
		add_post_to_memcache(result.key.urlsafe(), result)
	return result
	
def get_subpost(subpost_id):
	result = None
	subposts = memcache.get('subposts')
	if subposts and (subpost_id in subposts):
		result = subposts[subpost_id]
	else:
		result = ndb.Key(urlsafe=subpost_id).get()
		add_subpost_to_memcache(result.key.urlsafe(), result)
	return result

def get_filtered_posts(posts, email, location, user):
	if(user):
		filtered = list()
		for post in posts:
			if post.user == email:
				filtered.append(post)
		return filtered
	elif(location != "GLOBAL"):
		filtered = list()
		for post in posts:
			if post.location == location:
				filtered.append(post)
		return filtered
	else:
		return posts
	
def get_posts(email, location, user):
	result = memcache.get('posts')
	if (not result):
		result = dict()
		subposts = dict()
		q = Post.query(ancestor=get_post_ancestor())
		q = q.order(-Post.time_created)
		for post in q.fetch(500):
			subs = list()
			for subpost in post.get_subs():
				subs.append(subpost)
				subposts[subpost.key.urlsafe()] = subpost
			memcache.set(post.key.urlsafe(), subs)
			result[post.key.urlsafe()] = post
		memcache.set('posts',result)
		memcache.set('subposts',subposts)
	return get_filtered_posts(result.values(), email, location, user)

def get_post_ancestor():
	return ndb.Key('Posts', 'Ancestor') 

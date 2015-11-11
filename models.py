import time
import logging
import datetime

from google.appengine.api import memcache
from google.appengine.ext import ndb

class Post(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.IntegerProperty()
	
	def add_up_vote(self, user):
		self.remove_down_vote(user)
		PostUpVote.get_or_insert(user, parent=self.key)
		
	def add_down_vote(self, user):
		self.remove_up_vote(user)
		PostDownVote.get_or_insert(user, parent=self.key)

	def remove_up_vote(self, user):
		post_vote = PostUpVote.get_by_id(user, parent=self.key)
		if post_vote:
			post_vote.key.delete()
			
	def remove_down_vote(self, user):
		post_vote = PostDownVote.get_by_id(user, parent=self.key)
		if post_vote:
			post_vote.key.delete()

	def count_votes(self):
		pos = PostUpVote.query(ancestor=self.key)
		neg = PostDownVote.query(ancestor=self.key)
		return (pos.count() - neg.count())

	def is_up_voted(self, user):
		result = False
		if PostUpVote.get_by_id(user, parent=self.key):
			result = True
		return result
		
	def is_down_voted(self, user):
		result = False
		if PostDownVote.get_by_id(user, parent=self.key):
			result = True
		return result

	def create_sub(self, user, text):
		sub = PostSub(parent=self.key)
		sub.user = user
		sub.text = text
		sub.time_created = int(time.time() * 1000)
		sub.put()
		return sub

	def get_subs(self):
		result = list()
		q = PostSub.query(ancestor=self.key)
		q = q.order(-PostSub.time_created)
		for sub in q.fetch():
			result.append(sub)
		return result

	def count_subs(self):
		q = PostSub.query(ancestor=self.key)
		return q.count()
	
	def delete_post(self):
		self.key.delete()
		memcache.delete('posts')

class PostUpVote(ndb.Model):
	pass
	
class PostDownVote(ndb.Model):
	pass

class PostSub(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.IntegerProperty()
	
	def add_up_vote(self, user):
		self.remove_down_vote(user)
		SubPostUpVote.get_or_insert(user, parent=self.key)
		
	def add_down_vote(self, user):
		self.remove_up_vote(user)
		SubPostDownVote.get_or_insert(user, parent=self.key)

	def remove_up_vote(self, user):
		post_vote = SubPostUpVote.get_by_id(user, parent=self.key)
		if post_vote:
			post_vote.key.delete()
			
	def remove_down_vote(self, user):
		post_vote = SubPostDownVote.get_by_id(user, parent=self.key)
		if post_vote:
			post_vote.key.delete()

	def count_votes(self):
		pos = SubPostUpVote.query(ancestor=self.key)
		neg = SubPostDownVote.query(ancestor=self.key)
		return (pos.count() - neg.count())

	def is_up_voted(self, user):
		result = False
		if SubPostUpVote.get_by_id(user, parent=self.key):
			result = True
		return result
		
	def is_down_voted(self, user):
		result = False
		if SubPostDownVote.get_by_id(user, parent=self.key):
			result = True
		return result
	
	def delete_post(self):
		self.key.delete()
		memcache.delete('posts')
		
class SubPostUpVote(ndb.Model):
	pass
	
class SubPostDownVote(ndb.Model):
	pass

def get_posts_as_json(email):
	posts = get_posts()
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
		result += '{"text":"' + post.text + '",'
		result += '"time":"' + str(post.time_created) + '",'
		result += '"sub_comments":' + build_sub_posts_json(post) + ','
		result += '"key":"' + post.key.urlsafe() + '",'
		result += '"mine":"' + str(post.mine) + '",'
		result += '"vote_count":"' + str(post.vote_count) + '",'
		result += '"up_voted":"' + str(post.up_voted) + '",'
		result += '"down_voted":"' + str(post.down_voted) + '"}'
  	result += ']'
	return '{"posts":' + result + '}'
	
def build_sub_posts_json(post):
	result = '['
	first = True
	for sub in post.sub_comments:
		if first:
			first = False
		else:
			result += ','
		result += '{"text":"' + sub.text + '",'
		result += '"time":"' + str(sub.time_created) + '",'
		result += '"key":"' + sub.key.urlsafe() + '",'
		result += '"mine":"' + str(sub.mine) + '",'
		result += '"vote_count":"' + str(sub.vote_count) + '",'
		result += '"up_voted":"' + str(sub.up_voted) + '",'
		result += '"down_voted":"' + str(sub.down_voted) + '"}'
  	result += ']'
  	return result;

def create_post(user,text):
	post = Post(parent=get_post_ancestor())
	post.user = user
	post.text = text
	post.time_created = int(time.time() * 1000)
	post.put()
	memcache.delete('posts')
	memcache.set(post.key.urlsafe(), post, namespace='post')
	
def delete_post(post):
	if(type(post) is Post):
		post.sub_comments = post.get_subs()
		if post.sub_comments:
			for sub in post.sub_comments:
				sub.delete_post()
	post.delete_post()

def get_post(post_id):
	result = memcache.get(post_id, namespace='post')
	if not result:
		result = ndb.Key(urlsafe=post_id).get()
		memcache.set(result.key.urlsafe(), result, namespace='post')
	return result
	
def get_posts():
	result = memcache.get('posts')
	if not result:
		result = list()
		q = Post.query(ancestor=get_post_ancestor())
		q = q.order(-Post.time_created)
		for post in q.fetch(500):
			result.append(post)
		memcache.set('posts',result)
	return result

def get_post_ancestor():
	return ndb.Key('Posts', 'Ancestor') 
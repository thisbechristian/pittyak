import time
import logging
import datetime



from google.appengine.api import memcache
from google.appengine.ext import ndb

class Post(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.DateTimeProperty(auto_now_add=True)
	
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
	time_created = ndb.DateTimeProperty(auto_now_add=True)
	
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
		
def create_post(user,text):
	post = Post(parent=get_post_ancestor())
	post.user = user
	post.text = text
	post.put()
	memcache.delete('posts')
	memcache.set(post.key.urlsafe(), post, namespace='post')
	

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
		for post in q.fetch(1000):
			result.append(post)
		memcache.set('posts',result)
	return result

def get_post_ancestor():
	return ndb.Key('Posts', 'Ancestor') 
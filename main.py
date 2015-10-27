import datetime
import logging
import os
import webapp2

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import images
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import mail


# We'll just use this convenience function to retrieve and render a template.
def render_template(handler, templatename, templatevalues={}):
	path = os.path.join(os.path.dirname(__file__), 'templates/' + templatename)
	html = template.render(path, templatevalues)
	handler.response.out.write(html)

# We'll use this convenience function to retrieve the current user's email.
def get_user_email():
	result = None
	user = users.get_current_user()
	if user:
		result = user.email()
	return result

class MainPageHandler(webapp2.RequestHandler):
	def get(self):
		email = get_user_email()
		posts = get_posts()
		if email:
			for post in posts:
				post.up_voted = post.is_up_voted(email)
				post.down_voted = post.is_down_voted(email)
		page_params = {
			'user_email': email,
			'login_url': users.create_login_url(),
			'logout_url': users.create_logout_url('/'),
			'posts': posts
		}
		render_template(self, 'index.html', page_params)

class ContactHandler(webapp2.RequestHandler):
	def post(self):
		name = "Name: " + self.request.get('name') + "\n"
		email = "Email: " + self.request.get('email') + "\n"
		comment = "Feedback: " + self.request.get('comment') + "\n"
		comment = name + email + comment
		admin_emails = ["boni1331@gmail.com", "JosephDMcclain@gmail.com", "matthewrlobrien@gmail.com", "thorff1@gmail.com"]
		if mail.is_email_valid(email):
			for admin in admin_emails:
				message = mail.EmailMessage(
					sender=admin,
					subject="Feedback",
					to=admin,
					body=comment)
				message.send()
		self.redirect('/')

class PostHandler(webapp2.RequestHandler):
	def post(self):
		email = get_user_email()
		if email: 
			post = Post(parent=get_post_ancestor())
			text = self.request.get('comment')
			post.user = email
			post.text = text
			post.put()
		self.redirect('/')

class MapHandler(webapp2.RequestHandler):
	def get(self):
		email = get_user_email()
		lat = self.request.get("lat")
		lng = self.request.get("lng")
		page_params = {
			'lat': lat,
			'lng': lng,
			'user_email': email,
			'login_url': users.create_login_url(),
			'logout_url': users.create_logout_url('/')
		}
		render_template(self, 'maps.html', page_params)

class VoteHandler(webapp2.RequestHandler):
	def get(self):
		email = get_user_email()
		if email:
			vote = self.request.get("vote")
			id = self.request.get("id")
			post = get_post(id)
			if(vote == 'up'):
				post.add_up_vote(email)
			elif(vote == 'down'):
				post.add_down_vote(email)
		self.redirect('/')
			
			
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
		for sub in q.fetch(1000):
			result.append(sub)
		return result

	def count_subs(self):
		q = PostSub.query(ancestor=self.key)
		return q.count()

class PostUpVote(ndb.Model):
	pass
	
class PostDownVote(ndb.Model):
	pass
	
class PostVote(ndb.Model):
	pass

class PostSub(ndb.Model):
	user = ndb.StringProperty()
	text = ndb.TextProperty()
	time_created = ndb.DateTimeProperty(auto_now_add=True)
	
	def add_vote(self, user):
		SubVote.get_or_insert(user, parent=self.key)
		
	def remove_vote(self, user):
		sub_vote = SubVote.get_by_id(user, parent=self.key)
		if sub_vote:
			sub_vote.key.delete()

	def count_votes(self):
		q = SubVote.query(ancestor=self.key)
		return q.count()

	def is_voted(self, user):
		result = False
		if SubVote.get_by_id(user, parent=self.key):
			result = True
		return result

def get_post(post_id):
	return ndb.Key(urlsafe=post_id).get()
    
def get_posts():
	result = list()
	q = Post.query(ancestor=get_post_ancestor())
	q = q.order(-Post.time_created)
	for post in q.fetch(100):
		result.append(post)
		post.vote_count = post.count_votes()
	return result

def get_post_ancestor():
	return ndb.Key('Posts', 'Ancestor') 

mappings = [
	('/', MainPageHandler),
	('/comment', PostHandler),
	('/contact', ContactHandler),
	('/vote', VoteHandler),
	('/maps',MapHandler)
]
app = webapp2.WSGIApplication(mappings, debug=True)

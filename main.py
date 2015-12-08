import datetime
import logging
import os
import webapp2
import models

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import images
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import mail


# function to retrieve and render a template
def render_template(handler, templatename, templatevalues={}):
	path = os.path.join(os.path.dirname(__file__), 'templates/' + templatename)
	html = template.render(path, templatevalues)
	handler.response.out.write(html)

# function to retrieve the current user's email
def get_user_email():
	result = None
	user = users.get_current_user()
	if user:
		result = user.email()
	return result

class MainPageHandler(webapp2.RequestHandler):
	def get(self):
		email = get_user_email()
		admin = "pittyak.mgmt@gmail.com"
		adminFlag = False
		if email == admin:
			adminFlag = True
		page_params = {
			'user_email': email,
			'login_url': users.create_login_url(),
			'logout_url': users.create_logout_url('/'),
			'adminFlag': adminFlag
		}
		render_template(self, 'index.html', page_params)
		
class GetPostHandler(webapp2.RequestHandler):
	def post(self):
		self.get()
	
	def get(self):
		email = get_user_email()
		if email:
			location = self.request.get('location')
			self.response.out.write(models.get_posts_as_json(email,location))

class LocationHandler(webapp2.RequestHandler):
	def post(self):
		self.get()
		
	def get(self):
		email = get_user_email()
		if email:
			models.clear_memcache()

class ContactHandler(webapp2.RequestHandler):
	def post(self):
		name = "Name: " + self.request.get('name') + "\n"
		email = "Email: " + self.request.get('email') + "\n"
		comment = "Feedback: " + self.request.get('comment') + "\n"
		comment = name + email + comment
		admin_emails = ["pittyak.mgmt@gmail.com"]
		if mail.is_email_valid(email):
			for admin in admin_emails:
				message = mail.EmailMessage(
					sender=admin,
					subject="Feedback",
					to=admin,
					body=comment)
				message.send()
		self.redirect('/')

class SubPostHandler(webapp2.RequestHandler):
	def post(self):
		email = get_user_email()
		if email:
			id = self.request.get('id')
			text = self.request.get('reply')
			post = models.get_post(id)
			post.create_sub( email, text )
		self.redirect('/')

class PostHandler(webapp2.RequestHandler):
	def post(self):
		email = get_user_email()
		if email:
			text = self.request.get('comment')
			location = self.request.get('location')
			models.create_post(email,text,location)
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
	def post(self):
		email = get_user_email()
		if email:
			vote = self.request.get("vote")
			id = self.request.get("id")
			post = models.get_post(id)
			if(vote == 'up'):
				post.add_up_vote(email)
			elif(vote == 'down'):
				post.add_down_vote(email)
		votes = post.count_votes()
		if votes <= -5:
			models.delete_post(post)
		self.response.out.write(votes)
	
class DeletePostHandler(webapp2.RequestHandler):
	def get(self):
		id = self.request.get("id")
		post = models.get_post(id)
		models.delete_post(post)
		self.redirect('/')

mappings = [
	('/', MainPageHandler),
	('/comments', GetPostHandler),
	('/reply', SubPostHandler),
	('/location', LocationHandler),
	('/comment', PostHandler),
	('/contact', ContactHandler),
	('/vote', VoteHandler),
	('/maps',MapHandler),
	('/delete', DeletePostHandler)
]
app = webapp2.WSGIApplication(mappings, debug=True)

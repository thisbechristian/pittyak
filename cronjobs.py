import time
import webapp2
import models

class RefreshHandler(webapp2.RequestHandler):
	def get(self):
		models.clear_memcache()

mappings = [
	('/cron/refresh',RefreshHandler),
]
app = webapp2.WSGIApplication(mappings, debug=True)
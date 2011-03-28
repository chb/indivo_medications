from django.conf.urls.defaults import *
from views import *
import settings # app local

urlpatterns = patterns('',
    (r'^start_auth', start_auth),
    (r'^after_auth', after_auth),
    (r'^meds/$', list_meds), # can't use "list" obviously
    # (r'^meds/new$', new_med),
    # (r'^meds/(?P<med_id>[^/]+)', one_med),
    (r'^jmvc/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.JMVC_HOME}),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.JS_HOME})
)



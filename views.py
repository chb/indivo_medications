"""
Views for the Indivo Medications app

Arjun Sanyal
arjun.sanyal@childrens.harvard.edu

"""

import urllib2
from utils import *
from django.utils import simplejson
from django.shortcuts import render_to_response
from xml.etree import ElementTree
import settings # app local

def start_auth(request):
    """
    begin the oAuth protocol with the server
    
    expects either a record_id or carenet_id parameter,
    now that we are carenet-aware
    """
    # create the client to Indivo
    client = get_indivo_client(request, with_session_token=False)
    
    # do we have a record_id?
    record_id = request.GET.get('record_id', None)
    carenet_id = request.GET.get('carenet_id', None)
    
    # prepare request token parameters
    params = {'oauth_callback':'oob'}
    if record_id:
        params['indivo_record_id'] = record_id
    if carenet_id:
        params['indivo_carenet_id'] = carenet_id

    # request a request token
    req_token = client.fetch_request_token(params)

    # store the request token in the session for when we return from auth
    request.session['request_token'] = req_token
    
    # redirect to the UI server
    return HttpResponseRedirect(client.auth_redirect_url)

def after_auth(request):
    """
    after Indivo authorization, exchange the request token for an access token and store it in the web session.
    """
    # get the token and verifier from the URL parameters
    oauth_token, oauth_verifier = request.GET['oauth_token'], request.GET['oauth_verifier']
    
    # retrieve request token stored in the session
    token_in_session = request.session['request_token']
    
    # is this the right token?
    if token_in_session['oauth_token'] != oauth_token:
        return HttpResponse("oh oh bad token")
    
    # get the indivo client and use the request token as the token for the exchange
    client = get_indivo_client(request, with_session_token=False)
    client.update_token(token_in_session)
    access_token = client.exchange_token(oauth_verifier)
    
    # store stuff in the session
    request.session['access_token'] = access_token
    
    if access_token.has_key('xoauth_indivo_record_id'):
        request.session['record_id'] = access_token['xoauth_indivo_record_id']
        if request.session.has_key('carenet_id'):
            del request.session['carenet_id']
    else:
        if request.session.has_key('record_id'):
            del request.session['record_id']
        request.session['carenet_id'] = access_token['xoauth_indivo_carenet_id']
    
    return index(request)

def index(request):
    """pass the record_id to JMVC and use the JSON/REST api from there"""
    return render_to_response(
        # note: this is slightly different than the labs app with "app/app.html" rather than the labs/labs.html
        # and we don't pass submodule name. fixme, by changing to new style with name = app_name
        settings.JS_HOME+'app.html',
        {'INDIVO_UI_APP_CSS': settings.INDIVO_UI_SERVER_BASE+'/jmvc/ui/resources/css/ui.css'}
    )

def list_meds(request):
    client = get_indivo_client(request)
    
    if request.session.has_key('record_id'):
        record_id = request.session['record_id']
        resp, content = client.record(record_id=record_id)
        if resp['status'] != '200':
            # TODO: handle errors
            raise Exception("Error reading Record info: %s"%content)
        record = parse_xml(content)

        resp, content = client.generic_list(record_id=record_id, data_model="Medication")
        if resp['status'] != '200':
            # TODO: handle errors
            raise Exception("Error reading medications: %s"%content)
        meds = simplejson.loads(content)
    else:
      print 'FIXME: no client support for meds via carenet. Exiting...'
      return
        
    return HttpResponse(simplejson.dumps(meds), mimetype='text/plain')

def new_med():
    """docstring for new_med"""
    # def new_problem(request):
    #     if request.method == "GET":
    #         return render_template('newproblem')
    #     else:
    #         # get the variables and create a problem XML
    #         params = {'code_abbrev':'', 'coding_system': 'umls-snomed', 'date_onset': request.POST['date_onset'], 'date_resolution': request.POST['date_resolution'], 'code_fullname': request.POST['code_fullname'], 'code': request.POST['code'], 'diagnosed_by' : request.POST['diagnosed_by'], 'comments' : request.POST['comments']}
    #         problem_xml = render_raw('problem', params, type='xml')
    #         
    #         # add the problem
    #         client = get_indivo_client(request)
    #         client.post_document(record_id = request.session['record_id'], data=problem_xml)
    #         
    #         # add a notification
    #         client.record_notify(record_id = request.session['record_id'], data={'content':'a new problem has been added to your problem list'})
    #         
    #         return HttpResponseRedirect(reverse(problem_list))
    pass

def one_med():
    """docstring for one_med"""
    # def one_problem(request, problem_id):
    #     client = get_indivo_client(request)
    #     
    #     record_id = request.session.get('record_id', None)
    #     
    #     if record_id:
    #         
    #         # get record information
    #         record = parse_xml(client.read_record(record_id = record_id).response['response_data'])
    #         
    #         doc_xml = client.read_document(record_id= record_id, document_id = problem_id).response['response_data']
    #         doc_meta_xml = client.read_document_meta(record_id=record_id, document_id= problem_id).response['response_data']
    #     else:
    #         carenet_id = request.session['carenet_id']
    #         
    #         record = parse_xml(client.get_carenet_record(carenet_id = carenet_id).response['response_data'])
    #         
    #         doc_xml = client.get_carenet_document(carenet_id= carenet_id, document_id = problem_id).response['response_data']
    #         #doc_meta_xml = client.get_carenet_document_meta(carenet_id=carenet_id, document_id= problem_id).response['response_data']
    #         doc_meta_xml = None
    #     
    #     doc = parse_xml(doc_xml)
    #     
    #     problem = parse_problem(doc)
    #     
    #     if doc_meta_xml:
    #         doc_meta = parse_xml(doc_meta_xml)
    #         meta = parse_meta(doc_meta)
    #     else:
    #         meta = None
    #     
    #     record_label = record.attrib['label']
    #     
    #     surl_credentials = client.get_surl_credentials()
    #     
    #     return render_template('one', {'problem':problem, 'record_label': record_label, 'meta': meta, 'record_id': record_id, 'problem_id': problem_id, 'surl_credentials': surl_credentials})
    pass

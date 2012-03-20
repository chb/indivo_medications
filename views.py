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
    
    params['offline'] = 1
    
    # request a request token
    request_token = parse_token_from_response(client.post_request_token(data=params))
    
    # store the request token in the session for when we return from auth
    request.session['request_token'] = request_token
    
    # redirect to the UI server
    return HttpResponseRedirect(settings.INDIVO_UI_SERVER_BASE + '/oauth/authorize?oauth_token=%s' % request_token['oauth_token'])

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
    
    # create the client
    params = {'oauth_verifier' : oauth_verifier}
    access_token = parse_token_from_response(client.post_access_token(data=params))
    
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
    
    # now get the long-lived token using this access token
    client= get_indivo_client(request)
    try:
        long_lived_token = parse_token_from_response(client.get_long_lived_token())
        
        request.session['long_lived_token'] = long_lived_token
    except:
        pass
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
      record = parse_xml(client.read_record(record_id = record_id).response['response_data'])
      meds_xml = client.read_medications(record_id = record_id).response['response_data']
    else:
      print 'FIXME: no client support for meds via carenet. Exiting...'
      return
        
    # print meds_xml
    meds = []
    et = parse_xml(meds_xml)
    reports = et.findall('Report')
    
    for report in reports:
      item = report[1]
      m = item[0]
      NS = '{http://indivo.org/vocab/xml/documents#}'
      
      # brand_name = m.find(NS+'brandName').attrib['value']
      # try:
      #     rxnorm_id_xml = parse_xml(urllib2.urlopen('http://rxnav.nlm.nih.gov/REST/rxcui?name='+brand_name).read())
      #     rxnorm_id = rxnorm_id_xml.findtext('idGroup/rxnormId')
      #     if rxnorm_id:
      #         all_related_text = urllib2.urlopen('http://rxnav.nlm.nih.gov/REST/rxcui/'+rxnorm_id+'/allrelated').read()
      #         all_related_xml = parse_xml(all_related_text)
      #         cg_list =  all_related_xml.findall('allRelatedGroup/conceptGroup')
      #         ingredient = None
      #         precise_ingredient = None
      #     
      #         # get IN and / or PIN if avalible
      #         for e in cg_list:
      #             tty_text = e.find('tty').text
      #             if tty_text == 'IN':
      #                 ingredient = e.findtext('conceptProperties/name')
      #             elif tty_text == 'PIN':
      #                 precise_ingredient = e.findtext('conceptProperties/name')
      #             else:
      #                 continue
      # except urllib2.HTTPError, e:
      #     print "HTTP error: %d" % e.code
      # except urllib2.URLError, e:
      #     print "Network error: %s" % e.reason.args[1]
      
      # name, dose, and frequency and required, all others optional
      meds.append({
        'name'                  : m.findtext(NS+'name'),
        'dose'                  : m.find(NS+'dose').findtext(NS+'textValue'),
        'frequency'             : m.findtext(NS+'frequency'),
        'date_started'          : m.findtext(NS+'dateStarted'),
        'date_stopped'          : m.findtext(NS+'dateStopped'),
        'reason_stopped'        : m.findtext(NS+'reasonStopped'),
        # need if clause in case route is missing.
        'route'                 : m.find(NS+'route').attrib['abbrev'] if m.find(NS+'route') != None else '',
        'brand_name'            : m.findtext(NS+'brandName')
        # 'strength'
        # 'prescription'
        # 'details'
        # 'ingredient'            : ingredient
        # 'precise_ingredient'    : precise_ingredient
      })
    
    # print simplejson.dumps(meds)
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

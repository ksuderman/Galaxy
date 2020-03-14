"""
SAML 2 Authentication Controller.
"""

from __future__ import absolute_import

import random
import string

import logging

from galaxy import web
from galaxy.webapps.base.controller import JSAppLauncher

from galaxy.web import url_for, expose_api_anonymous

log = logging.getLogger(__name__)

from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.utils import OneLogin_Saml2_Utils

class SAML(JSAppLauncher):

    def prepare_request(self, request):
        return {
            'https': 'on' if request.scheme == 'https' else 'off',
            'http_host': request.host,
            'server_port': request.server_port,
            'script_name': request.script_name,
            'get_data': request.urlargs,
            'post_data': request.POST
        }

    def init_saml_auth(self, trans):
        req = self.prepare_request(trans.request)
        return req, OneLogin_Saml2_Auth(req, custom_base_path=trans.app.config.saml_config_dir)

    @web.json
    @web.expose
    def login(self, trans, provider):
        log.debug("Handling SAML authentication")
        if not trans.app.config.enable_saml:
            msg = "Login to Galaxy using SAML identities is not enabled on this Galaxy instance."
            log.debug(msg)
            return trans.show_error_message(msg)
        log.debug("Loading config from " + trans.app.config.saml_config_dir)
        req, auth = self.init_saml_auth(trans)
        log.debug("Create auth object")
        return_to = trans.request.host_url
        redirect = auth.login(return_to)
        log.debug("return_to: " + return_to)
        log.debug("redirect to: " + redirect)
        # return trans.response.send_redirect(redirect)
        return {"redirect_uri": redirect}

    def get_or_create_user(self, trans, remote_user_email):
        """
        Create a remote user with the email remote_user_email and return it.

        This code was snipped from get_or_create_remote_user in the GalaxyWebTransaction class.
        """
        log.debug("Getting user.")
        user = trans.sa_session.query(trans.app.model.User).filter(trans.app.model.User.table.c.email == remote_user_email).first()
        if user:
            log.debug("Existing user found.")
            # GVK: June 29, 2009 - This is to correct the behavior of a previous bug where a private
            # role and default user / history permissions were not set for remote users.  When a
            # remote user authenticates, we'll look for this information, and if missing, create it.
            if not trans.app.security_agent.get_private_user_role(user):
                trans.app.security_agent.create_private_user_role(user)
            if 'webapp' not in trans.environ or trans.environ['webapp'] != 'tool_shed':
                if not user.default_permissions:
                    trans.app.security_agent.user_set_default_permissions(user)
                    trans.app.security_agent.user_set_default_permissions(user, history=True, dataset=True)
        elif user is None:
            log.debug("Creating new user " + remote_user_email)
            username = remote_user_email.split('@', 1)[0].lower()
            random.seed()
            # Replace invalid characters in the username
            for char in [x for x in username if x not in string.ascii_lowercase + string.digits + '-' + '.']:
                username = username.replace(char, '-')
            # Find a unique username - user can change it later
            if trans.sa_session.query(trans.app.model.User).filter_by(username=username).first():
                i = 1
                while trans.sa_session.query(trans.app.model.User).filter_by(username=(username + '-' + str(i))).first():
                    i += 1
                username += '-' + str(i)
            user = trans.app.user_manager.create(email=remote_user_email, username=username)
            # If the user can authenticate with a SAML IdP then they can change their password
            # later if they want.
            user.set_random_password()
        return user


    @web.expose
    def assertion_consumer_service(self, trans, *args, **kwargs):
        req, auth = self.init_saml_auth(trans)

        session = kwargs #trans.galaxy_session
        request_id = None
        if 'AuthNRequestID' in session:
            request_id = session['AuthNRequestID']

        auth.process_response(request_id=request_id)
        errors = auth.get_errors()
        # not_auth_warn = not auth.is_authenticated()
        if auth.is_authenticated():
            log.debug("User is authenticated")
        else:
            log.debug("User is NOT authenticated")
            return trans.show_error_message("Authentication failed.")

        if len(errors) == 0:
            user = self.get_or_create_user(trans, auth.get_nameid())
            # trans.app.user_manager.create(email=auth.get_nameid(), username=)
            log.debug("handling user login")
            trans.handle_user_login(user)
            self_url = OneLogin_Saml2_Utils.get_self_url(req)
            form = trans.request.POST
            if 'RelayState' in form and self_url != form['RelayState']:
                redirect_to = auth.redirect_to(form['RelayState'])
                log.debug("RelayState set. Redirecting to " + redirect_to)
                return trans.response.send_redirect(redirect_to)
        elif auth.get_settings().is_debug_active():
            error_reason = auth.get_last_error_reason()
            log.error(error_reason)
            return trans.show_error_message(error_reason)
        log.debug("There were errors during authentication.")
        return trans.response.send_redirect(url_for("/"))


    @web.expose
    def logout(self, trans, *args, **kwargs):
        log.debug("Logout called")
        return { 'redirect_uri': url_for('/')}

    @web.expose
    def metadata(self, trans, *args, **kwargs):
        log.debug("Getting metadata")
        req, auth = self.init_saml_auth(trans)
        settings = auth.get_settings()
        metadata = settings.get_sp_metadata()
        errors = settings.validate_metadata(metadata)
        if len(errors) == 0:
            trans.response.set_content_type('text/xml')
            return metadata

        return trans.show_error_message(', '.join(errors))

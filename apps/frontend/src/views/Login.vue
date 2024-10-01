<template>
  <v-app id="inspire">
    <v-snackbar
      v-model="logoffSnackbar"
      :color="logoffFailure ? 'red' : 'success'"
    >
      {{ logoffMessage }}</v-snackbar
    >
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12 rounded-b-0">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title id="login_form_title">
                  Login to Heimdall Server
                </v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-tabs
                active
                :value="activeTab"
                background-color="primary darken-1"
                color="primary-visible"
                show-arrows
              >
                <v-tab
                  v-if="anyAuthProvidersAvailable"
                  id="select-tab-standard-login"
                  href="#login-standard"
                >
                  Heimdall Login (Local Authentication)
                </v-tab>
                <v-tab
                  v-if="ldapenabled"
                  id="select-tab-ldap-login"
                  href="#login-ldap"
                >
                  Organization Login (LDAP Authentication)
                </v-tab>

                <v-tab-item value="login-standard">
                  <LocalLogin />
                </v-tab-item>
                <v-tab-item value="login-ldap">
                  <LDAPLogin />
                </v-tab-item>
              </v-tabs>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<script lang="ts">
import LDAPLogin from '@/components/global/login/LDAPLogin.vue';
import LocalLogin from '@/components/global/login/LocalLogin.vue';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {LocalStorageVal} from '@/utilities/helper_util';
import Vue from 'vue';
import Component from 'vue-class-component';

const lastLoginTab = new LocalStorageVal<string>('login_curr_tab');

@Component({
  components: {
    LocalLogin,
    LDAPLogin
  }
})
export default class Login extends Vue {
  activeTab: string = lastLoginTab.getDefault(
    this.anyAuthProvidersAvailable ? 'logintab-standard' : 'login-ldap'
  );

  logoffMessage = 'You have successfully logged off';

  mounted() {
    this.checkLoggedIn();
    this.checkForAuthenticationError();
  }

  checkLoggedIn() {
    if (ServerModule.token) {
      this.$router.push('/');
    }
  }

  checkForAuthenticationError() {
    if (this.$cookies.get('authenticationError')) {
      SnackbarModule.failure(
        `Sorry, a problem occurred while signing you in. The reason given was: ${this.$cookies.get(
          'authenticationError'
        )}`
      );
      this.$cookies.remove('authenticationError');
    }
  }

  signup() {
    this.$router.push('/signup');
  }

  get anyAuthProvidersAvailable() {
    return (
      ServerModule.localLoginEnabled || ServerModule.enabledOAuth.length !== 0
    );
  }

  get ldapenabled() {
    return ServerModule.ldap;
  }

  get localLoginEnabled() {
    return ServerModule.localLoginEnabled;
  }

  get logoffFailure() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return (
      urlParams.get('logoff')?.toLowerCase() === 'true' &&
      (ServerModule.token !== '' || urlParams.get('error'))
    );
  }

  get logoffSnackbar() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (
      !this.logoffFailure &&
      urlParams.get('logoff')?.toLowerCase() === 'true'
    ) {
      return true;
    } else {
      if (urlParams.get('error')) {
        // If the token has expired or the user has changed their JWT secret
        if (urlParams.get('error') === 'Unauthorized') {
          this.logoffMessage = `Your session was invalid, please sign in again.`;
        } else {
          this.logoffMessage = `An error occurred while signing you out: ${urlParams.get(
            'error'
          )}`;
        }
        return true;
      } else if (
        urlParams.get('logoff')?.toLowerCase() === 'true' &&
        ServerModule.token !== ''
      ) {
        this.logoffMessage =
          'An error occurred during the logout process, your token has not been discarded. Please clear your browser data.';
        return false;
      } else {
        return false;
      }
    }
  }
}
</script>

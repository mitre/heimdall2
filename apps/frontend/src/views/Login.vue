<template>
  <v-app id="inspire">
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
              <v-card-text>
                <v-form id="login_form" ref="form" name="login_form">
                  <v-text-field
                    id="email_field"
                    v-model="email"
                    :error-messages="emailErrors($v.email)"
                    name="email"
                    label="Email"
                    prepend-icon="mdi-account"
                    type="text"
                    required
                    @keyup.enter="$refs.password.focus"
                    @blur="$v.email.$touch()"
                  />
                  <v-text-field
                    id="password_field"
                    ref="password"
                    v-model="password"
                    :error-messages="
                      requiredFieldError($v.password, 'Password')
                    "
                    type="password"
                    name="password"
                    label="Password"
                    prepend-icon="mdi-lock"
                    @keyup.enter="login"
                    @blur="$v.password.$touch()"
                  />
                  <v-row>
                    <v-col class="pl-10">
                      <v-btn
                        id="login_button"
                        depressed
                        large
                        color="primary"
                        :disabled="$v.$invalid"
                        @click="login"
                      >
                        Login
                      </v-btn>
                    </v-col>
                    <v-col cols="auto">
                      <v-btn
                        id="sign_up_button"
                        depressed
                        large
                        @click="signup"
                      >
                        Sign Up
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />

                <v-container fluid>
                  <v-row align="center"> <v-divider />OR<v-divider /> </v-row>
                  <div class="container d-flex flex-column">
                    <v-row justify="space-between">
                      <v-col cols="auto">
                        <v-btn
                          v-show="authStrategySupported('google')"
                          id="oauth-google"
                          plain
                          @click="oauthLogin('google')"
                        >
                          <v-img :src="require('@/assets/google_mark.png')" />
                          <div class="pl-2">Login with Google</div>
                        </v-btn></v-col
                      >
                      <v-col cols="auto">
                        <v-btn
                          v-show="authStrategySupported('github')"
                          id="oauth-github"
                          plain
                          @click="oauthLogin('github')"
                        >
                          <v-img :src="require('@/assets/github_mark.png')" />
                          <div class="pl-2">Login with GitHub</div>
                        </v-btn></v-col
                      >
                      <v-col cols="auto"
                        ><v-btn
                          v-show="authStrategySupported('gitlab')"
                          id="oauth-gitlab"
                          plain
                          @click="oauthLogin('gitlab')"
                        >
                          <v-img
                            height="42"
                            :src="require('@/assets/gitlab_mark.png')"
                          />
                          <div class="pl-2">Login with GitLab</div>
                        </v-btn></v-col
                      >
                      <v-col cols="auto"
                        ><v-btn
                          v-show="authStrategySupported('okta')"
                          id="oauth-okta"
                          plain
                          @click="oauthLogin('okta')"
                        >
                          <v-img
                            height="32"
                            :src="require('@/assets/okta_mark.png')"
                          />
                          <div class="pl-2">Login with Okta</div>
                        </v-btn></v-col
                      >
                    </v-row>
                  </div>
                </v-container>
              </v-card-actions>
              <v-tabs
                active
                :value="activeTab"
                background-color="primary darken-1"
                color="primary-visible"
                show-arrows
              >
                <v-tab id="select-tab-standard-login" href="#login-standard"
                  >Heimdall Login</v-tab
                >
                <v-tab
                  v-if="ldapenabled"
                  id="select-tab-ldap-login"
                  href="#login-ldap"
                  >Organization Login</v-tab
                >

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
import Vue from 'vue';
import Component from 'vue-class-component';
import {LocalStorageVal} from '@/utilities/helper_util';
import {ServerModule} from '@/store/server';
import LocalLogin from '@/components/global/login/LocalLogin.vue'
import LDAPLogin from '@/components/global/login/LDAPLogin.vue'

const lastLoginTab = new LocalStorageVal<string>('login_curr_tab');

@Component({
  components: {
    LocalLogin,
    LDAPLogin
  }
})
export default class Login extends Vue {
  activeTab: string = lastLoginTab.get_default('logintab-standard')

  mounted() {
    this.checkLoggedIn();
  }

  checkLoggedIn() {
    if (ServerModule.token) {
      this.$router.push('/');
    }
  }

  signup() {
    this.$router.push('/signup');
  }

  authStrategySupported(strategy: string) {
    return ServerModule.enabledOAuth.includes(strategy)
  }

  login() {
    let creds: LoginHash = {
      email: this.email,
      password: this.password
    };
    ServerModule.Login(creds)
      .then(() => {
        this.$router.push('/');
        SnackbarModule.notify('You have successfully signed in.');
      })
      .catch((error) => {
        SnackbarModule.notify(error.response.data.message);
      });
      
  get ldapenabled() {
    return ServerModule.ldap
  }

  oauthLogin(site: string){
    window.location.href = `/authn/${site}`;
  }
}
</script>

<template>
  <v-app id="inspire">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
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
                          v-if="authStrategySupported('google')"
                          plain
                          @click="oauthLogin('google')"
                        >
                          <v-img :src="require('@/assets/google_mark.png')" />
                          <div class="pl-2">Login with Google</div>
                        </v-btn></v-col
                      >
                      <v-col cols="auto">
                        <v-btn
                          v-if="authStrategySupported('github')"
                          plain
                          @click="oauthLogin('github')"
                        >
                          <v-img :src="require('@/assets/github_mark.png')" />
                          <div class="pl-2">Login with GitHub</div>
                        </v-btn></v-col
                      >
                      <v-col cols="auto"
                        ><v-btn
                          v-if="authStrategySupported('gitlab')"
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
                          v-if="authStrategySupported('okta')"
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
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {required, email} from 'vuelidate/lib/validators';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';

export interface LoginHash {
  email: string;
  password: string;
}

@Component({
  mixins: [UserValidatorMixin],
  validations: {
    email: {
      required,
      email
    },
    password: {
      required
    }
  }
})
export default class Login extends Vue {
  email: string = '';
  password: string = '';

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
  }

  oauthLogin(site: string){
    window.location.href = `/authn/${site}`;
  }
}
</script>

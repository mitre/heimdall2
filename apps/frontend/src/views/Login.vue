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
                    <v-col>
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
                    <v-btn
                      v-if="authStrategySupported('github')"
                      class="mr-3"
                      large
                      @click="loginGithub"
                    >
                      <v-img :src="require('@/assets/github_mark.png')" />
                      <div class="pl-2">Login with GitHub</div>
                    </v-btn>
                  </v-row>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <div class="my-2">
                  <v-btn id="sign_up_button" depressed small @click="signup">
                    Sign Up
                  </v-btn>
                </div>
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

  getCookie(name: string) {
    function escapeName(s: string) {
      return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1');
    }
    const match = document.cookie.match(
      RegExp(`(?:^|;\\s*)${escapeName(name)}=([^;]*)`)
    );
    return match ? match[1] : null;
  }

  delete_cookies(names: string[]) {
    names.forEach((name) => {
      document.cookie =
        name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    });
  }

  checkLoggedIn() {
    const userID: string | null = this.getCookie('userID');
    const accessToken: string | null = this.getCookie('accessToken');
    if (userID && accessToken) {
      ServerModule.handleLogin({userID: userID, accessToken: accessToken});
      this.delete_cookies(['userID', 'accessToken']);
    }
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

  loginGithub() {
    window.location.href = '/authn/github';
  }
}
</script>

<template>
  <v-app id="inspire">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title id="login_form_title">
                  Login form
                </v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-card-text>
                <v-form id="login_form" ref="form" name="login_form">
                  <v-text-field
                    id="login_field"
                    v-model="email"
                    label="Login"
                    name="login"
                    prepend-icon="person"
                    type="text"
                    required
                  />
                  <v-text-field
                    id="password_field"
                    v-model="password"
                    label="Password"
                    name="password"
                    prepend-icon="lock"
                    type="password"
                  />
                  <v-btn
                    id="login_button"
                    depressed
                    large
                    color="primary"
                    @click="login"
                  >
                    Login
                  </v-btn>
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

import VeeValidate from 'vee-validate';
import VuePassword from 'vue-password';
import {BackendModule} from '@/store/backend';

Vue.use(VeeValidate);

export interface LoginHash {
  email: string;
  password: string;
}

// We declare the props separately
// to make props types inferrable.
const LoginProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    VuePassword
  }
})
export default class Login extends LoginProps {
  email: string = '';
  password: string = '';
  error: string = '';

  mounted() {
    this.checkLoggedIn();
  }

  checkLoggedIn() {
    if (BackendModule.token) {
      this.$router.push('/');
    }
  }

  signup() {
    this.$router.push('/signup');
  }

  login() {
    if ((this.$refs.form as any).validate()) {
      let creds: LoginHash = {
        email: this.email,
        password: this.password
      };
      BackendModule.Login(creds)
        .then(() => {
          this.$router.push('/');
        })
        .catch(error => {
          this.error = error.response.data.message;
          this.$toasted.global.error({
            message: this.error
          });
        });
    }
  }
}
</script>

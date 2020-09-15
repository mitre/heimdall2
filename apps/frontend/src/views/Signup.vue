<template>
  <v-app id="inspire">
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title id="registration_form_title">
                  Registration form
                </v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-card-text>
                <v-form ref="form" name="signup_form">
                  <v-text-field
                    id="email_field"
                    v-model="email"
                    label="Email"
                    name="email"
                    prepend-icon="person"
                    type="text"
                    required
                  />
                  <br />
                  <div>
                    <label
                      for="password"
                      class="v-label theme--dark"
                      style="padding: 35px;"
                    >
                      Password
                    </label>
                  </div>
                  <div
                    style="float: left; height: 40px"
                    class="v-input__icon v-input__icon--prepend"
                  >
                    <i
                      aria-hidden="true"
                      class="v-icon notranslate material-icons theme--dark"
                    >
                      lock
                    </i>
                  </div>
                  <div class="v-text-field__slot">
                    <VuePassword
                      id="password"
                      ref="password"
                      v-model="password"
                      v-validate="'required'"
                      style="padding-left: 35px;"
                      type="password"
                      label="password"
                      name="password"
                      :strength-meter-only="true"
                      :strength="strength"
                      data-vv-name="password"
                      required
                      :disable-toggle="true"
                      @input="updateStrength"
                    />
                  </div>
                  <br />
                  <v-text-field
                    id="passwordConfirmation"
                    v-model="passwordConfirmation"
                    v-validate="'required|confirmed:password'"
                    label="Confirm Password"
                    name="passwordConfirmation"
                    prepend-icon="lock"
                    type="password"
                    data-vv-name="password confirmation"
                    required
                  />
                  <br />
                  <v-text-field
                    id="role"
                    v-model="role"
                    label="Role"
                    name="role"
                    prepend-icon="assignment_ind"
                    type="text"
                    required
                  />
                  <v-btn
                    id="register"
                    depressed
                    large
                    color="primary"
                    @click="register"
                  >
                    Register
                  </v-btn>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />

                <div class="my-2">
                  <router-link to="/login">
                    <v-btn id="login_button" depressed small>Login</v-btn>
                  </router-link>
                </div>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import VeeValidate from 'vee-validate';
import VuePassword from 'vue-password';
import zxcvbn from 'zxcvbn';
import {BackendModule} from '../store/backend';

Vue.use(VeeValidate);

export interface SignupHash {
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
}

// We declare the props separately
// to make props types inferrable.
const SignupProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    VuePassword
  }
})
export default class Signup extends SignupProps {
  email: string = '';
  password: string = '';
  passwordConfirmation: string = '';
  role: string = '';
  active_tab: string = '';
  strength: number = 0;
  // Set in mounted

  // Whether fields are valid
  valid = true;

  // Whether we're currently loading
  //loading = false;

  // Loads the last open tab
  mounted() {
    this.active_tab = 'login-tab';
  }

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
  }

  login() {
    this.$router.push('/login');
  }
  updateStrength() {
    const value = zxcvbn(this.password);
    this.strength = value.score;
  }

  async register(): Promise<void> {
    // checking if the input is valid
    if ((this.$refs.form as any).validate()) {
      let creds: SignupHash = {
        email: this.email,
        password: this.password,
        passwordConfirmation: this.passwordConfirmation,
        role: this.role
      };

      BackendModule.Register(creds)
        .then(() => {
          this.$router.push('/login');
          this.$toasted.global.success({
            message: 'You have successfully registered, please sign in'
          });
        })
        .catch(error => {
          this.$toasted.global.error({
            message: error.response.data.message
          });
        });
    }
  }
}
</script>

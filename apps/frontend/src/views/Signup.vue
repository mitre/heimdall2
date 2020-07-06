<template>
  <v-app id="inspire">
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title>Registration form</v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-card-text>
                <v-form ref="form">
                  <v-text-field
                    label="Username"
                    name="username"
                    prepend-icon="person"
                    type="text"
                    v-model="username"
                  />
                  <br />
                  <div>
                    <label
                      for="input-140"
                      class="v-label theme--dark"
                      style="padding: 35px;"
                      >Password</label
                    >
                  </div>
                  <div
                    style="float: left; height: 40px"
                    class="v-input__icon v-input__icon--prepend"
                  >
                    <i
                      aria-hidden="true"
                      class="v-icon notranslate material-icons theme--dark"
                      >lock</i
                    >
                  </div>
                  <div class="v-text-field__slot">
                    <VuePassword
                      style="padding-left: 35px;"
                      ref="password"
                      type="password"
                      v-model="password"
                      label="password"
                      v-validate="'required'"
                      id="password"
                      :error-messages="errors.collect('password')"
                      :strength-meter-only="true"
                      :strength="strength"
                      maxlength="70"
                      data-vv-name="password"
                      required
                      :disableToggle="true"
                      @input="updateStrength"
                    />
                  </div>
                  <br />
                  <v-text-field
                    id="confirm_password"
                    label="Confirm Password"
                    name="confirm_password"
                    prepend-icon="lock"
                    type="password"
                    v-model="confirm_password"
                    v-validate="'required|confirmed:password'"
                    :error-messages="errors.collect('confirm_password')"
                    maxlength="70"
                    data-vv-name="confirm_password"
                    required
                  />
                  <v-btn @click="register" depressed large color="primary"
                    >Register</v-btn
                  >
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />

                <div class="my-2">
                  <v-btn @click="login" depressed small>Login</v-btn>
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
import {Filter} from '@/store/data_filters';
import {FileID} from '@/store/report_intake';
import {LocalStorageVal} from '@/utilities/helper_util';
import {getModule} from 'vuex-module-decorators';
import ServerModule from '@/store/server';
import VeeValidate from 'vee-validate';
import VuePassword from 'vue-password';
import zxcvbn from 'zxcvbn';

Vue.use(VeeValidate);

export interface LoginHash {
  username: string;
  password: string;
  confirm_password: string;
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
  username: string = '';
  password: string = '';
  confirm_password: string = '';
  host: string = '';
  active_tab: string = '';
  strength: number = 0;
  // Set in mounted

  // Whether fields are valid
  valid = true;

  // Whether we're currently loading
  //loading = false;

  username_rules = [
    (v: string) => !!v || 'Username is required'
    // (v: string) => (v && v.length > 3) || "A username must be more than 3 characters long",
    // (v: string) => /^[a-z0-9_]+$/.test(v) || "A username can only contain letters and digits"
  ];
  password_rules = [
    (v: string) => !!v || 'Password is required'
    // (v: string) => (v && v.length > 7) || "The password must be longer than 7 characters"
  ];

  // Loads the last open tab
  mounted() {
    console.log('mount UploadNexus');
    this.active_tab = 'login-tab';
  }

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
  }

  get watches(): string {
    let server = getModule(ServerModule, this.$store);
    if (server.profile) {
      console.log('server profile: ' + server.profile);
      this.$router.push('/home');
      return 'a';
    } else {
      return 'b';
    }
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

    const host = process.env.VUE_APP_API_URL!;
    if ((this.$refs.form as any).validate()) {
      console.log('Login to ' + host);
      console.log(this.confirm_password);
      console.log(this.password);
      let creds: LoginHash = {
        username: this.username,
        password: this.password,
        confirm_password: this.confirm_password
      };
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
          this.$router.go(0);
        })
        .then(() => {
          return mod.register(creds);
        })
        .catch(bad => {
          console.error(`bad register ${bad}`);
          this.$toasted.global.error({
            message: String(bad),
            isDark: this.$vuetify.theme.dark
          });
          this.$router.push('/login');
        })
        .then(() => {
          console.log('Registered!');
          this.$router.push('/login');
        });
    }
  }
}
</script>

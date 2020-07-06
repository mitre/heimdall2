<template>
  <v-app id="inspire">
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title>Login form</v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-card-text>
                <v-form ref="form">
                  <v-text-field
                    label="Login"
                    name="login"
                    prepend-icon="person"
                    type="text"
                    v-model="username"
                    required
                  />

                  <v-text-field
                    id="password"
                    label="Password"
                    name="password"
                    prepend-icon="lock"
                    type="password"
                    v-model="password"
                  />
                  <v-btn @click="login" depressed large color="primary"
                    >Login</v-btn
                  >
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />

                <div class="my-2">
                  <v-btn @click="signup" depressed small>Sign Up</v-btn>
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

Vue.use(VeeValidate);

export interface LoginHash {
  username: string;
  password: string;
  confirm_password: string;
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
  username: string = '';
  password: string = '';
  confirm_password: string = '';
  host: string = '';
  active_tab: string = ''; // Set in mounted

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
    this.checkLoggedIn();
    let mod = getModule(ServerModule, this.$store);
    if (mod.serverMode == undefined) {
      mod.server_mode();
    }
    // this.$router.push("/home");
  }

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
  }

  get is_logged_in(): boolean {
    if (this.token) {
      return true;
    } else {
      return false;
    }
  }
  checkLoggedIn() {
    console.log('token: ' + this.token + 'end token');
    if (this.token) {
      this.$router.push('/profile');
    }
  }
  get token(): string {
    let mod = getModule(ServerModule, this.$store);
    return mod.token || '';
  }

  get watches(): string {
    let server = getModule(ServerModule, this.$store);
    if (server.profile) {
      console.log('server profile: ' + server.profile);
      this.$router.push('/profile');
      return 'a';
    } else {
      return 'b';
    }
  }

  signup() {
    this.$router.push('/signup');
  }

  async login(): Promise<void> {
    // checking if the input is valid
    let mod = getModule(ServerModule, this.$store);

    const host = mod.serverUrl;

    console.log(host);
    if ((this.$refs.form as any).validate()) {
      console.log('Login to Backend test');
      let creds: LoginHash = {
        username: this.username,
        password: this.password,
        confirm_password: this.confirm_password
      };
      //this.loading = true;
      await mod
        .connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
          this.$router.go(0);
        })
        .then(() => {
          return mod.login(creds);
        })
        .catch(bad => {
          console.error(`bad login ${bad}`);
          this.$router.go(0);
        })
        .then(() => {
          this.$router.push('/profile');
        });
    }
  }
}
</script>

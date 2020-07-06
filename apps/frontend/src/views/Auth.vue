<template>
  <v-app id="inspire">
    <v-content>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title>Login to Heimdall</v-toolbar-title>
                <v-spacer />
                <v-tooltip bottom>
                  <template v-slot:activator="{on}">
                    <v-btn :href="source" icon large target="_blank" v-on="on">
                      <v-icon>mdi-code-tags</v-icon>
                    </v-btn>
                  </template>
                  <span>Source</span>
                </v-tooltip>
                <v-tooltip right>
                  <template v-slot:activator="{on}">
                    <v-btn
                      icon
                      large
                      href="https://codepen.io/johnjleider/pen/pMvGQO"
                      target="_blank"
                      v-on="on"
                    >
                      <v-icon>mdi-codepen</v-icon>
                    </v-btn>
                  </template>
                  <span>Codepen</span>
                </v-tooltip>
              </v-toolbar>
              <v-card-text>
                <v-form>
                  <v-text-field
                    label="Login"
                    name="login"
                    prepend-icon="person"
                    type="text"
                  />

                  <v-text-field
                    id="password"
                    label="Password"
                    name="password"
                    prepend-icon="lock"
                    type="password"
                  />
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary">Login</v-btn>
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

export interface LoginHash {
  username: string;
  password: string;
}

// We declare the props separately
// to make props types inferrable.
const AuthProps = Vue.extend({
  props: {
    source: String
  }
});

@Component({
  components: {}
})
export default class Auth extends AuthProps {
  username: string = '';
  password: string = '';
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

  async login(): Promise<void> {
    // checking if the input is valid
    if ((this.$refs.form as any).validate()) {
      console.log('Login to ' + this.host);
      let creds: LoginHash = {
        username: this.username,
        password: this.password
      };
      //this.loading = true;
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(this.host)
        .catch(bad => {
          console.error('Unable to connect to ' + this.host);
          this.$router.go(0);
        })
        .then(() => {
          return mod.login(creds);
        })
        .catch(bad => {
          console.error(`bad login ${bad}`);
          this.$router.go(0);
        });
    }
  }

  async register(): Promise<void> {
    // checking if the input is valid
    if ((this.$refs.form as any).validate()) {
      console.log('Login to ' + this.host);
      let creds: LoginHash = {
        username: this.username,
        password: this.password
      };
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(this.host)
        .catch(bad => {
          console.error('Unable to connect to ' + this.host);
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
          this.$router.go(0);
        })
        .then(() => {
          console.log('Registered!');
          this.$router.go(0);
        });
    }
  }
}
</script>

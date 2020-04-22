<template>
  <v-container class="bar lighten-2">
    <v-row justify="space-around" no-gutters>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <v-tabs
          :vertical="$vuetify.breakpoint.mdAndUp"
          active
          :value="active_tab"
          @change="selected_tab"
          color="primary-visible"
          show-arrows
        >
          <v-tabs-slider></v-tabs-slider>
          <!-- Define our tabs -->
          <v-tab href="#login-tab">Login</v-tab>
          <v-tab href="#register-tab">Sign Up</v-tab>

          <!-- Include those components -->
          <v-tab-item value="login-tab">
            <v-card>
              <v-card-title class="headline" primary-title>
                Login to Heimdall Server
              </v-card-title>

              <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-container>
                    <v-text-field
                      v-model="username"
                      label="email address"
                      maxlength="70"
                      required
                    />

                    <v-text-field
                      type="password"
                      v-model="password"
                      label="password"
                      maxlength="70"
                      required
                    />
                    <v-text-field
                      v-model="host"
                      label="host"
                      maxlength="200"
                      required
                    />
                  </v-container>
                  <v-btn
                    class="pink white--text"
                    :disabled="!valid"
                    @click="login"
                    >Login</v-btn
                  >
                </v-form>
              </v-card-text>
              <v-divider></v-divider>
            </v-card>
          </v-tab-item>

          <v-tab-item value="register-tab">
            <v-card>
              <v-card-title class="headline" primary-title>
                Register with Heimdall Server
              </v-card-title>

              <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                  <v-container>
                    <v-text-field
                      v-model="username"
                      label="email address"
                      maxlength="70"
                      required
                    />

                    <v-text-field
                      type="password"
                      v-model="password"
                      label="password"
                      maxlength="70"
                      required
                    />
                    <v-text-field
                      v-model="host"
                      label="host"
                      maxlength="200"
                      required
                    />
                  </v-container>
                  <v-btn
                    class="pink white--text"
                    :disabled="!valid"
                    @click="register"
                    >Sign Up</v-btn
                  >
                </v-form>
              </v-card-text>
              <v-divider></v-divider>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-col>
    </v-row>
    <div hidden>{{ watches }}</div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Filter } from "@/store/data_filters";
import { FileID } from "@/store/report_intake";
import { LocalStorageVal } from "@/utilities/helper_util";
import { getModule } from "vuex-module-decorators";
import ServerModule from "@/store/server";

export interface LoginHash {
  username: string;
  password: string;
}

// We declare the props separately
// to make props types inferrable.
const AuthProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class Auth extends AuthProps {
  username: string = "";
  password: string = "";
  host: string = "";
  active_tab: string = ""; // Set in mounted

  // Whether fields are valid
  valid = true;

  // Whether we're currently loading
  //loading = false;

  username_rules = [
    (v: string) => !!v || "Username is required"
    // (v: string) => (v && v.length > 3) || "A username must be more than 3 characters long",
    // (v: string) => /^[a-z0-9_]+$/.test(v) || "A username can only contain letters and digits"
  ];
  password_rules = [
    (v: string) => !!v || "Password is required"
    // (v: string) => (v && v.length > 7) || "The password must be longer than 7 characters"
  ];

  // Loads the last open tab
  mounted() {
    console.log("mount UploadNexus");
    this.active_tab = "login-tab";
  }

  // Handles change in tab
  selected_tab(new_tab: string) {
    this.active_tab = new_tab;
  }

  get watches(): string {
    let server = getModule(ServerModule, this.$store);
    if (server.profile) {
      console.log("server profile: " + server.profile);
      this.$router.push("/home");
      return "a";
    } else {
      return "b";
    }
  }

  async login(): Promise<void> {
    // checking if the input is valid
    if ((this.$refs.form as any).validate()) {
      console.log("Login to " + this.host);
      let creds: LoginHash = {
        username: this.username,
        password: this.password
      };
      //this.loading = true;
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(this.host)
        .catch(bad => {
          console.error("Unable to connect to " + this.host);
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
      console.log("Login to " + this.host);
      let creds: LoginHash = {
        username: this.username,
        password: this.password
      };
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(this.host)
        .catch(bad => {
          console.error("Unable to connect to " + this.host);
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
          console.log("Registered!");
          this.$router.go(0);
        });
    }
  }
}
</script>

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
                <v-tab id="select-tab-ldap-login" href="#login-ldap"
                  >Organization Login</v-tab
                >

                <v-tab-item value="login-standard">
                  <v-card class="elevation-12 rounded-t-0">
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
                      </v-form>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <div class="my-2">
                        <v-btn
                          id="sign_up_button"
                          depressed
                          small
                          @click="signup"
                        >
                          Sign Up
                        </v-btn>
                      </div>
                    </v-card-actions>
                  </v-card>
                </v-tab-item>
                <v-tab-item value="login-ldap">
                  <v-card-text>
                    <v-form id="login_form" ref="form" name="login_form">
                      <v-text-field
                        id="username_field"
                        v-model="username"
                        name="username"
                        label="Username"
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
                        @keyup.enter="ldapLogin()"
                        @blur="$v.password.$touch()"
                      />
                      <v-btn
                        id="login_button"
                        depressed
                        large
                        color="primary"
                        @click="ldapLogin()"
                      >
                        Login
                      </v-btn>
                    </v-form>
                  </v-card-text>
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
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {required, email} from 'vuelidate/lib/validators';
import {LocalStorageVal} from '@/utilities/helper_util';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';

const lastLoginTab = new LocalStorageVal<string>('login_curr_tab');

export interface LoginHash {
  email: string;
  password: string;
}

export interface LDAPLoginHash {
  username: string;
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
  username: string = '';
  password: string = '';
  activeTab: string = lastLoginTab.get_default('logintab-standard')

  mounted() {
    if(!ServerModule.ldap){
      document.querySelectorAll('[role="tablist"]')[0].remove()
    }
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

  ldapLogin() {
    const creds: LDAPLoginHash = {
      username: this.username,
      password: this.password
    };
    ServerModule.LoginLDAP(creds)
      .then(() => {
        this.$router.push('/');
        SnackbarModule.notify('You have successfully signed in.');
      })
      .catch((error) => {
        SnackbarModule.notify(error.response.data.message);
      });
  }

  get ldapenabled() {
    return ServerModule.ldap
  }
}
</script>
<style scoped>
.hidden {
  display: none;
}
</style>

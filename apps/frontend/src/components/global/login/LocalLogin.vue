<template>
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
          :error-messages="requiredFieldError($v.password, 'Password')"
          type="password"
          name="password"
          label="Password"
          prepend-icon="mdi-lock"
          @keyup.enter="login"
          @blur="$v.password.$touch()"
        />
        <v-container fluid class="mb-0">
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
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-container fluid>
        <div class="d-flex align-end flex-column mb-2">
          <router-link to="/signup">
            <v-btn id="sign_up_button" depressed small> Sign Up </v-btn>
          </router-link>
        </div>
        <v-spacer />
        <div v-show="showAlternateAuth">
          <v-row align="center"> <v-divider />OR<v-divider /> </v-row>
          <div class="container d-flex flex-column">
            <v-row justify="space-between">
              <v-col cols="auto">
                <v-btn
                  v-if="authStrategySupported('OIDC')"
                  id="oauth-oidc"
                  plain
                  @click="oauthLogin('oidc')"
                >
                  <v-img :src="require('@/assets/openid_mark.png')" />
                  <div class="pl-2">Login with {{ OIDCName }}</div>
                </v-btn></v-col
              >
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
                  <v-img height="32" :src="require('@/assets/okta_mark.png')" />
                  <div class="pl-2">Login with Okta</div>
                </v-btn></v-col
              >
            </v-row>
          </div>
        </div>
      </v-container>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {ServerModule} from '@/store/server';
import {required, email} from 'vuelidate/lib/validators';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {SnackbarModule} from '@/store/snackbar';

interface LoginHash {
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
export default class LocalLogin extends Vue {
    email: string = '';
    password: string = '';

  login() {
    const creds: LoginHash = {
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

  get showAlternateAuth() {
    return ServerModule.enabledOAuth.length !== 0;
  }

  authStrategySupported(strategy: string) {
    return ServerModule.enabledOAuth.includes(strategy)
  }
  oauthLogin(site: string){
    window.location.href = `/authn/${site}`;
  }

  get OIDCName() {
    return ServerModule.OIDCName;
  }
}
</script>

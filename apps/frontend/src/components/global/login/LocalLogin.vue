<template>
  <v-card class="elevation-12 rounded-t-0">
    <v-card-text>
      <v-form
        v-if="localLoginEnabled"
        id="login_form"
        ref="form"
        name="login_form"
        @submit.prevent="login"
      >
        <v-text-field
          id="email_field"
          v-model="email"
          :error-messages="emailErrors($v.email)"
          name="email"
          label="Email"
          prepend-icon="mdi-at"
          type="text"
          required
          tabindex="1"
          @blur="$v.email.$touch()"
        />
        <v-text-field
          id="password_field"
          ref="password"
          v-model="password"
          :error-messages="requiredFieldError($v.password, 'Password')"
          :type="showPassword ? 'text' : 'password'"
          name="password"
          label="Password"
          prepend-icon="mdi-lock"
          tabindex="2"
          @blur="$v.password.$touch()"
        >
          <template #append>
            <v-icon @click="showPassword = !showPassword">
            {{ showPassword ? 'mdi-eye' : 'mdi-eye-off' }}
            </v-icon>
          </template>
        </v-text-field>
        <v-container fluid class="mb-0">
          <v-btn
            id="login_button"
            depressed
            large
            color="primary"
            :disabled="$v.$invalid"
            type="submit"
            tabindex="3"
            :loading="buttonLoading"
          >
            Login
          </v-btn>
        </v-container>
      </v-form>
      <v-banner v-else>
        <v-layout>
          NOTE: This Heimdall instance is in an external-authentication only
          mode.
          <v-icon class="mr-3" @click="openExternalAuthModeDocumentation"
            >mdi-help-circle-outline</v-icon
          >
        </v-layout>
      </v-banner>
    </v-card-text>
    <v-card-actions>
      <v-container fluid>
        <div
          v-if="registrationEnabled && localLoginEnabled"
          class="d-flex align-end flex-column mb-2"
        >
          <router-link to="/signup">
            <v-btn id="sign_up_button" depressed small> Sign Up </v-btn>
          </router-link>
        </div>
        <v-spacer />
        <div v-show="showAlternateAuth">
          <v-row v-if="localLoginEnabled" align="center">
            <v-divider />OR<v-divider />
          </v-row>
          <div class="d-flex justify-content-center flex-wrap">
            <v-btn
              v-if="authStrategySupported('oidc')"
              id="oauth-oidc"
              class="mt-5 flex-fill"
              plain
              @click="oauthLogin('oidc')"
            >
              <v-img
                max-width="32"
                max-height="32"
                :src="require('@/assets/openid_mark.png')"
              />
              <div class="pl-2">Login with {{ oidcName }}</div>
            </v-btn>
            <v-btn
              v-show="authStrategySupported('google')"
              id="oauth-google"
              class="mt-5 flex-fill"
              plain
              @click="oauthLogin('google')"
            >
              <v-img
                max-width="32"
                max-height="32"
                :src="require('@/assets/google_mark.png')"
              />
              <div class="pl-2">Login with Google</div>
            </v-btn>
            <v-btn
              v-show="authStrategySupported('github')"
              id="oauth-github"
              class="mt-5 flex-fill"
              plain
              @click="oauthLogin('github')"
            >
              <v-img
                max-width="32"
                max-height="32"
                :src="require('@/assets/github_mark.png')"
              />
              <div class="pl-2">Login with GitHub</div> </v-btn
            ><v-btn
              v-show="authStrategySupported('gitlab')"
              id="oauth-gitlab"
              class="mt-5 flex-fill"
              plain
              @click="oauthLogin('gitlab')"
            >
              <v-img
                max-width="32"
                max-height="32"
                :src="require('@/assets/gitlab_mark.png')"
              />
              <div class="pl-2">Login with GitLab</div>
            </v-btn>
            <v-btn
              v-show="authStrategySupported('okta')"
              id="oauth-okta"
              class="mt-5 flex-fill"
              plain
              @click="oauthLogin('okta')"
            >
              <v-img
                max-width="32"
                max-height="32"
                :src="require('@/assets/okta_mark.png')"
              />
              <div class="pl-2">Login with Okta</div>
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';
import Component from 'vue-class-component';
import {email, required} from 'vuelidate/lib/validators';

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
  email = '';
  password = '';
  buttonLoading = false;
  showPassword = false;

  login() {
    this.buttonLoading = true;
    const creds: LoginHash = {
      email: this.email,
      password: this.password
    };
    ServerModule.Login(creds)
      .then(() => {
        this.$router.push('/');
        SnackbarModule.notify('You have successfully signed in.');
      })
      .finally(() => {
        this.buttonLoading = false;
      });
  }

  get showAlternateAuth() {
    return ServerModule.enabledOAuth.length !== 0;
  }

  get localLoginEnabled() {
    return ServerModule.localLoginEnabled;
  }

  openExternalAuthModeDocumentation() {
    window.open(
      'https://github.com/mitre/heimdall2/wiki/External-Authentication-Only'
    );
  }

  authStrategySupported(strategy: string) {
    return ServerModule.enabledOAuth.includes(strategy);
  }

  oauthLogin(site: string) {
    window.location.href = `/authn/${site}`;
  }

  get oidcName() {
    return ServerModule.oidcName;
  }

  get registrationEnabled() {
    return ServerModule.registrationEnabled;
  }
}
</script>

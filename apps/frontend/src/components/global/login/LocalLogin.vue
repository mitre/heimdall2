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
        <v-btn id="sign_up_button" depressed small @click="signup">
          Sign Up
        </v-btn>
      </div>
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
}
</script>

<template>
  <v-card-text>
    <v-form id="login_form" ref="form" name="login_form">
      <v-text-field
        id="username_field"
        v-model="username"
        :error-messages="requiredFieldError($v.username, 'Username')"
        name="username"
        label="Username"
        prepend-icon="mdi-account"
        type="text"
        required
        data-cy="ldapusername"
        @keyup.enter="$refs.password.focus"
        @blur="$v.username.$touch()"
      />
      <v-text-field
        id="password_field"
        ref="password"
        v-model="password"
        :error-messages="requiredFieldError($v.password, 'Password')"
        type="password"
        name="password"
        label="Password"
        data-cy="ldappassword"
        prepend-icon="mdi-lock"
        @keyup.enter="ldapLogin()"
        @blur="$v.password.$touch()"
      />
      <v-btn
        id="login_button"
        depressed
        large
        data-cy="ldapLoginButton"
        color="primary"
        @click="ldapLogin()"
      >
        Login
      </v-btn>
    </v-form>
  </v-card-text>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {required} from 'vuelidate/lib/validators';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';

export interface LDAPLoginHash {
  username: string;
  password: string;
}

@Component({
    mixins: [UserValidatorMixin],
    validations: {
        username: {
            required
        },
        password: {
            required
        }
    }
})
export default class LDAPLogin extends Vue {
    username: string = '';
    password: string = '';

    ldapLogin() {
        const creds: LDAPLoginHash = {
        username: this.username,
        password: this.password
        };
        ServerModule.LoginLDAP(creds)
        .then(() => {
            this.$router.push('/');
            SnackbarModule.notify('You have successfully signed in.');
        });
    }
}
</script>

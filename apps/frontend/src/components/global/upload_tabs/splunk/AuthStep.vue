<template>
  <div>
    <v-form>
      <v-text-field
        v-model="username"
        label="Username"
        for="username_field"
        data-cy="splunkusername"
      />
      <v-text-field
        v-model="password"
        label="Password"
        for="password_field"
        type="password"
        data-cy="splunkpassword"
      />
      <v-text-field
        v-model="hostname"
        label="Hostname"
        for="hostname_field"
        hint="https://yourdomain.com:8089"
        data-cy="splunkhostname"
      />
    </v-form>
    <v-row class="mx-1">
      <v-btn
        color="primary"
        class="my-4 mt-4"
        data-cy="splunkLoginButton"
        @click="login"
      >
        Login
      </v-btn>
      <v-spacer />
      <v-btn @click="$emit('show-help')">
        Help
        <v-icon class="ml-2"> mdi-help-circle </v-icon>
      </v-btn>
    </v-row>
  </div>
</template>

<script lang="ts">
import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
import {SnackbarModule} from '@/store/snackbar';
import {LocalStorageVal} from '@/utilities/helper_util';
import {SplunkClient} from '@/utilities/splunk_util';
import Vue from 'vue';
import Component from 'vue-class-component';

// Our saved fields
const localUsername = new LocalStorageVal<string>('splunk_username');
const localPassword = new LocalStorageVal<string>('splunk_password');
const localHostname = new LocalStorageVal<string>('splunk_hostname');

@Component({
  components: {
    FileList
  }
})
export default class AuthStep extends Vue {
  username = '';
  password = '';
  hostname = '';

  async login() {
    const splunkClient = new SplunkClient(
      this.hostname,
      this.username,
      this.password
    );
    splunkClient.validateCredentials().then((result) => {
      if (result === true) {
        localUsername.set(this.username);
        localPassword.set(this.password);
        localHostname.set(this.hostname);
        SnackbarModule.failure('You have successfully signed in');
        this.$emit('authenticated', splunkClient);
      } else if (result === false) {
        SnackbarModule.failure('Incorrect Username or Password');
      } else {
        SnackbarModule.failure(result);
        this.$emit('error');
      }
    });
  }

  /** Init our fields */
  mounted() {
    this.username = localUsername.get_default('');
    this.password = localPassword.get_default('');
    this.hostname = localHostname.get_default('');
  }
}
</script>

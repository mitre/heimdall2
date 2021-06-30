<template>
  <v-stepper-content step="1">
    <v-form v-model="valid">
      <v-text-field v-model="username" label="Username" :rules="[reqRule]" />
      <v-text-field
        v-model="password"
        label="Password"
        type="password"
        :rules="[reqRule]"
      />
      <v-text-field
        v-model="hostname"
        label="Hostname"
        :rules="[reqRule]"
        hint="Ex: https://my.website.com:8089"
      />
    </v-form>
    <v-row class="mx-1">
      <v-btn
        color="primary"
        :disabled="!valid || loggingIn"
        :loading="loggingIn"
        class="my-2"
        @click="try_login"
      >
        Login
      </v-btn>
      <v-spacer />
      <v-btn @click="$emit('show-help')">
        Help
        <v-icon class="ml-2"> mdi-help-circle </v-icon>
      </v-btn>
    </v-row>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {LocalStorageVal} from '@/utilities/helper_util';

import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
import {SplunkEndpoint} from '@/utilities/splunk_util';

// Our saved fields
const localUsername = new LocalStorageVal<string>('splunk_username');
const localPassword = new LocalStorageVal<string>('splunk_password');
const localHostname = new LocalStorageVal<string>('splunk_hostname');

/**
 *
 */
@Component({
  components: {
    FileList
  }
})
export default class AuthStep extends Vue {
  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid = false;

  /** State of input fields */
  username = '';
  password = '';
  hostname = '';

  /** Whether we are currently authenticating */
  loggingIn = false;
  try_login() {
    // Save credentials
    localUsername.set(this.username);
    localPassword.set(this.password);
    localHostname.set(this.hostname);

    // Check splunk
    const s = new SplunkEndpoint(this.hostname, this.username, this.password);

    this.loggingIn = true;
    s.check_auth()
      .then(() => {
        // all goes well, proceed
        this.$emit('authenticated', s);
        this.loggingIn = false;
      })
      .catch((err) => {
        this.loggingIn = false;
        this.$emit('error', err);
      });
  }

  /** Form required field rules. Maybe eventually expand to other stuff */
  reqRule = (v: string | null | undefined) =>
    (v || '').trim().length > 0 || 'Field is Required';

  /** Init our fields */
  mounted() {
    this.username = localUsername.get_default('');
    this.password = localPassword.get_default('');
    this.hostname = localHostname.get_default('');
  }
}
</script>

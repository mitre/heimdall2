<template>
  <v-stepper-content step="1">
    <v-form v-model="valid">
      <v-text-field v-model="username" label="Username" :rules="[req_rule]" />
      <v-text-field
        v-model="password"
        label="Password"
        :rules="[req_rule]"
        :append-icon="show_secret ? 'mdi-eye' : 'mdi-eye-off'"
        :type="show_secret ? 'text' : 'password'"
        @click:append="show_secret = !show_secret"
      />
      <v-text-field
        v-model="hostname"
        label="Hostname"
        :rules="[req_rule]"
        hint="Ex: https://my.website.com:8089"
      />
    </v-form>
    <v-row class="mx-1">
      <v-btn
        color="primary"
        :disabled="!valid || logging_in"
        :loading="logging_in"
        class="my-2"
        @click="try_login"
      >
        Login
      </v-btn>
      <v-spacer />
      <v-btn @click="$emit('show-help')">
        Help
        <v-icon class="ml-2">
          mdi-help-circle
        </v-icon>
      </v-btn>
    </v-row>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {LocalStorageVal} from '../../../../utilities/helper_util';

import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
import {SplunkEndpoint} from '../../../../utilities/splunk_util';

// Our saved fields
const local_username = new LocalStorageVal<string>('splunk_username');
const local_password = new LocalStorageVal<string>('splunk_password');
const local_hostname = new LocalStorageVal<string>('splunk_hostname');

// We declare the props separately to make props types inferable.
const Props = Vue.extend({});

/**
 *
 */
@Component({
  components: {
    FileList
  }
})
export default class SplunkAuth extends Props {
  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid: boolean = false;
  show_secret: boolean = false;

  /** State of input fields */
  username: string = '';
  password: string = '';
  hostname: string = '';

  /** Whether we are currently authenticating */
  logging_in = false;
  try_login() {
    // Save credentials
    local_username.set(this.username);
    local_password.set(this.password);
    local_hostname.set(this.hostname);

    // Check splunk
    let s = new SplunkEndpoint(this.hostname, this.username, this.password);

    this.logging_in = true;
    s.check_auth()
      .then(ok => {
        // all goes well, proceed
        this.$emit('authenticated', s);
        this.logging_in = false;
      })
      .catch(err => {
        this.logging_in = false;
        this.$emit('error', err);
      });
  }

  /** Form required field rules. Maybe eventually expand to other stuff */
  req_rule = (v: string | null | undefined) =>
    (v || '').trim().length > 0 || 'Field is Required';

  /** Init our fields */
  mounted() {
    this.username = local_username.get_default('');
    this.password = local_password.get_default('');
    this.hostname = local_hostname.get_default('');
  }
}
</script>

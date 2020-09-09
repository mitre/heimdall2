<template>
  <v-stepper-content step="1">
    <v-form v-model="valid">
      <v-text-field
        :value="access_token"
        @input="change_access_token"
        label="User Account Access Token"
        lazy-validation="lazy"
        :rules="[req_rule]"
      />
      <v-text-field
        :value="secret_token"
        @input="change_secret_token"
        label="User Account Secret Token"
        :rules="[req_rule]"
        :append-icon="show_secret ? 'mdi-eye' : 'mdi-eye-off'"
        :type="show_secret ? 'text' : 'password'"
        @click:append="show_secret = !show_secret"
      />
    </v-form>
    <v-btn
      color="primary"
      :disabled="!valid"
      @click="$emit('auth-basic')"
      class="my-2 mr-3"
    >
      Basic Login
    </v-btn>
    <v-btn
      color="green"
      :disabled="!valid"
      @click="$emit('goto-mfa')"
      class="my-2 mr-3"
    >
      MFA Login
    </v-btn>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {LocalStorageVal} from '../../../../utilities/helper_util';

import FileList from '@/components/global/upload_tabs/aws/FileList.vue';

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    access_token: String,
    secret_token: String
  }
});

/** Localstorage keys */
const local_access_token = new LocalStorageVal<string>('aws_s3_access_token');
const local_secret_token = new LocalStorageVal<string>('aws_s3_secret_token');

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    FileList
  }
})
export default class S3Reader extends Props {
  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid: boolean = false;
  show_secret: boolean = false;

  /** Form required field rules. Maybe eventually expand to other stuff */
  req_rule = (v: string | null | undefined) =>
    (v || '').trim().length > 0 || 'Field is Required';

  // Callback for change in access token
  change_access_token(new_value: string) {
    local_access_token.set(new_value);
    this.$emit('update:access_token', new_value);
  }

  // Callback for change in secret token
  change_secret_token(new_value: string) {
    local_secret_token.set(new_value);
    this.$emit('update:secret_token', new_value);
  }

  /** On mount, try to look up stored auth info */
  mounted() {
    // Load our credentials
    this.change_access_token(local_access_token.get_default(''));
    this.change_secret_token(local_secret_token.get_default(''));
  }
}
</script>

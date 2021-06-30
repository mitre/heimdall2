<template>
  <v-stepper-content step="2">
    <v-form v-model="valid">
      <v-text-field
        :value="mfaToken"
        label="MFA Token"
        :rules="[reqRule, mfaRule]"
        @input="change_mfa_token"
        @keyup.enter="proceed"
      />
      <v-text-field
        :value="mfaSerial"
        label="MFA Device ARN (Optional)"
        hint="Defaults to virtual IAM device"
        @input="changeMFASerial"
        @keyup.enter="proceed"
      />
      <v-btn
        color="primary"
        :disabled="!valid"
        class="my-2 mr-2"
        @click="$emit('auth-mfa')"
      >
        Login
      </v-btn>
      <v-btn color="red" class="my-2 ml-2" @click="proceed"> Cancel </v-btn>
    </v-form>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {PropSync} from 'vue-property-decorator';

import {LocalStorageVal} from '@/utilities/helper_util';

/** Localstorage keys */
const localMFASerial = new LocalStorageVal<string>('aws_s3_mfa_serial');

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component
export default class S3Reader extends Vue {
  @PropSync('mfaToken', {type: String}) token!: string;
  @PropSync('mfaSerial', {type: String}) serial!: string;
  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid = false;

  /** Form required field rules. Maybe eventually expand to other stuff */
  reqRule = (v: string | null | undefined) =>
    (v || '').trim().length > 0 || 'Field is Required';
  mfaRule = (v: string | null | undefined) =>
    (v || '').trim().match('^\\d{6}$') !== null ||
    'Field must be the 6 number code from a valid authenticator device';

  /** On mount, try to look up stored auth info */
  mounted() {
    this.changeMFASerial(localMFASerial.get_default(''));
  }

  /** Handles changes to mfa serial */
  change_mfa_token(newValue: string) {
    this.token = newValue;
  }

  /** Handles changes to mfa token */
  changeMFASerial(newValue: string) {
    localMFASerial.set(newValue);
    this.serial = newValue;
  }

  /** When button is pressed or enter is pressed */
  proceed() {
    this.$emit('exit-mfa');
  }
}
</script>

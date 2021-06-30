<template>
  <v-stepper-content step="1">
    <v-form v-model="valid">
      <v-text-field
        :value="accessToken"
        label="User Account Access Token"
        lazy-validation="lazy"
        :rules="[reqRule]"
        @input="change_access_token"
      />
      <v-text-field
        :value="secretToken"
        label="User Account Secret Token"
        type="password"
        :rules="[reqRule]"
        @input="change_secret_token"
      />
    </v-form>
    <v-btn
      color="primary"
      :disabled="!valid"
      class="my-2 mr-3"
      @click="$emit('auth-basic')"
    >
      Basic Login
    </v-btn>
    <v-btn
      color="green"
      :disabled="!valid"
      class="my-2 mr-3"
      @click="$emit('goto-mfa')"
    >
      MFA Login
    </v-btn>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {LocalStorageVal} from '@/utilities/helper_util';

import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
import {Prop} from 'vue-property-decorator';

/** Localstorage keys */
const localAccessToken = new LocalStorageVal<string>('aws_s3_access_token');
const localSecretToken = new LocalStorageVal<string>('aws_s3_secret_token');

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
export default class S3Reader extends Vue {
  @Prop({type: String}) readonly accessToken!: string;
  @Prop({type: String}) readonly secretToken!: string;

  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid = false;

  /** Form required field rules. Maybe eventually expand to other stuff */
  reqRule = (v: string | null | undefined) =>
    (v || '').trim().length > 0 || 'Field is Required';

  // Callback for change in access token
  change_access_token(token: string) {
    localAccessToken.set(token);
    this.$emit('update:accessToken', token);
  }

  // Callback for change in secret token
  change_secret_token(token: string) {
    localSecretToken.set(token);
    this.$emit('update:secretToken', token);
  }

  /** On mount, try to look up stored auth info */
  mounted() {
    // Load our credentials
    this.change_access_token(localAccessToken.get_default(''));
    this.change_secret_token(localSecretToken.get_default(''));
  }
}
</script>

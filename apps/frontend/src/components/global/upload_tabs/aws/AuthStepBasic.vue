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
      <v-text-field
        :value="region"
        label="Bucket Region (Default: us-east-1)"
        type="text"
        @input="change_region"
      />
      <v-text-field
        :value="endpoint"
        label="S3 Endpoint (Default: AWS)"
        hint="Leave blank for AWS, or enter a custom S3-compatible URL (e.g. https://minio.example.com)"
        persistent-hint="persistent-hint"
        type="text"
        @input="change_endpoint"
      />
      <v-checkbox
        :input-value="skipSts"
        class="mb-4"
        label="Use credentials directly (skip STS)"
        hint="Enable for S3-compatible servers that don't support AWS STS. Disables MFA login."
        persistent-hint="persistent-hint"
        @change="change_skip_sts"
      />
    </v-form>
    <v-row class="mx-1 mb-2">
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
        :disabled="!valid || skipSts"
        class="my-2"
        @click="$emit('goto-mfa')"
      >
        MFA Login
      </v-btn>
      <v-spacer />
      <v-btn class="my-2" @click="$emit('show-help')">
        Help
        <v-icon class="ml-2"> mdi-help-circle </v-icon>
      </v-btn>
    </v-row>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
import {LocalStorageVal} from '@/utilities/helper_util';
import {requireFieldRule} from '@/utilities/upload_util';

/** Localstorage keys */
const localAccessToken = new LocalStorageVal<string>('aws_s3_access_token');
const localSecretToken = new LocalStorageVal<string>('aws_s3_secret_token');
const localRegion = new LocalStorageVal<string>('aws_s3_region');
const localEndpoint = new LocalStorageVal<string>('aws_s3_endpoint');
const localSkipSts = new LocalStorageVal<boolean>('aws_s3_skip_sts');

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
  @Prop({type: String}) readonly region!: string;
  @Prop({type: String}) readonly endpoint!: string;
  @Prop({type: Boolean}) readonly skipSts!: boolean;

  /** Models if currently displayed form is valid.
   * Shouldn't be used to interpret literally anything else as valid - just checks fields filled
   */
  valid = false;

  // Form required field rule
  reqRule = requireFieldRule;

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

  change_region(region: string) {
    localRegion.set(region);
    this.$emit('update:region', region);
  }

  change_endpoint(endpoint: string) {
    localEndpoint.set(endpoint);
    this.$emit('update:endpoint', endpoint);
  }

  change_skip_sts(skipSts: boolean) {
    // v-checkbox emits null when toggled off
    const value = !!skipSts;
    localSkipSts.set(value);
    this.$emit('update:skipSts', value);
  }

  /** On mount, try to look up stored auth info */
  mounted() {
    // Load our credentials
    this.change_access_token(localAccessToken.getDefault(''));
    this.change_secret_token(localSecretToken.getDefault(''));
    this.change_region(localRegion.getDefault(''));
    this.change_endpoint(localEndpoint.getDefault(''));
    this.change_skip_sts(localSkipSts.getDefault(false));
  }
}
</script>

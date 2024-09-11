<template>
  <div>
    <v-form>
      <v-text-field
        ref="access_Key"
        v-model="accesskey"
        label="Access Token (Key)"
        for="accesskey_field"
        :rules="[reqRule]"
        data-cy="tenableaccesskey"
      />
      <v-text-field
        ref="secret_Key"
        v-model="secretkey"
        label="Secret Token (Key)"
        for="secretkey_field"
        type="password"
        lazy-validation="lazy"
        :rules="[reqRule]"
        data-cy="tenablesecretkey"
      />
      <v-text-field
        ref="hostname_value"
        v-model="hostname"
        label="Hostname"
        for="hostname_field"
        lazy-validation="lazy"
        :rules="[reqRule]"
        hint="https://yourtenabledomain.com:443"
        data-cy="tenablehostname"
      />
    </v-form>
    <v-row class="mx-1">
      <v-btn
        color="primary"
        class="my-4 mt-4"
        data-cy="tenableLoginButton"
        @click="login"
      >
        Login
      </v-btn>
      <v-spacer />
      <v-btn class="mt-4" @click="$emit('show-help')">
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
import {AuthInfo, TenableUtil} from '@/utilities/tenable_util';
import {requireFieldRule} from '@/utilities/upload_util';

import Vue from 'vue';
import Component from 'vue-class-component';

// Our saved fields
const localAccesskey = new LocalStorageVal<string>('tenable_accesskey');
const localSecretkey = new LocalStorageVal<string>('tenable_secretkey');
const localHostname = new LocalStorageVal<string>('tenable_hostname');

@Component({
  components: {
    FileList
  }
})
export default class AuthStep extends Vue {
  accesskey = '';
  secretkey = '';
  hostname = '';

  $refs!: {
    access_Key: HTMLInputElement;
    secret_Key: HTMLAnchorElement;
    hostname_value: HTMLAnchorElement;
  };

  // Form required field rule
  reqRule = requireFieldRule;

  async login(): Promise<void> {
    if (!this.accesskey) {
      SnackbarModule.failure('The Access Token (key) is required');
      this.$refs.access_Key.focus();
      return;
    } else if (!this.secretkey) {
      SnackbarModule.failure('The Secret Token (key) is required');
      this.$refs.secret_Key.focus();
      return;
    } else if (!this.hostname) {
      SnackbarModule.failure('The Tenable.Sc URL is required');
      this.$refs.hostname_value.focus();
      return;
    }

    // If the protocol (https) is missing add it
    if (!/^https?:\/\//.test(this.hostname)) {
      this.hostname = `https://${this.hostname}`;
    }

    // If the SSL/TLS port is missing add default 443
    if (!this.hostname.split(':')[2]) {
      this.hostname = `${this.hostname}:443`;
    }

    const config: AuthInfo = {
      accesskey: this.accesskey,
      secretkey: this.secretkey,
      host_url: this.hostname
    };

    await new TenableUtil(config)
      .loginToTenable()
      .then(() => {
        localAccesskey.set(this.accesskey);
        localSecretkey.set(this.secretkey);
        localHostname.set(this.hostname);
        SnackbarModule.notify('You have successfully signed in');
        this.$emit('authenticated', config);
      })
      .catch((error) => {
        if (error !== 'Incorrect Access or Secret key') {
          this.$emit('error');
        }
        SnackbarModule.failure(error);
      });
  }

  /** Init our fields */
  mounted() {
    this.accesskey = localAccesskey.getDefault('');
    this.secretkey = localSecretkey.getDefault('');
    this.hostname = localHostname.getDefault('');
  }
}
</script>

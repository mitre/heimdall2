<template>
  <div>
    <v-form>
      <v-text-field
        v-model="accesskey"
        label="Access Token (Key)"
        for="accesskey_field"
        :rules="[reqRule]"
        data-cy="tenableaccesskey"
      />
      <v-text-field
        v-model="secretkey"
        label="Secret Token (Key)"
        for="secretkey_field"
        type="password"
        lazy-validation="lazy"
        :rules="[reqRule]"
        data-cy="tenablesecretkey"
      />
      <v-text-field
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

  // Form required field rule
  reqRule = requireFieldRule;

  async login(): Promise<void> {
    if (!/^https?:\/\//.test(this.hostname)) {
      this.hostname = `https://${this.hostname}`;
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

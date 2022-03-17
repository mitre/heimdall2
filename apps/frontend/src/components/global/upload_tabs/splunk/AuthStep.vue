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
      <v-container style="margin: 0; padding: 0" grid-list-md text-xs-center>
        <v-layout row wrap>
          <v-flex xs10>
            <v-text-field
              v-model="hostname"
              label="Hostname"
              for="hostname_field"
              hint="https://yourdomain.com:8089"
              data-cy="splunkhostname"
            />
          </v-flex>
          <v-flex xs2>
            <v-text-field
              v-model="index"
              label="Index"
              for="index_field"
              data-cy="splunkindex"
            />
          </v-flex>
        </v-layout>
      </v-container>
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
import {checkSplunkCredentials} from '@mitre/hdf-converters/src/splunk-mapper';
import {SplunkConfig} from '@mitre/splunk-sdk-no-env';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

// Our saved fields
const localUsername = new LocalStorageVal<string>('splunk_username');
const localPassword = new LocalStorageVal<string>('splunk_password');
const localSplunk2HDFIndex = new LocalStorageVal<string>('splunk2hdf_index');
const localHDF2SplunkIndex = new LocalStorageVal<string>('hdf2splunk_index');
const localHostname = new LocalStorageVal<string>('splunk_hostname');

@Component({
  components: {
    FileList
  }
})
export default class AuthStep extends Vue {
  @Prop({type: String, required: false}) indexToShow?: string;
  username = '';

  password = '';
  hostname = '';
  index = '';

  async login(): Promise<void> {
    if (!/^https?:\/\//.test(this.hostname)) {
      this.hostname = `https://${this.hostname}`;
    }

    const parsedURL = new URL(this.hostname);

    const config: SplunkConfig = {
      host: parsedURL.hostname,
      username: this.username,
      password: this.password,
      port: parseInt(parsedURL.port) || 8089,
      index: this.index,
      scheme: parsedURL.protocol.split(':')[0] || 'https'
    };

    await checkSplunkCredentials(config, true)
      .then(() => {
        localUsername.set(this.username);
        localPassword.set(this.password);
        localHostname.set(this.hostname);
        if (this.indexToShow === undefined) {
          localSplunk2HDFIndex.set(this.index);
        } else {
          localHDF2SplunkIndex.set(this.index);
        }
        SnackbarModule.notify('You have successfully signed in');
        this.$emit('authenticated', config);
      })
      .catch((error) => {
        if (error !== 'Incorrect Username or Password') {
          this.$emit('error');
        }
        SnackbarModule.failure(error);
      });
  }

  /** Init our fields */
  mounted() {
    this.username = localUsername.get_default('');
    this.password = localPassword.get_default('');
    this.hostname = localHostname.get_default('');
    if (this.indexToShow === undefined) {
      this.index = localSplunk2HDFIndex.get_default('*');
    } else {
      this.index = localSplunk2HDFIndex.get_default(this.indexToShow);
    }
  }
}
</script>

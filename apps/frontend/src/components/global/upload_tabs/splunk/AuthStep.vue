<template>
  <div>
    <v-form>
      <v-text-field v-model="username" label="Username" />
      <v-text-field v-model="password" label="Password" type="password" />
      <v-text-field v-model="hostname" label="Hostname" />
    </v-form>
    <v-row class="mx-1">
      <v-btn color="primary" class="my-4 mt-0" @click="login"> Login </v-btn>
      <v-spacer />
      <v-btn>
        Help
        <v-icon class="ml-2"> mdi-help-circle </v-icon>
      </v-btn>
    </v-row>
  </div>
</template>

<script lang="ts">
import FileList from '@/components/global/upload_tabs/aws/FileList.vue';
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
    if (await splunkClient.validateCredentials()) {
      this.$emit('authenticated', splunkClient);
    }
  }

  /** Init our fields */
  mounted() {
    this.username = localUsername.get_default('');
    this.password = localPassword.get_default('');
    this.hostname = localHostname.get_default('');
  }
}
</script>

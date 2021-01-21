<template>
  <v-app id="inspire">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12 rounded-b-0">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title id="login_form_title">
                  Login to Heimdall Server
                </v-toolbar-title>
                <v-spacer />
              </v-toolbar>
              <v-tabs
                active
                :value="activeTab"
                background-color="primary darken-1"
                color="primary-visible"
                show-arrows
              >
                <v-tab id="select-tab-standard-login" href="#login-standard"
                  >Heimdall Login</v-tab
                >
                <v-tab
                  v-if="ldapenabled"
                  id="select-tab-ldap-login"
                  href="#login-ldap"
                  >Organization Login</v-tab
                >

                <v-tab-item value="login-standard">
                  <LocalLogin />
                </v-tab-item>
                <v-tab-item value="login-ldap">
                  <LDAPLogin />
                </v-tab-item>
              </v-tabs>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {LocalStorageVal} from '@/utilities/helper_util';
import {ServerModule} from '@/store/server';
import LocalLogin from '@/components/global/login/LocalLogin.vue'
import LDAPLogin from '@/components/global/login/LDAPLogin.vue'

const lastLoginTab = new LocalStorageVal<string>('login_curr_tab');

@Component({
  components: {
    LocalLogin,
    LDAPLogin
  }
})
export default class Login extends Vue {
  username: string = '';
  activeTab: string = lastLoginTab.get_default('logintab-standard')

  mounted() {
    this.checkLoggedIn();
  }

  checkLoggedIn() {
    if (ServerModule.token) {
      this.$router.push('/');
    }
  }

  get ldapenabled() {
    return ServerModule.ldap
  }
}
</script>

<template>
  <div>
    <h1>Verifying your credentials with GitHub</h1>
    <p>
      If you are not redirected within a few seconds, please click
      <a href="/">here</a>.
    </p>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';

@Component({})
export default class OauthCallbackHandler extends Vue {
  mounted() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')){
      ServerModule.LoginGithub(params.get('code')).then(() => {
        setTimeout(function(){
          window.location.href = "/"
        }, 1000)
      })
      .catch((error) => {
        SnackbarModule.notify(error.response.data.message);
      });
    }
  }
}
</script>

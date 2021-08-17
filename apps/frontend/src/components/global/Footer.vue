<template>
  <span>
    <v-footer app title="footer" class="bar font-weight-light">
      <v-row>
        <v-col>
          <span
            :style="copyrightStyle"
            class="copyright-footer bar-visible--text"
          >
            The MITRE Corporation &copy; 2018-{{ new Date().getFullYear() }}
          </span>
        </v-col>
      </v-row>
    </v-footer>
    <v-footer
      v-if="classification"
      app
      title="footer"
      class="bar font-weight-light"
    >
      <v-row>
        <v-col>
          <span
            :style="classificationStyle"
            class="classification-footer bar-visible--text"
          >
            {{ classification }}
          </span>
        </v-col>
      </v-row>
    </v-footer>
  </span>
</template>

<script lang="ts">
import {ServerModule} from '@/store/server';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {}
})
export default class Footer extends Vue {
  get classification(): string {
    return ServerModule.classificationBannerText;
  }

  get copyrightStyle() {
    return {
      height: this.classification ? '3em' : '1.5em'
    };
  }

  get classificationStyle() {
    return {
      background: ServerModule.classificationBannerColor,
      color: `${ServerModule.classificationBannerTextColor} !important`
    };
  }
}
</script>

<style scoped>
.classification-footer {
  position: fixed;
  text-align: center;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.5em;
}

.copyright-footer {
  background: #303030;
  position: fixed;
  left: 0;
  padding-left: 1em;
  right: 0;
  bottom: 0;
}
</style>

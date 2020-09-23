<template>
  <v-container>
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus :persistent="true" @got-files="on_got_files" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component} from 'vue-property-decorator';
import UploadNexus from '@/components/global/UploadNexus.vue';

import {FileID} from '@/store/report_intake';

import ServerMixin from '@/mixins/ServerMixin';
import {mixins} from 'vue-class-component';

@Component({
  components: {
    UploadNexus
  }
})
export default class Landing extends mixins(ServerMixin) {
  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    this.$router.push(`/results`);
  }
}
</script>

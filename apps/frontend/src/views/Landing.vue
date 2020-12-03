<template>
  <BaseView
    title="Load Sample"
    :show-toolbar="false"
    :show-topbar="serverMode"
    :minimal-topbar="true"
    :topbar-z-index="1000"
  >
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus retain-focus :persistent="true" />
      </v-col>
    </v-row>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component, {mixins} from 'vue-class-component';
import ServerMixin from '@/mixins/ServerMixin';
import UploadNexus from '@/components/global/UploadNexus.vue';
import BaseView from '@/views/BaseView.vue';
import { ServerModule } from '@/store/server';


@Component({
  components: {
    UploadNexus,
    BaseView
  }
})
export default class Landing extends mixins(ServerMixin) {}
</script>

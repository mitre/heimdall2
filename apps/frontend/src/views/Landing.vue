<template>
  <BaseView title="Load Sample" :topbar-z-index="1000" :minimal-topbar="true">
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus retain-focus :persistent="true" />
      </v-col>
    </v-row>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component} from 'vue-property-decorator';
import UploadNexus from '@/components/global/UploadNexus.vue';
import BaseView from '@/views/BaseView.vue';

@Component({
  components: {
    UploadNexus,
    BaseView
  }
})
export default class Landing extends Vue {}
</script>

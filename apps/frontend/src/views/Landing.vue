<template>
  <v-container>
    <v-row>
      <v-col center xl="8" md="8" sm="12" xs="12">
        <UploadNexus :persistent="true" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component} from 'vue-property-decorator';
import UploadNexus from '@/components/global/UploadNexus.vue';

@Component({
  components: {
    UploadNexus
  }
})
export default class Landing extends Vue {}
</script>

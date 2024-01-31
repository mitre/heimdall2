<template>
    <v-row no-gutters>
      <v-col class="pa-0" :cols="1">
        <slot name="status" />
      </v-col>

      <v-col class="pa-0" :cols="1">
        <slot name="set" />
      </v-col>

      <v-col class="pa-0" :cols="2">
        <v-card tile flat class="fill-height">
          <slot name="id" />
        </v-card>
      </v-col>

      <v-col v-if=is_gen_result() class="pa-0" :cols="1">
        <v-card tile flat class="fill-height">
          <slot name="compCWE" />
        </v-card>
      </v-col>

      <v-col v-if=is_stig_result() class="pa-0" :cols="1.2">
        <v-card tile flat class="fill-height">
          <slot name="compVulnID" />
        </v-card>
      </v-col>

      <v-col class="pa-0" :cols="0.5">
        <v-card tile flat class="fill-height">
          <slot name="severity" />
        </v-card>
      </v-col>

      <v-col class="pa-0" :cols="4">
        <v-card tile flat class="fill-height">
          <slot name="title" />
        </v-card>
      </v-col>

      <v-col class="pa-0" :cols="1.5">
        <v-card tile flat class="fill-height">
          <slot name="tags" />
        </v-card>
      </v-col>

      <v-col class="pa-0" :cols="1.3">
        <v-card tile flat class="fill-height">
          <slot name="compResultSource" />
        </v-card>
      </v-col>

      <v-col align="center" class="pa-0" :cols="0.8">
        <v-card tile flat class="fill-height text-center">
          <slot name="viewed" />
        </v-card>
      </v-col>
    </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Component
export default class ResponsiveRowLarge extends Vue {
  @Prop({ type: String, required: false, default: "general" }) assessment_type!: String;

  is_stig_result() {
    return this.assessment_type.toString() === 'stig';
  }

  is_gen_result() {
    return this.assessment_type === 'general';
  }
  is_vuln_result() {
    return this.assessment_type === 'vuln';
  }
}
</script>

<style scoped>
.v-card {
  background-color: rgba(0, 0, 0, 0);
}
</style>

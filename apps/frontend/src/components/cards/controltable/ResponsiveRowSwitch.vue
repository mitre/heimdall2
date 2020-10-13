<template>
  <v-row class="foreground">
    <v-col cols="12">
      <v-card color="grey darken-3" elevation="3">
        <ResponsiveRowSmall
          v-if="$vuetify.breakpoint.xsOnly"
          @toggle="$emit('toggle')"
        >
          <template #status>
            <slot name="status" />
          </template>
          <template #severity>
            <slot name="severity" />
          </template>
          <template #title>
            <slot name="title" />
          </template>
          <template #id>
            <slot name="id" />
          </template>
          <template #tags>
            <slot name="tags" />
          </template>
        </ResponsiveRowSmall>

        <ResponsiveRowMedium v-else-if="$vuetify.breakpoint.mdAndDown">
          <template #status>
            <slot name="status" />
          </template>
          <template #severity>
            <slot name="severity" />
          </template>
          <template #title>
            <slot name="title" />
          </template>
          <template #id>
            <slot name="id" />
          </template>
          <template #tags>
            <slot name="tags" />
          </template>
        </ResponsiveRowMedium>

        <ResponsiveRowLarge v-else>
          <template #status>
            <slot name="status" />
          </template>
          <template #severity>
            <slot name="severity" />
          </template>
          <template #title>
            <slot name="title" />
          </template>
          <template #id>
            <slot name="id" />
          </template>
          <template #tags>
            <slot name="tags" />
          </template>
        </ResponsiveRowLarge>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import ResponsiveRowLarge from '@/components/cards/controltable/ResponsiveRowLarge.vue';
import ResponsiveRowMedium from '@/components/cards/controltable/ResponsiveRowMedium.vue';
import ResponsiveRowSmall from '@/components/cards/controltable/ResponsiveRowSmall.vue';

const Props = Vue.extend({
  props: {
    statusColor: String
  }
});
@Component({
  components: {
    ResponsiveRowLarge,
    ResponsiveRowMedium,
    ResponsiveRowSmall
  }
})
export default class ControlRowHeader extends Props {}
</script>

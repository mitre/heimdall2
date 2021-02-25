<template>
  <v-dialog v-model="valueSync" max-width="550px">
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>

    <v-card>
      <v-card-title class="headline"
        >Are you sure you want to delete this {{ type }}?</v-card-title
      >
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click="$emit('cancel')"
          >Cancel</v-btn
        >
        <v-btn color="blue darken-1" text @click="$emit('confirm')">OK</v-btn>
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
  }
})
export default class DeleteDialog extends Vue {
  @Prop({required: true, type: String}) readonly type!: string;
  @Prop({required: true, type: Boolean}) readonly value!: boolean;

  // This passes through the v-model input to the child v-dialog and back up to
  // the parent component.
  get valueSync() {
    return this.value;
  }

  set valueSync(value: boolean) {
    this.$emit('input', value);
  }

}
</script>

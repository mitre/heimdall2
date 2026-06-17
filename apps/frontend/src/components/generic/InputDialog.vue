<template>
  <v-dialog
    v-model="showModal"
    max-width="550px"
  >
    <template #activator="{on, attrs}">
      <slot
        name="clickable"
        :on="on"
        :attrs="attrs"
      />
    </template>

    <v-card>
      <v-card-title
        class="headline"
        style="word-break: break-word"
      >
        {{
          title
        }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="value"
          :type="isPassword ? 'password' : 'text'"
          :label="textFieldLabel"
          @keyup="$emit('update-value', value)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
        <v-btn
          color="blue darken-1"
          data-cy="deleteConfirm"
          text
          @click="$emit('confirm')"
        >
          OK
        </v-btn>
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Component({})
export default class InputDialog extends Vue {
  @Prop({ default: 'delete', required: false, type: String })
  readonly action!: string;

  @Prop({ default: false, required: false, type: Boolean })
  readonly isPassword!: boolean;

  @Prop({ default: false, required: true, type: Boolean }) showModal!: boolean;
  @Prop({ required: true, type: String }) readonly textFieldLabel!: string;
  @Prop({ required: true, type: String }) readonly title!: string;

  value = '';
}
</script>

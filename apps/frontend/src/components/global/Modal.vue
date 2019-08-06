<template>
  <v-dialog
    v-model="dialog"
    @click:outside="$emit('modal-dismissed')"
    width="800px"
  >
    <v-card>
      <v-card-title class="grey darken-2">Create contact</v-card-title>
      <v-container grid-list-sm>
        <v-layout wrap>
          <v-flex xs12 align-center justify-space-between>
            <v-layout align-center>
              <v-avatar size="40px" class="mr-4">
                <img
                  src="//ssl.gstatic.com/s2/oz/images/sge/grey_silhouette.png"
                  alt
                />
              </v-avatar>
              <v-text-field placeholder="Name"></v-text-field>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-container>
      <v-card-actions>
        <v-btn text color="primary">More</v-btn>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="$emit('modal-dismissed')"
          >Cancel</v-btn
        >
        <v-btn text @click="$emit('modal-dismissed')">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const ModalProps = Vue.extend({
  props: {
    dialog: Boolean
  }
});

@Component({
  components: {}
})
export default class Modal extends ModalProps {}
</script>

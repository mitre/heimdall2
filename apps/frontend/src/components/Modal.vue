<template>
  <v-dialog v-model="dialog" width="800px">
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
          <v-flex xs6>
            <v-text-field
              prepend-icon="business"
              placeholder="Company"
            ></v-text-field>
          </v-flex>
          <v-flex xs6>
            <v-text-field placeholder="Job title"></v-text-field>
          </v-flex>
          <v-flex xs12>
            <v-text-field
              prepend-icon="mail"
              placeholder="Email"
            ></v-text-field>
          </v-flex>
          <v-flex xs12>
            <v-text-field
              type="tel"
              prepend-icon="phone"
              placeholder="(000) 000 - 0000"
            ></v-text-field>
          </v-flex>
          <v-flex xs12>
            <v-text-field
              prepend-icon="notes"
              placeholder="Notes"
            ></v-text-field>
          </v-flex>
        </v-layout>
      </v-container>
      <v-card-actions>
        <v-btn text color="primary">More</v-btn>
        <v-spacer></v-spacer>
        <v-btn text color="primary" @click="dialog = false">Cancel</v-btn>
        <v-btn text @click="dialog = false">Save</v-btn>
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
    text: String
  }
});

@Component({
  components: {}
})
export default class Modal extends ModalProps {}
</script>

<template>
  <v-stepper-content step="3">
    <div class="d-flex flex-column">
      <div class="d-flex justify-space-between">
        <v-text-field
          v-model="form_bucket_name"
          label="Bucket name"
          @keyup.enter="load"
        />
        <v-btn
          title="Load"
          @click="load"
          :disabled="form_bucket_name.length < 1"
          class="fill-height pa-0"
        >
          <v-icon>mdi-cloud-download</v-icon>
        </v-btn>
      </div>

      <v-list :two-line="true">
        <v-list-item v-if="files.length === 0"
          >No items found! Try different terms?</v-list-item
        >
        <v-list-item v-for="(val, index) in files" :key="val.Key">
          <v-list-item-content>
            <!-- Title: The item key -->
            <v-list-item-title>{{ val.Key }}</v-list-item-title>
            <!-- Subtitle: Date of creation -->
            <v-list-item-subtitle>
              {{ val.LastModified }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <!-- Action: Click to add -->
          <v-list-item-action>
            <v-btn icon @click="load_file(index)">
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-btn color="red" @click="$emit('exit-list')" class="my-2 mr-3">
        Cancel
      </v-btn>
    </div>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import S3 from 'aws-sdk/clients/s3';
import {InspecIntakeModule, next_free_file_ID} from '@/store/report_intake';
import {AWSError} from 'aws-sdk/lib/error';
import {Auth, fetch_s3_file} from '../../../../utilities/aws_util';
import {LocalStorageVal} from '../../../../utilities/helper_util';

const HEADERS: any = [
  {
    text: 'Filename',
    align: 'left',
    sortable: false,
    value: 'name'
  },
  {text: 'Last Modified', value: 'LastModified'},
  {text: 'Size', value: 'Size'}
];

/*
  export interface S3.Object {
    Key?: ObjectKey;
    LastModified?: LastModified;
    ETag?: ETag;
    Size?: Size;
    StorageClass?: ObjectStorageClass;
    Owner?: Owner;
  } */

// Caches the bucket name
const local_bucket_name = new LocalStorageVal<string>('aws_bucket_name');

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {
    auth: Object, // Can be null, but shouldn't be!
    files: Array, // List of S3 objects of current files
    error: String
  }
});

@Component({
  components: {}
})
export default class FileList extends Props {
  /** The name written in the form */
  form_bucket_name: string = '';

  /** Currently visible files */
  get _files(): S3.Object[] {
    return this.files as S3.Object[];
  }

  /** Typed getter for auth */
  get _auth(): Auth {
    if (this.auth === null) {
      throw new Error("We aren't auth'd");
    }
    return this.auth as Auth;
  }

  /** On mount, try to look up stored auth info */
  /** Callback for when user selects a file.
   * Loads it into our system.
   */
  async load_file(index: number): Promise<void> {
    // Get it out of the list
    let file = this._files[index];

    // Generate file id for it, and prep module for load
    let unique_id = next_free_file_ID();

    // Fetch it from s3, and promise to submit it to be loaded afterwards
    await fetch_s3_file(this._auth.creds, file.Key!, this.form_bucket_name)
      .then(content => {
        return InspecIntakeModule.loadText({
          text: content,
          filename: file.Key!,
          unique_id
        });
      })
      .then(() => this.$emit('got-files', [unique_id]))
      .catch((failure: any) => this.handle_error(failure));
  }

  /** Recalls the last entered bucket name.  */
  mounted() {
    this.form_bucket_name = local_bucket_name.get_default('');
  }

  /** Handles when load button clicked */
  load() {
    local_bucket_name.set(this.form_bucket_name);
    this.$emit('load-bucket', this.form_bucket_name);
  }

  /** Callback to handle an AWS error.
   * Sets shown error.
   */
  handle_error(error: any): void {
    let t_error = error as AWSError;
    console.error('We should re-emit this in an appropriate place');
  }
}
</script>

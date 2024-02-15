<template>
  <Modal :visible="visible"
    :persistent="persistent"
    @close-modal="$emit('close-modal')">
    <v-card>
      <v-card-title>Download Authorization Artifacts</v-card-title>
      <v-data-table v-model="files" class="pb-8" dense
        :headers="headers" :items="getFiles" :loading="loading"
        :item-key="fileKey" mobile-breakpoint="0">
        <template #[`item.Key`]="{item}">
          <span class="cursor-pointer" @click="downloadFile(item)">{{ formatKey(item.Key) }}</span>
        </template>
        <template #[`item.Size`]="{item}">
          <span class="cursor-pointer" @click="downloadFile(item)">{{ formatSize(item.Size) }}</span>
        </template>
        <template #[`item.LastModified`]="{item}">
          <span class="cursor-pointer" @click="downloadFile(item)">{{ formatDate(item.LastModified) }}</span>
        </template>
        <template #[`item.Download`]="{item}">
          <v-btn title="download" class="fill-height pa-0" @click="downloadFile(item)"><v-icon>mdi-cloud-download</v-icon></v-btn>
        </template>
      </v-data-table>
      <v-divider />
      <v-card-actions>
        <v-btn color="primary" text @click="$emit('close-modal')">
          Close Window
        </v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import Vue from 'vue';
import Component from 'vue-class-component';
import {ProductModuleState} from '@/store/product_module_state';
import {Prop} from 'vue-property-decorator';
import {s3DownloadFile} from '@/utilities/aws_util';
import S3 from 'aws-sdk/clients/s3';

@Component({
  components: {
    Modal
  }
})
export default class DownloadAuthorizationArtifactModal extends Vue {
  @Prop({default: true}) readonly visible!: boolean;
  @Prop({default: false}) readonly persistent!: boolean;
  @Prop({type: Boolean, default: false}) readonly loading!: boolean;
  @Prop({required: true}) headers!: Object[]; 
  @Prop({required: true}) files!: S3.Object[];
  @Prop({type: String, default: 'Key'}) readonly fileKey!: string;

  get getFiles() {
    return this.files;
  }

  formatKey(val: any) {
    let file_name: string = val.replace(ProductModuleState.s3Prefix, '');
    if (file_name.includes('pasm-boe-artifact')) {
      let last_sep: number = file_name.lastIndexOf('-') + 1
      return file_name.substring(last_sep) + " (" + file_name + ")";
    }
    return file_name;
  }
  
  formatSize(val: number) {
    let file_size: number = val / 1024;
    if (file_size < 1024) {
      return file_size.toFixed(3).toString() + " KB";  
    }
    file_size /= 1024;
    return file_size.toFixed(3).toString() + " MB";
  }

  formatDate(val: any) {
    let new_date: Date = new Date(val);
    return new_date.toLocaleString();
  }
  
  downloadFile(item: S3.Object) {
    let key = item.Key ? item.Key : "";
    s3DownloadFile(key);
  }
}
</script>

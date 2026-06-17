<template>
  <div>
    <v-row
      dense
      @click="expanded = !expanded"
    >
      <!-- Control ID -->
      <v-col
        cols="3"
        xs="3"
        sm="2"
        md="1"
        class="pt-0"
      >
        <div style="text-align: center; padding: 19px">
          {{ controlId }}
        </div>
      </v-col>
      <v-col
        v-for="fileId in fileIds"
        :key="fileId"
        cols="4"
        md="5"
        filter
      >
        <v-btn
          v-if="controls[fileId]"
          width="100%"
          :color="`status${status_class_for(controls[fileId])}`"
          :depressed="expanded"
          :outlined="expanded"
          centered
        >
          {{ hdf_for_control(controls[fileId]).status }}
        </v-btn>
      </v-col>
    </v-row>
    <div
      v-if="expanded"
      dense
    >
      <v-row dense>
        <v-col
          key="delta"
          cols="12"
        >
          <DeltaView :delta="delta" />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col
          cols="3"
          sm="2"
          md="1"
        />
        <v-col
          v-for="fileId in fileIds"
          :key="fileId"
          cols="4"
          md="5"
        >
          <ControlRowDetails
            v-if="controls[fileId]"
            :tab.sync="tab"
            :control="controls[fileId]"
          />
        </v-col>
      </v-row>
    </div>
    <v-divider dark />
  </div>
</template>

<script lang="ts">
import type { ContextualizedControl, HDFControl } from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DeltaView from '@/components/cards/comparison/DeltaView.vue';
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import type { FileID } from '@/store/report_intake';
import type { ControlSeries } from '@/utilities/delta_util';
import { ControlDelta } from '@/utilities/delta_util';

@Component({
  components: {
    ControlRowDetails,
    DeltaView,
  },
})
export default class CompareRow extends Vue {
  @Prop({ required: true, type: String }) readonly controlId!: string;
  @Prop({ required: true, type: Object }) readonly controls!: ControlSeries;
  expanded = false;

  @Prop({ required: true, type: Array }) readonly fileIds!: FileID[];
  tab = 'tab-test';

  /** Extracts relevant controls for currently visible fileIds and passes those to ControlDelta */
  get delta(): ControlDelta | null {
    const deltaData: ContextualizedControl[] = [];
    for (const [fileId, controls] of Object.entries(this.controls)) {
      if (this.fileIds.includes(fileId)) {
        deltaData.push(controls);
      }
    }
    return new ControlDelta(deltaData);
  }

  hdf_for_control(control: ControlSeries): HDFControl | undefined {
    return control?.root?.hdf || undefined;
  }

  status_class_for(control: ControlSeries | undefined): string {
    if (control !== undefined) {
      const hdfControl = this.hdf_for_control(control);
      if (hdfControl !== undefined) {
        return hdfControl.status.replace(' ', '');
      }
    }
    return '';
  }
}
</script>

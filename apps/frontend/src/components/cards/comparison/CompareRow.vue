<template>
  <div>
    <v-row dense @click="expanded = !expanded">
      <!-- Control ID -->
      <v-col cols="3" xs="3" sm="2" md="1" class="pt-0">
        <div style="text-align: center; padding: 19px">
          {{ controlId }}
        </div>
      </v-col>
      <v-col v-for="fileId in fileIds" :key="fileId" cols="4" md="5" filter>
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
    <div v-if="expanded" dense>
      <v-row dense>
        <v-col key="delta" cols="12">
          <DeltaView :delta="delta" />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="3" sm="2" md="1" />
        <v-col v-for="fileId in fileIds" :key="fileId" cols="4" md="5">
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
import Vue from 'vue';
import Component from 'vue-class-component';
import {context} from 'inspecjs';
import {HDFControl} from 'inspecjs';
import {ControlDelta, ControlSeries} from '@/utilities/delta_util';
import DeltaView from '@/components/cards/comparison/DeltaView.vue';
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import {Prop} from 'vue-property-decorator';
import {FileID} from '@/store/report_intake';

@Component({
  components: {
    DeltaView,
    ControlRowDetails
  }
})
export default class CompareRow extends Vue {
  @Prop({type: String, required: true}) readonly controlId!: string;
  @Prop({type: Array, required: true}) readonly fileIds!: FileID[];
  @Prop({type: Object, required: true}) readonly controls!: ControlSeries;

  expanded = false;
  tab = 'tab-test';

  status_class_for(control: ControlSeries | undefined): string {
    if (control !== undefined) {
      const hdfControl = this.hdf_for_control(control);
      if (hdfControl !== undefined) {
        return hdfControl.status.replace(
            ' ',
            ''
          )
      }
    }
    return '';
  }

  hdf_for_control(control: ControlSeries): HDFControl | undefined {
    return control?.root?.hdf || undefined;
  }

  /** Extracts relevant controls for currently visible fileIds and passes those to ControlDelta */
  get delta(): ControlDelta | null {
    const deltaData: context.ContextualizedControl[] = [];
    Object.entries(this.controls).forEach(([fileId, controls]) => {
      if(this.fileIds.includes(fileId)) {
        deltaData.push(controls);
      }
    });
    return new ControlDelta(deltaData);
  }
}
</script>

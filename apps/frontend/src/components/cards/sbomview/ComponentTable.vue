<template>
  <v-container fluid class="font-weight-bold">
    <div
      ref="componentTableTitle"
      :class="
        $vuetify.breakpoint.smAndDown
          ? 'component-table-title'
          : 'pinned-header component-table-title'
      "
    >
    </div>

    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="items"
          :headers="headers"
          :items-per-page="-1"
          :item-key="'bom-ref'"
          show-expand
          single-expand
          hide-default-footer
        >
        <!--The single expand is to hide the tabs syncing together when multiple components are open-->
          <template #top>
            <v-card-title class="pb-0">Component View Data</v-card-title>
          </template>
          <template #expanded-item="{headers, item}">
          <td class="m-10 p-10" :colspan="headers.length">
            <v-tabs v-model="tabs">
              <v-tab>General Properties</v-tab>
              <v-tab>References</v-tab>
              <v-tab>Licenses</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tabs">
              <!--General Properties Tab-->
              <v-tab-item>
                <v-simple-table dense>
                  <template #default>
                    <thead>
                      <tr>
                        <th>Property</th><th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="key in stringFields" :colspan="headers.length">
                        <td v-if="key in item">{{ key }}</td>
                        <td v-if="key in item">{{ item[key] }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-tab-item>

              <!--References Tab-->
              <v-tab-item>
                <v-simple-table dense>
                  <template #default>
                    <thead>
                      <tr>
                        <th>Property</th><th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="reference in item.externalReferences" :colspan="headers.length">
                        <td>{{ reference.type }}</td>
                        <td><a :href="reference.url" target="_blank">{{ reference.url }}</a></td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </v-tab-item>

              <!--Licenses Tab-->
              <v-tab-item>
                <span v-for="license in item.licenses">
                  <v-simple-table dense>
                    <template #default>
                      <thead>
                        <tr>
                          <th>Property</th><th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(value, key) in license.license" :colspan="headers.length">
                          <td v-if="typeof(value) === 'string'">{{ key }}</td>
                          <td v-if="typeof(value) === 'string'">{{  value }}</td>
                        </tr>
                      </tbody>
                    </template>
                </v-simple-table>
                </span>
              </v-tab-item>
            </v-tabs-items>
          </td>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Filter, FilteredDataModule} from '@/store/data_filters';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref} from 'vue-property-decorator';

interface SBOMComponent {
  name: string;
  version: string;
  dependents: number;
  id: string;
  author: string;
}

interface Passthrough {
  auxiliary_data: {
    name: string;
    data: {
      components: SBOMComponent[];
    };
  }[];
}

@Component({
  components: {
  }
})
export default class ComponentTable extends Vue {
  @Ref('controlTableTitle') readonly controlTableTitle!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  
  headers = [
    {
      text: 'Component Name',
      value: 'name'
    },
    {
      text: 'Version',
      value: 'version'
    },
    {
      text: 'Group',
      value: 'group'
    },
    {
      text: 'BOM Ref',
      value: 'bom-ref'
    },
    {
      text: 'Type',
      value: 'type'
    },
    {
      text: 'Author',
      value: 'author'
    },
    {
      text: 'Description',
      value: 'description'
    }
  ];

  tabs = {
    tab: null,
    items: [
      'strings', 'provenance', 'references', 'etc'
    ]
  }

  stringFields = [
    'type',
    'mime-type',
    'publisher',
    'group',
    'name',
    'version',
    'description',
    'scope',
    'copyright',
    'cpe',
    'purl'
  ]

  get items(): any[] {
    const evaluations = FilteredDataModule.evaluations(
      FilteredDataModule.selectedEvaluationIds
    );
    const aux_datas: Passthrough['auxiliary_data'][] = evaluations.map((e) =>
      _.get(e, 'data.passthrough.auxiliary_data', [])
    );
    let sboms: SBOMComponent[] = [];
    for (const auxes of aux_datas) {
      for (const a of auxes) {
        if (_.matchesProperty('name', 'SBOM')(a)) {
          sboms = sboms.concat(_.get(a, 'data.components', []));
        }
      }
    }
    return sboms;
  }
}
</script>

<style scoped>
.pinned-header {
  position: sticky;
  z-index: 2;
  padding-top: 2px;
  padding-bottom: 2px;
}

.control-table-title {
  background-color: var(--v-secondary-lighten1);
  z-index: 10;
}
</style>

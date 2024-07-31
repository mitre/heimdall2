<template>
  <v-container fluid class="font-weight-bold">
    <div
      ref="componentTableTitle"
      :class="
        $vuetify.breakpoint.smAndDown
          ? 'components-table-title'
          : 'pinned-header components-table-title'
      "
    />

    <!-- Body -->
    <v-row>
      <v-col>
        <v-data-table
          :items="components"
          :headers="headers"
          :items-per-page="-1"
          :item-key="'bom-ref'"
          :search="search"
          :expanded.sync="expanded"
          show-expand
          single-expand
          hide-default-footer
        >
          <!--The single expand is to hide the tabs syncing together when multiple components are open-->
          <template #top>
            <v-card-title class="pb-0"
              >Component View Data
              <v-spacer />
              <v-text-field v-model="search" label="Search" class="mx-4" />
              <v-autocomplete
                v-model="headerColumns"
                chips
                multiple
                :items="headerOptions"
              />

              <!--             
            <v-menu offset-y offset-overflow :close-on-content-click="false">
              <template #activator=" {on, attrs }">
                <v-icon v-on.click="on">
                  mdi-cog-outline
                </v-icon>
              </template>
                  <v-autocomplete chips multiple v-modal.items="headerOptions"></v-autocomplete>
            </v-menu> 
          -->
            </v-card-title>
          </template>

          <template #[`item.name`]="{item}">
            {{ item.name }}
            <template v-if="componentRef == item['bom-ref']">
              <a id="scroll-to" />
            </template>
          </template>

          <template #[`item.affectingVulnerabilities`]="{item}">
            <v-chip-group
              v-for="vuln in affectingVulns.get(item['bom-ref'])"
              :key="vuln.data.id"
            >
              <v-tooltip max-width="400" left>
                <template #activator="{on}">
                  <span v-on="on">
                    <v-chip
                      outlined
                      small
                      :color="severity_color(vuln.hdf.severity)"
                      >{{ vuln.data.id }}</v-chip
                    >
                  </span>
                </template>
                <template style="word-break: break-word">
                  {{ vuln.data.title?.substring(0, 100) }}
                  <template v-if="vuln.data.title?.length || 0 > 100"
                    >...</template
                  >
                  <br />
                  <b>click to view more details</b>
                </template>
              </v-tooltip>
            </v-chip-group>
          </template>

          <template #expanded-item="{headers, item}">
            <td class="m-10 p-10" :colspan="headers.length">
              <v-tabs v-model="tabs">
                <v-tab>General Properties</v-tab>
                <v-tab>References</v-tab>
                <v-tab>Licenses</v-tab>
                <v-tab>Example</v-tab>
              </v-tabs>
              <v-tabs-items v-model="tabs">
                <!--General Properties Tab-->
                <v-tab-item>
                  <v-simple-table dense>
                    <template #default>
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="field in headerOptions"
                          :key="field"
                          :colspan="headers.length"
                        >
                          <td v-if="field in item">{{ field }}</td>
                          <td v-if="field in item">{{ item[field] }}</td>
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
                          <th>Property</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="reference in item.externalReferences"
                          :key="reference.type"
                          :colspan="headers.length"
                        >
                          <td>{{ reference.type }}</td>
                          <td>
                            <a :href="reference.url" target="_blank">{{
                              reference.url
                            }}</a>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>
                </v-tab-item>

                <!--Licenses Tab-->
                <v-tab-item>
                  <span v-for="license in item.licenses" :key="license.license">
                    <v-simple-table dense>
                      <template #default>
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(value, key) in license.license"
                            :key="key"
                            :colspan="headers.length"
                          >
                            <td v-if="typeof value === 'string'">{{ key }}</td>
                            <td v-if="typeof value === 'string'">
                              {{ value }}
                            </td>
                          </tr>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </span>
                </v-tab-item>

                <!-- Example Tab -->
                <v-tab-item>
                  <v-simple-table dense>
                    <template #default>
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr :colspan="headers.length">
                          <td>Example</td>
                          <td>Example</td>
                        </tr>
                        <tr :colspan="headers.length">
                          <td>Example</td>
                          <td>Example</td>
                        </tr>
                        <tr :colspan="headers.length">
                          <td>Example</td>
                          <td>Example</td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>
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
import {Result} from '@mitre/hdf-converters/src/utils/result';
import {ContextualizedControl} from 'inspecjs';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref} from 'vue-property-decorator';

interface SBOMComponent {
  // TODO: UPDATE ME!!!!
  type: string;
  'mime-type'?: string;
  'bom-ref'?: string;
  supplier?: Record<string, unknown>;
  manufacturer?: Record<string, unknown>;
  authors?: Record<string, unknown>[];
  author?: string;
  publisher?: string;
  group?: string;
  name: string;
  version?: string;
  description?: string;
  scope?: string;
  hashes?: Record<string, unknown>[];
  licenses?: Record<string, unknown>[];
  copyright?: string;
  cpe?: string;
  purl?: string;
  omniborId?: string[];
  swhid?: string[];
  swid?: Record<string, unknown>[];
  modified?: boolean; // deprecated
  pedigree?: Record<string, unknown>;
  externalReferences?: Record<string, unknown>[];
  components?: SBOMComponent[];
  evidence?: Record<string, unknown>;
  releaseNotes?: Record<string, unknown>;
  modelCard?: Record<string, unknown>;
  data?: Record<string, unknown>[];
  cryptoProperties?: Record<string, unknown>;
  properties?: Record<string, unknown>[];
  tags?: string[];
  signature?: Record<string, unknown>[];

  // custom
  affectingVulnerabilities: string[]; // an array of bom-refs
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
  components: {}
})
export default class ComponentTable extends Vue {
  @Ref('controlTableTitle') readonly controlTableTitle!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  @Prop({required: true}) readonly componentRef!: string | undefined;

  headerColumns = [
    'name',
    'version',
    'author',
    'group',
    'type',
    'description',
    'affectingVulnerabilities'
  ];

  tabs = {tab: null};

  search = '';
  expanded: SBOMComponent[] = [];

  headerOptions = [
    'type',
    'mime-type',
    'publisher',
    'group',
    'bom-ref',
    'name',
    'version',
    'description',
    'scope',
    'copyright',
    'cpe',
    'purl',
    'affectingVulnerabilities'
  ];

  mounted() {
    this.$nextTick(() => {
      if (!this.componentRef) return;
      const element = document.getElementById('scroll-to');
      if (element) {
        element.scrollIntoView({block: 'start', behavior: 'smooth'});
        element.parentElement?.parentElement?.classList.add('highlight');
        const item = this.components.find(
          (i) => i['bom-ref'] === this.componentRef
        );
        if (item) {
          this.expanded = [item];
        }
      }
    });
  }

  get headers() {
    let h = this.headerColumns.map((v) => {
      return {value: v, text: _.startCase(v)};
    });
    h.push({value: 'data-table-expand', text: 'More'});
    return h;
  }

  get components(): SBOMComponent[] {
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
          sboms = sboms.concat(_.get(a, 'components', []));
        }
      }
    }
    return sboms;
  }

  get all_filter(): Filter {
    return {
      fromFile: FilteredDataModule.selectedEvaluationIds
    };
  }

  get affectingVulns(): Map<string, ContextualizedControl[]> {
    let vulnMap: Map<string, ContextualizedControl[]> = new Map();
    for (const c of this.components) {
      // get the component's affecting vulnerabilities
      const componentVulns = [];
      for (const vulnBomRef of c.affectingVulnerabilities || []) {
        let result = this.getVulns(vulnBomRef);
        if (result.ok) componentVulns.push(result.value); // TODO: show components with unloaded vulns as errors?
      }
      // associate component bom-ref with vuln info
      if (c['bom-ref']) vulnMap.set(c['bom-ref'], componentVulns);
    }
    return vulnMap;
  }

  getVulns(vulnBomRef: string): Result<ContextualizedControl, null> {
    const vuln = FilteredDataModule.controls(this.all_filter).find((c) => {
      // regex to get the value of bom-ref from the vuln code stored as JSON
      let match = c.full_code.match(/"bom-ref": "(?<ref>.*?)"/);
      return match ? match.groups?.ref === vulnBomRef : false;
    });
    if (vuln) return {ok: true, value: vuln};
    return {ok: false, error: null};
  }

  severity_color(severity: string): string {
    return `severity${_.startCase(severity)}`;
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

.components-table-title {
  background-color: var(--v-secondary-lighten1);
  z-index: 10;
}

.highlight {
  border: 2px solid yellow;
}

/*.v-data-table > .v-data-table__wrapper > table {
  border-collapse: collapse;
}*/

::v-deep .v-data-table__expanded {
  border-left: 5px solid var(--v-primary-base);
}

::v-deep .v-data-table__expanded__row {
  background-color: #616161;
}

::v-deep .v-data-table__wrapper table {
  border-collapse: collapse;
}
</style>

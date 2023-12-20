<template>
  <v-row no-gutters dense class="pb-1">
    <v-col cols="12" class="font-weight-bold">
      <v-card>
        <v-tabs v-model="localTab" fixed-tabs show-arrows @change="tab_change">
          <!-- Declare our tabs -->
          <v-tab href="#tab-test"> Test </v-tab>
          <v-tab href="#tab-details"> Details </v-tab>
          <v-tab href="#tab-code"> Code </v-tab>

          <v-tab-item value="tab-test">
            <div class="pa-4">
              <div
                v-if="
                  caveat ||
                  justification ||
                  rationale ||
                  comments ||
                  errorMessage
                "
              >
                <div v-if="errorMessage" class="mb-2">
                  <v-btn
                    class="unclickable-button mr-3"
                    elevation="2"
                    depressed
                  >
                    Error
                  </v-btn>
                  <span>
                    {{ errorMessage }}
                    <br />
                  </span>
                </div>
                <span v-if="caveat">Caveat: {{ caveat }}<br /></span>
                <span v-if="justification"
                  >Justification: {{ justification }}<br
                /></span>

                <span v-if="rationale">Rationale: {{ rationale }}<br /></span>
                <span v-if="comments">Comments: {{ comments }}<br /></span>
                <v-divider />
                <br />
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="sanitize_html(main_desc)" />
            </div>
            <ControlRowCol
              v-for="(result, index) in control.root.hdf.segments"
              :key="'col' + index"
              :class="zebra(index)"
              :result="result"
              :status-code="result.status"
            />
          </v-tab-item>

          <v-tab-item value="tab-details">
            <v-container fluid>
              <!-- Create a row for each detail -->
              <template v-for="(detail, index) in details">
                <v-row :key="'tab' + index" :class="zebra(index)">
                  <v-col cols="12" :class="detail.class">
                    <h3>{{ detail.name }}:</h3>
                    <h4>
                      <!-- eslint-disable vue/no-v-html -->
                      <pre class="mono" v-html="sanitize_html(detail.value)" />
                      <!-- eslint-enable vue/no-v-html -->
                    </h4>
                  </v-col>
                  <v-divider />
                </v-row>
              </template>
            </v-container>
          </v-tab-item>

          <v-tab-item value="tab-code">
            <v-container fluid>
              <v-row>
                <v-col cols="12">
                  <prism :language="language">{{ control.full_code }}</prism>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import ControlRowCol from '@/components/cards/controltable/ControlRowCol.vue';
import HtmlSanitizeMixin from '@/mixins/HtmlSanitizeMixin';
import {ContextualizedControl} from 'inspecjs';
import * as _ from 'lodash';
//TODO: add line numbers
import 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-makefile.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/themes/prism-tomorrow.css';
import Component, {mixins} from 'vue-class-component';
//@ts-ignore
import Prism from 'vue-prism-component';
import {Prop, Watch} from 'vue-property-decorator';

interface Detail {
  name: string;
  value: string;
  class?: string;
}

@Component({
  components: {
    ControlRowCol,
    Prism
  }
})
export default class ControlRowDetails extends mixins(HtmlSanitizeMixin) {
  @Prop({type: String, default: 'tab-test'}) readonly tab!: string;
  @Prop({type: Object, required: true})
  readonly control!: ContextualizedControl;

  localTab = this.tab;

  @Watch('tab')
  onTabChanged(newTab?: string, _oldVal?: string) {
    if (newTab) {
      this.localTab = newTab;
    }
  }

  get cciControlString(): string | null {
    const cci = this.control.hdf.wraps.tags.cci;
    if (!cci) {
      return null;
    } else if (Array.isArray(cci)) {
      return cci.join(', ');
    } else {
      return cci;
    }
  }

  get main_desc(): string {
    if (this.control.data.desc) {
      return this.control.data.desc.trim();
    } else {
      return 'No description';
    }
  }

  get language(): string {
    try {
      JSON.parse(this.control.data.code || '');
      return 'json';
    } catch {
      return 'ruby';
    }
  }

  tab_change(tab: string) {
    this.$emit('update:tab', tab);
  }

  /** Shown above the description */
  get header(): string {
    const msgSplit = this.control.root.hdf.finding_details.split(':');
    if (msgSplit.length === 1) {
      return msgSplit[0] + '.';
    } else {
      return msgSplit[0] + ':';
    }
  }

  get caveat(): string | undefined {
    return this.control.hdf.descriptions.caveat;
  }

  get rationale(): string | undefined {
    return this.control.hdf.descriptions.rationale;
  }

  get justification(): string | undefined {
    return this.control.hdf.descriptions.justification;
  }

  get comments(): string | undefined {
    return this.control.hdf.descriptions.comments;
  }

  get errorMessage(): string {
    return this.control.hdf.segments?.length == 0
      ? "The control didn't return any results.  Check with the author of the profile to ensure the code is correct."
      : '';
  }

  get details(): Detail[] {
    const detailsMap = new Map();

    detailsMap.set('Control', this.control.data.id);
    detailsMap.set('Title', this.control.data.title);
    detailsMap.set('Caveat', this.control.hdf.descriptions.caveat);
    detailsMap.set('Desc', this.control.data.desc);
    detailsMap.set('Rationale', this.control.hdf.descriptions.rationale);
    detailsMap.set('Severity', this.control.root.hdf.severity);
    detailsMap.set('Impact', this.control.data.impact);
    detailsMap.set('NIST Controls', this.control.hdf.rawNistTags.join(', '));
    detailsMap.set('CCI Controls', this.cciControlString);
    detailsMap.set(
      'Check',
      this.control.hdf.descriptions.check || this.control.data.tags.check
    );
    detailsMap.set(
      'Fix',
      this.control.hdf.descriptions.fix || this.control.data.tags.fix
    );
    detailsMap.set('CWE ID', _.get(this.control, 'hdf.wraps.tags.cweid'));

    const sparseControl = _.omit(this.control, [
      'data.tags.nist',
      'data.tags.cci',
      'data.tags.cwe'
    ]);

    // Convert all tags to Details
    Object.entries(sparseControl.data?.tags || {}).forEach(([key, value]) => {
      if (!detailsMap.has(_.startCase(key))) {
        // Make sure all values are strings
        if (Array.isArray(value)) {
          detailsMap.set(_.startCase(key), value.join(', '));
        } else if (typeof value === 'object') {
          detailsMap.set(_.startCase(key), JSON.stringify(value));
        } else {
          detailsMap.set(_.startCase(key), String(value));
        }
      }
    });

    for (const prop in this.control.hdf.descriptions) {
      if (!detailsMap.has(_.capitalize(prop))) {
        detailsMap.set(_.startCase(prop), this.control.hdf.descriptions[prop]);
      }
    }
    return Array.from(detailsMap, ([name, value]) => ({name, value})).filter(
      (v) => v.value
    );
  }

  //for zebra background
  zebra(ix: number): string {
    if (ix % 2 === 0) {
      return 'zebra-table';
    }
    return 'non-zebra-table';
  }
}
</script>

<style lang="scss" scoped>
@import '@/sass/control-row-format.scss';

.clickable {
  cursor: pointer;
}

button.unclickable-button {
  pointer-events: none;
}

.v-application {
  code.language-ruby {
    border: none;
    box-shadow: none;
  }
}

pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}
.theme--dark .zebra-table {
  background-color: var(--v-secondary-lighten2);
  max-width: 99.9%;
  margin: auto;
}

.theme--dark .non-zebra-table {
  max-width: 99.9%;
  margin: auto;
}

.code-card {
  height: inherit;
  margin: inherit;
  white-space: auto;
}
.wset {
  min-width: 125px;
  justify-content: center;
}

.right {
  margin-left: -1px;
}
</style>

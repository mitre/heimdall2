<template>
  <div>
    <v-tabs v-model="tabs" show-arrows>
      <v-tab v-for="tab in computedTabs" :key="tab.name">{{ tab.name }}</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tabs">
      <v-tab-item v-for="tab in computedTabs" :key="tab.name">
        <!-- Viewing lists of simple objects -->
        <template v-if="tab.tableData">
          <v-simple-table dense>
            <template #default>
              <thead>
                <tr>
                  <td v-for="col in tab.tableData.columns" :key="col">
                    {{ col }}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in tab.tableData.rows" :key="i">
                  <td v-for="(value, j) in row" :key="value">
                    <!-- Check if the column represents an alternate references
                    regex tests for if "url" is present as a single word -->
                    <template v-if="(/\burl\b/i).test(tab.tableData.columns[j])">
                      <a :href="value" target="_blank">{{ value }}</a>
                    </template>
                    <!-- Render link in table to navigate back to results table view -->
                    <template
                      v-else-if="
                        tab.tableData.columns[j] === 'Vulnerability Id'
                      "
                    >
                      <router-link
                        outlined
                        small
                        :to="{name: 'results', query: {id: value}}"
                      >
                        {{ value }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{ value }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </template>

        <!-- Viewing Nested Structures -->
        <v-treeview v-if="tab.treeData" open-all :items="tab.treeData" />

        <!-- Viewing a list of this component's direct dependencies -->
        <v-simple-table v-if="tab.relatedComponents" dense>
          <template #default>
            <thead>
              <tr>
                <td>Name</td>
                <td>Description</td>
                <td>
                  <v-chip
                    small
                    outlined
                    @click="
                      $emit(
                        'show-components-in-table',
                        tab.relatedComponents.map((c) => c['bom-ref'])
                      )
                    "
                  >
                    View All {{ tab.relatedComponents.length }}
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    small
                    outlined
                    @click="
                      $emit(
                        'show-components-in-tree',
                        tab.relatedComponents.map((c) => c['bom-ref'])
                      )
                    "
                  >
                    View All {{ tab.relatedComponents.length }}
                  </v-chip>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(component, i) in tab.relatedComponents" :key="i">
                <td>{{ component.name }}</td>
                <td>{{ component.description }}</td>
                <td>
                  <v-chip
                    small
                    outlined
                    @click="
                      $emit('show-components-in-table', [component['bom-ref']])
                    "
                  >
                    Go to Component Table
                  </v-chip>
                </td>
                <td>
                  <v-chip
                    small
                    outlined
                    @click="
                      $emit('show-components-in-tree', [component['bom-ref']])
                    "
                  >
                    Go to Dependency Tree
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import _ from 'lodash';
import {ContextualizedControl} from 'inspecjs';
import {parseJson} from '@mitre/hdf-converters/src/utils/parseJson';
import {
  ContextualizedSBOMComponent,
  SBOMMetadata,
  SBOMProperty
} from '@/utilities/sbom_util';

interface Tab {
  name: string;
  tableData?: TableData;
  treeData?: Treeview[];
  relatedComponents?: ContextualizedSBOMComponent[];
}

type TableData = {columns: string[]; rows: string[][]};

interface Treeview {
  name?: string;
  children?: Treeview[];
  id: number;
}

/**
 * @param obj The object being converted to fit in a v-treeview.
 * @param id The next id to be used. If unique items are not given,
 * treeview items will fail to open on mount properly.
 */
function objectToTreeview(obj: Object, id: number): Treeview[] {
  const view: Treeview[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Object) {
      const children = objectToTreeview(value, id); // recursively generate the data structure
      const last = children.at(-1); // find the next unused id
      if (last) id = last.id + 1;
      view.push({name: key, children, id});
    } else {
      view.push({name: `${key}: ${value}`, id});
    }
    id += 1;
  }
  return view;
}

/**
 * Recursive function to compute the depth of an object.
 * Used for computing how to display an arbitrary object structure
 * @param obj The object to count the depth of
 * @param n A counter to track recursive depth
 */
function objectDepth(obj: Object, n: number): number {
  let max = n;
  for (const value of Object.values(obj)) {
    if (value instanceof Object) {
      const current = objectDepth(value, n + 1);
      if (current > max) max = current;
    }
  }
  return max;
}

function jsonToTabFormat(value: Object): Omit<Tab, 'name'> {
  // `value` is a list of primitives (strings, numbers, booleans, etc.)
  const isArray = Array.isArray(value);
  const depth = objectDepth(value, 1);
  if (isArray && depth === 1) {
    return {
      tableData: {
        columns: ['Elements'],
        rows: value.map((v) => [v])
      }
    };
  }

  // `value` is a list of simple objects (each of depth 1)
  if (isArray && depth === 2) {
    // get the complete set of properties amongst the items in `value`
    const columns = _.uniq(value.flatMap(Object.keys));
    return {
      tableData: {
        columns: columns.map(_.startCase),
        // convert each element in `value` to a list
        // corresponding to each property in `columns`
        rows: value.map((v) => columns.map((c) => v[c]))
      }
    };
  }

  // data is nested too much to display in a single table
  return {
    treeData: objectToTreeview(value, 0)
  };
}

/** A list of tabs that don't need to be auto-generated */
const customRender = [
  'affectingVulnerabilities',
  'properties',
  'externalReferences',
  'component',
  'parents',
  'children',
  'key'
];

/**
 * Generates a list of tabs to represent the given object
 */
function generateTabs(
  object: ContextualizedSBOMComponent | SBOMMetadata,
  prefix: string = ''
): Tab[] {
  const tabs: Tab[] = [];

  // This is a tab that contain the string fields on `object`
  const generalProps: Tab = {
    name: `${prefix}General Properties`,
    tableData: {
      columns: ['Property', 'Value'],
      rows: []
    }
  };

  for (const [key, value] of Object.entries(object)) {
    if (customRender.includes(key)) continue;
    if (value instanceof Object) {
      tabs.push({
        name: `${prefix}${_.startCase(key)}`,
        ...jsonToTabFormat(value)
      });
    } else {
      // value is a primitive
      generalProps.tableData!.rows.push([_.startCase(key), value]);
    }
  }
  if (generalProps.tableData!.rows.length > 0) {
    tabs.unshift(generalProps);
  }

  const externalReferences = _.get(object, 'externalReferences');
  if (externalReferences) {
    tabs.push({
      name: `${prefix}${' External References'}`,
      ...jsonToTabFormat(
        externalReferences.map((reference) => _.omit(reference, 'hashes'))
      )
    });
  }

  // These are properties on `object` used to include arbitrary data from external tools
  if (object.properties)
    tabs.push(...generateTabsFromProperties(object.properties, prefix));
  return tabs;
}

/**
 * Converts a list of properties (https://cyclonedx.org/docs/1.6/json/#components_items_properties)
 * to a single tab for basic strings and other tabs to display stringified JSON
 */
function generateTabsFromProperties(
  properties: SBOMProperty[],
  prefix: string = ''
): Tab[] {
  const propsTab: Tab = {
    name: `${prefix}External Properties`,
    tableData: {
      columns: ['Property', 'Value'],
      rows: []
    }
  };
  const tabs: Tab[] = [];
  for (const property of properties) {
    const json = parseJson(property.value);
    if (json.ok && json.value instanceof Object) {
      tabs.push({
        name: `${prefix}${_.startCase(property.name)}`,
        ...jsonToTabFormat(json.value)
      });
    } else {
      propsTab.tableData!.rows.push([property.name, property.value]);
    }
  }
  if (propsTab.tableData!.rows.length > 0) {
    tabs.push(propsTab);
  }
  return tabs;
}

@Component({
  components: {}
})
export default class ComponentContent extends Vue {
  @Prop({type: Object, required: true})
  readonly component!: ContextualizedSBOMComponent;

  // Describes metadata for an entire SBOM
  @Prop({type: Object, required: false}) readonly metadata?: SBOMMetadata;
  @Prop({type: Array, required: false, default: () => []})
  readonly vulnerabilities!: ContextualizedControl[];

  // stores the state of the tab selected
  tabs = {tab: null};

  /**
   * Converts the properties on a component into a data structure that can be
   * displayed in separate tabs. Every root level property (except primitives)
   * get their own tab. Data that can be represented in a table will be, but
   * some data may need to be represented using a nested tree view. Note that
   * `component.properties` is special in that any items with
   * `value: <stringified JSON>` will be rendered in its own tab as well.
   */
  get computedTabs(): Tab[] {
    const tabs: Tab[] = [];
    if (this.metadata) {
      // for displaying top level component data
      tabs.push(...generateTabs(this.metadata, 'Metadata - '));
      tabs.push(...generateTabs(this.component, 'Component - '));
    } else {
      // display standard components
      tabs.push(...generateTabs(this.component));
    }

    // show vulnerabilities that affect this component
    if (this.vulnerabilities && this.vulnerabilities.length > 0) {
      tabs.push({
        name: 'Vulnerabilities',
        tableData: {
          columns: ['Vulnerability Id', 'Title', 'Severity'],
          rows: this.vulnerabilities.map((v) => [
            v.data.id,
            v.data.title || '',
            v.hdf.severity
          ])
        }
      });
    }

    // show components that this component depends on
    if (this.component.children.length) {
      tabs.push({
        name: this.metadata ? 'Component - Dependencies' : 'Dependencies',
        relatedComponents: this.component.children
      });
    }

    // show components that depend on this component
    if (this.component.parents.length) {
      tabs.push({
        name: this.metadata ? 'Component - Parents' : 'Parents',
        relatedComponents: this.component.parents
      });
    }
    return tabs;
  }
}
</script>

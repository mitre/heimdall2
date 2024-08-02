<template>
  <td :colspan="colspan">
    <v-tabs v-model="tabs">
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
                    <!-- Check if the column represents an alternate references -->
                    <template v-if="tab.tableData.columns[j] === 'Url'">
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
                        >{{ value }}</router-link
                      >
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

        <!-- Viewing Nested Strucures -->
        <v-treeview v-if="tab.treeData" open-all :items="tab.treeData" />
      </v-tab-item>
    </v-tabs-items>
  </td>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SBOMComponent} from './ComponentTable.vue';
import _ from 'lodash';
import {ContextualizedControl} from 'inspecjs';
import {parseJson} from '@mitre/hdf-converters/src/utils/parseJson';

interface Tab {
  name: string;
  tableData?: TableData;
  treeData?: Treeview[];
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
  for (const [key, value] of Object.entries(obj)) {
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

@Component({
  components: {}
})
export default class ComponentContent extends Vue {
  @Prop({type: Object, required: true}) readonly component!: SBOMComponent;
  @Prop({type: Array, required: true})
  readonly vulnerabilities!: ContextualizedControl[];

  @Prop({type: Number, required: true}) readonly colspan!: number;

  // stores the state of the tab selected
  tabs = {tab: null};

  // a list of tabs that don't need to be auto-generated
  customTabs = ['affectingVulnerabilities', 'properties'];

  /**
   * Converts the properties on a component into
   * a data structure that can be displayed in separate tabs.
   * Every root level property (except primitives) get their own tab.
   * Data that can be represented in a table will be, but some data may need
   * to be represnted using a nested tree view.
   * `component.properties` is special in that any items with `value: <stringified JSON>`
   * will be rendered in its own tab as well
   */
  get computedTabs(): Tab[] {
    const generalProps: TableData = {columns: ['Property', 'Value'], rows: []};
    const tabs: Tab[] = [
      {
        name: 'General Properties',
        tableData: generalProps
      }
    ];

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

    if (this.component.properties) {
      const properties: Tab = {
        name: 'Properties',
        tableData: {
          columns: ['Property', 'Value'],
          rows: []
        }
      };
      for (const property of this.component.properties) {
        const json = parseJson(property.value);
        if (json.ok && json.value instanceof Object) {
          tabs.push({
            name: _.startCase(property.name),
            ...jsonToTabFormat(json.value)
          });
        } else {
          properties.tableData?.rows.push([property.name, property.value]);
        }
      }
      if (properties.tableData && properties.tableData.rows.length > 0) {
        tabs.push(properties);
      }
    }

    for (const [key, value] of Object.entries(this.component)) {
      if (value instanceof Object) {
        if (!this.customTabs.includes(key))
          tabs.push({name: _.startCase(key), ...jsonToTabFormat(value)});
      } else {
        // value is a primitive
        generalProps.rows.push([key, value]);
      }
    }
    return tabs;
  }
}
</script>

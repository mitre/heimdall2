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
                  <td v-for="col in tab.tableData.columns" :key="col">{{ col }}</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row, i in tab.tableData.rows" :key="i">
                  <td v-for="value, j in row" :key="value">
                    <template v-if="tab.tableData.columns[j] === 'Url'">
                      <a :href="value" target="_blank">{{
                        value
                      }}</a>
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
import { ContextualizedControl } from 'inspecjs';

interface Tab {
  name: string;
  tableData?: TableData;
  treeData?: Treeview[];
}

type TableData = {columns: string[], rows: string[][]};

interface Treeview {
  name?: string;
  children?: Treeview[];
  id: number;
}
/**
 *
 * @param obj The object being converted to fit in a v-treeview.
 * @param id The next id to be used. If unique items are not given,
 * treeview items will fail to open on mount properly.
 */
function objectToTreeview(obj: Object, id: number): Treeview[] {
  return Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'string') {
      const result = {name: `${key}: ${value}`, id};
      id += 1;
      return result;
    }
    const children = objectToTreeview(value, id); // recursively generate the data structure
    const last = children.at(-1); // find the next unused id
    if (last) id = last.id + 1;
    return {name: key, children, id};
  });
}

@Component({
  components: {}
})
export default class ComponentContent extends Vue {
  @Prop({type: Object, required: true}) readonly component!: SBOMComponent;
  @Prop({type: Object, required: true}) readonly vulnerabilities!: ContextualizedControl[];
  @Prop({type: Number, required: true}) readonly colspan!: number;

  // stores the state of the tab selected
  tabs = {tab: null};

  // a list of tabs that don't need to be auto-generated  
  customTabs = ['affectingVulnerabilities'];
  //customTabs: string[] = [];

  /** 
   * Converts the properties on a component into 
   * a data structure that can be displayed in separate tabs.
   * Every root level property (except strings) get their own tab.
   * Data that can be represented in a table will be, but some data may need
   * to be represnted using a nested tree view.
  */
  get computedTabs(): Tab[] {
    const generalProps: TableData = {columns: ['Property', 'Value'], rows: []};
    const tabs: Tab[] = [
      {
        name: 'General Properties',
        tableData: generalProps
      }, 
    ];

    if (this.vulnerabilities) {
      tabs.push({
        name: 'Vulnerabilities',
        tableData: {
          columns: ['Id', 'Title', 'Severity'],
          rows: this.vulnerabilities.map(v => [v.data.id, v.data.title || '', v.hdf.severity])
        }
      })
    }

    for (const [key, value] of Object.entries(this.component)) {
      if (value instanceof Object) {
        if (this.customTabs.includes(key))
          continue;

        // is the value is a list of string 
        if (Array.isArray(value) && value.every(v => typeof v ==='string')) {
           tabs.push({
            name: _.startCase(key),
            tableData: {
              columns: ['Elements'],
              rows: value.map(v => [v])
            }
           })
        }

        /* if value is a list of height-one objects (can be represented in a table)
          [
            {
              p1: 'value',
              p2: 'value',
              ...
            },
            {
              p1: 'value',
              p2: 'value'
            },
            ...
          ]
        */
        else if (Array.isArray(value) && value.every(v => { // todo: move this to separate function
          return Object.entries(v).every(([_key, value]) => typeof value === 'string')
        })) {
          // get the complete set of properties amongst the items in `value`
          const columns = _.uniq(value.flatMap(Object.keys))
          tabs.push({
            name: _.startCase(key),
            tableData: {
              columns: columns.map(_.startCase),
              // convert each element in `value` to a list 
              // corresponding to each property in `columns`  
              rows: value.map(v => {
                return columns.map(c => v[c])
              })
            }
          })
        } else {
          // data is nested too much to display in a concise table
          tabs.push({
            name: _.startCase(key),
            treeData: objectToTreeview(value, 0)
          });
        }
      } else { // value is a string
        generalProps.rows.push([key, value]);
      }
    }
    console.log(generalProps)
    return tabs;
  }
}
</script>

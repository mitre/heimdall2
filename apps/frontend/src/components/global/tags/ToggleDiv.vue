<template>
  <v-container>
    <v-btn @click="toggleModal" class="mx-2" fab dark small><v-icon dark> mdi-cog</v-icon></v-btn>
    <v-dialog v-model="isModalVisible" max-width="600px">
      <v-card>
        <v-tabs v-model="activeTab">
          <v-tab>View Options</v-tab>
          <v-tab>User Guidance Mappings</v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab">
          <v-tab-item>
            <v-card-text>
              <!-- Settings content goes here -->
              <v-switch
                v-model="localDisplayUnviewedControls"
                label="Show Only Unviewed"
                @change="emitChange('displayUnviewedControls', localDisplayUnviewedControls)"
              />
              <v-switch
                v-model="localSyncTabs"
                label="Sync Tabs"
                @change="emitChange('syncTabs', localSyncTabs)"
              />
              <v-switch
                v-model="localSingleExpand"
                label="Single Expand"
                @change="emitChange('singleExpand', localSingleExpand)"
              />
              <v-switch
                v-model="localExpandAll"
                label="Expand All"
                @change="emitChange('expandAll', localExpandAll)"
              />
            </v-card-text>
          </v-tab-item>
          <v-tab-item>
            <v-card-text>
              <div class="modal-content-wrapper">
                <!-- Add Default Tags label -->
                <div class="label">Default Tags:</div>
                <!-- Special row for the first two switches -->
                <v-row class="checkbox-container">
                  <v-col
                    v-for="checkbox in combinedCheckboxes.slice(0, 2)"
                    :key="checkbox.id"
                    cols="12"
                    sm="4"
                    md="4"
                    class="checkbox-item"
                  >
                    <v-switch
                      :label="checkbox.label"
                      :value="checkbox.id"
                      v-model="localCheckedValues"
                      dense
                      hide-details
                      class="custom-switch"
                    ></v-switch>
                  </v-col>
                </v-row>
                <!-- Add User Defined Guidance Mappings label -->
                <div class="label">User Defined Guidance Mappings:</div>
                <!-- Row for additional switches -->
                <v-row class="checkbox-container">
                  <v-col
                    v-for="checkbox in combinedCheckboxes.slice(2)"
                    :key="checkbox.id"
                    cols="12"
                    sm="4"
                    md="4"
                    class="checkbox-item"
                  >
                    <v-switch
                      :label="checkbox.label"
                      :value="checkbox.id"
                      v-model="localCheckedValues"
                      dense
                      hide-details
                      class="custom-switch"
                    ></v-switch>
                    <v-btn @click="handleRemoveMapping(checkbox.id)" color="red" class="mx-2" fab dark small><v-icon dark> mdi-delete</v-icon></v-btn>
                  </v-col>
                </v-row>
                <div class="accordion-container">
                  <v-expansion-panels>
                    <v-expansion-panel>
                      <v-expansion-panel-header>CSV Instructions</v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>In order to upload a guidance mapping as a CSV, please adhere to the following format:</p>
                        <p>The first row of the csv, being the headers, should have minimum two values. The first value should be the name of your guidance mapping, and the second MUST be "CCI" or "800-53", depending on whether you are mapping from your guidance to CCI's or to NIST 800-53 families.</p>
                        <p>Each row after the first must also include minimum two values, the first being your guidance tag, and the second being the CCI or 800-53 family that it maps to. Additionally, you may include an optional third value, which will be the descriptive text for the tag that appears on hover. (Note: You need only include this description for one instance of the tag)</p>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                      <v-expansion-panel-header>JSON Instructions</v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>In order to upload a guidance mapping as a .json file, please adhere to the following format:</p>
                        <p>The json must include four values: "type", which must be either "CCI" or "800-53", depending on which the mapping is based upon. "name", being the name of the guidance mapping. "mappings", which should be a json object which uses the user's tag as a key, and an array of CCI's or 800-53's the tag maps to. Finally, descriptions, which should be a json object optionally linking the user's tags to descriptions that will appear on hover. As an example:</p>
                        <pre>
{
  "type": "CCI",
  "name": "UserMapping",
  "mappings": {
    "1": ["CCI-000366", "CCI-000367", "CCI-000368"],
    "97": ["CCI-000366"],
    "8675309": ["CCI-001199"]
  },
  "descriptions": {
    "97": "This tag gets a description"
  }
}
                        </pre>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
                <div class="button-container">
                  <v-btn @click="triggerFileInput" color="primary">Add Mapping</v-btn>
                </div>
              </div>
              <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" />
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
export default {
  props: {
    displayUnviewedControls: Boolean,
    syncTabs: Boolean,
    singleExpand: Boolean,
    expandAll: Boolean
  },
  data() {
    return {
      isModalVisible: false,
      localCheckedValues: [],
      renderKey: 0,
      activeTab: 0, // Add this line to track the active tab
      localDisplayUnviewedControls: this.displayUnviewedControls,
      localSyncTabs: this.syncTabs,
      localSingleExpand: this.singleExpand,
      localExpandAll: this.expandAll
    };
  },
  computed: {
    ...mapGetters('selectedTags', ['checkedValues', 'combinedCheckboxes'])
  },
  watch: {
    combinedCheckboxes(newCheckboxes) {
      this.renderKey += 1;
    },
    checkedValues: {
      handler(newValues) {
        this.localCheckedValues = [...newValues];
      },
      immediate: true
    },
    localCheckedValues(newValues) {
      this.syncCheckedValues(newValues);
    },
    displayUnviewedControls(newVal) {
      this.localDisplayUnviewedControls = newVal;
    },
    syncTabs(newVal) {
      this.localSyncTabs = newVal;
    },
    singleExpand(newVal) {
      this.localSingleExpand = newVal;
    },
    expandAll(newVal) {
      this.localExpandAll = newVal;
    }
  },
  created() {
    if (this.combinedCheckboxes.length >= 2) {
      this.localCheckedValues = [this.combinedCheckboxes[0].id, this.combinedCheckboxes[1].id];
      this.syncCheckedValues(this.localCheckedValues);
    }
  },
  methods: {
    ...mapActions('selectedTags', ['addValue', 'removeValue']),
    ...mapActions('mappings', ['addMapping', 'removeMapping', 'updateMapping', 'addDescription', 'removeDescription']),
    toggleModal() {
      this.isModalVisible = !this.isModalVisible;
    },
    syncCheckedValues(newValues) {
      const addedValues = newValues.filter(value => !this.checkedValues.includes(value));
      const removedValues = this.checkedValues.filter(value => !newValues.includes(value));
      addedValues.forEach(value => this.addValue(value));
      removedValues.forEach(value => this.removeValue(value));
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'csv') {
          this.readCSVFile(file);
        } else if (fileExtension === 'json') {
          this.readJSONFile(file);
        } else {
          console.error('Unsupported file type:', fileExtension);
        }
      }
    },
    readCSVFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target.result;
        this.processCSVContents(contents);
      };
      reader.readAsText(file);
    },
    processCSVContents(contents) {
      const lines = contents.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) {
        console.error('CSV file is empty or invalid.');
        return;
      }
      const headers = lines[0].split(',').map(header => header.trim());
      if (headers.length < 2 || (headers[1] !== 'CCI' && headers[1] !== '800-53')) {
        console.error('CSV file must have at least two columns with the second column header being "CCI" or "800-53".');
        return;
      }
      const data = lines.slice(1).map(line => {
        const columns = line.split(',').map(column => column.trim());
        if (columns.length < 2) {
          console.error(`Invalid line format (less than 2 columns): ${line}`);
          return null;
        }
        return {
          mappingName: columns[0],
          type: columns[1],
          description: columns[2] || ""
        };
      }).filter(item => item);
      this.processCSVData(data, headers);
    },
    processCSVData(data, headers) {
      const mappingDict = {};
      const descriptionDict = {};
      data.forEach(item => {
        if (!mappingDict[item.type]) {
          mappingDict[item.type] = [];
        }
        mappingDict[item.type].push(item.mappingName);
        if (!descriptionDict[item.mappingName]) {
          descriptionDict[item.mappingName] = item.description;
        }
      });
      // Use the Vuex action to add the mapping with a unique key
      this.addMapping({ id: headers[1] + '->' + headers[0], mapping: mappingDict });
      this.addDescription({ id: headers[1] + '->' + headers[0], descriptions: descriptionDict });
    },
    readJSONFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target.result;
        this.processJSONContents(contents);
      };
      reader.readAsText(file);
    },
    processJSONContents(contents) {
      try {
        const json = JSON.parse(contents);
        if (!json.type || !json.name || !json.mappings || !json.descriptions) {
          console.error('Invalid JSON format.');
          return;
        }
        const mappingDict = {};
        const descriptionDict = {};
        Object.keys(json.mappings).forEach(key => {
          json.mappings[key].forEach(mapping => {
            if (!mappingDict[mapping]) {
              mappingDict[mapping] = [];
            }
            mappingDict[mapping].push(key);
          });
        });
        Object.keys(json.descriptions).forEach(key => {
          descriptionDict[key] = json.descriptions[key];
        });
        // Use the Vuex action to add the mapping with a unique key
        this.addMapping({ id: json.type + '->' + json.name, mapping: mappingDict });
        this.addDescription({ id: json.type + '->' + json.name, descriptions: descriptionDict });
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    },
    handleRemoveMapping(id) {
      // Remove the mapping and description from Vuex store
      this.removeMapping(id);
      this.removeDescription(id);
      // Remove the value from localCheckedValues
      this.localCheckedValues = this.localCheckedValues.filter(value => value !== id);
    },
    emitChange(prop, value) {
      this.$emit(`update:${prop}`, value);
    }
  }
};
</script>
<style scoped>
.checkbox-container {
  text-align: left;
  overflow-y: auto; /* Ensure checkboxes are scrollable if they overflow */
  max-height: 50%; /* Adjust as needed */
}
.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px; /* Reduce the margin to make checkboxes closer */
}
.custom-switch {
  margin-bottom: 0px; /* Remove margin from v-switch */
}
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.modal-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.accordion-container {
  flex: 1;
  overflow-y: auto; /* Ensure accordion is scrollable if it overflows */
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Align accordion tabs to the bottom */
}
</style>
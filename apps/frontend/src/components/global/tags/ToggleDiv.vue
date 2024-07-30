<template>
  <div :key="renderKey">
    <img @click="toggleModal" src="../../../assets/settingsgear.png" alt="Toggle Modal" style="width: 60px; height: 60px; margin-right: 20px; cursor: pointer;">
    <Modal :isVisible="isModalVisible" @close="toggleModal">
      <div class="modal-content-wrapper">
        <div class="checkbox-container">
          <div v-for="(checkbox, index) in combinedCheckboxes" :key="checkbox.id" class="checkbox-item">
            <label>
              <input type="checkbox" :value="checkbox.id" v-model="localCheckedValues" />
              {{ checkbox.label }}
            </label>
            <button v-if="index >= 2" @click="handleRemoveMapping(checkbox.id)" class="remove-button">X</button>
          </div>
        </div>
        <div class="accordion-container">
          <UploadAccordion :items="accordionItems">
            <template #csv>
              <p>In order to upload a guidance mapping as a CSV, please adhere to the following format:</p>
              <p>The first row of the csv, being the headers, should have minimum two values. The first value should be the name of your guidance mapping, and the second MUST be "CCI" or "800-53", depending on whether you are mapping from your guidance to CCI's or to NIST 800-53 families.</p>
              <p>Each row after the first must also include minimum two values, the first being your guidance tag, and the second being the CCI or 800-53 family that it maps to. Additionally, you may include an optional third value, which will be the descriptive text for the tag that appears on hover. (Note: You need only include this description for one instance of the tag)</p>
            </template>
            <template #json>
              <p>In order to upload a guidance mapping as a .json file, please adhere to the following format:</p>
              <p>The json must include four values: "type", which must be either "CCI" or "800-53", depending on which the mapping is based upon. "name", being the name of the guidance mapping. "mappings", which should be a json object which uses the user's tag as a key, and an array of CCI's or 800-53's the tag maps to. Finally, descriptions, which should be a json object optionally linking the user's tags to descriptions that will appear on hover. As an example:</p>
              <pre>
                <code>
                  {
                    "type": "CCI",
                    "name": "UserMapping",,
                    "mappings": {
                      "1": ["CCI-000366", "CCI-000367", "CCI-000368"],
                      "97": ["CCI-000366"],
                      "8675309": ["CCI-001199"]
                    },
                    "descriptions": {
                      "97": "This tag gets a description"
                    }
                  }
                </code>
              </pre>
            </template>
            <!-- Add more templates for additional tabs -->
          </UploadAccordion>
        </div>
        <div class="button-container">
          <button @click="triggerFileInput" class="add-mapping-button">Add Mapping</button>
        </div>
      </div>
      <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" />
    </Modal>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import Modal from './CheckboxModal.vue';
import UploadAccordion from './UploadAccordion.vue';
export default {
  components: {
    Modal,
    UploadAccordion
  },
  data() {
    return {
      isModalVisible: false,
      localCheckedValues: [],
      renderKey: 0, // Key for forcing re-render
      accordionItems: [
        { title: 'CSV Instructions', slotName: 'csv' },
        { title: 'JSON Instructions', slotName: 'json' }
        // Add more items as needed
      ]
    };
  },
  computed: {
    ...mapGetters('selectedTags', ['checkedValues', 'combinedCheckboxes'])
  },
  watch: {
    combinedCheckboxes(newCheckboxes) {
      console.log('combinedCheckboxes updated:', newCheckboxes);
      this.renderKey += 1; // Increment key to force re-render
    },
    checkedValues: {
      handler(newValues) {
        this.localCheckedValues = [...newValues];
      },
      immediate: true
    },
    localCheckedValues(newValues) {
      this.syncCheckedValues(newValues);
    }
  },
  created() {
    // Initialize localCheckedValues with the first two checkbox IDs
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
      console.log("Mapping Dictionary:", mappingDict);
      console.log("Description Dictionary:", descriptionDict);
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
        console.log("Mapping Dictionary:", mappingDict);
        console.log("Description Dictionary:", descriptionDict);
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
      console.log("Mapping removed: ", id)
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
}
.remove-button {
  background-color: red;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  margin-left: 10px;
  padding: 0 5px;
}
.add-mapping-button {
  margin-top: 20px;
  padding: 10px 20px;
  cursor: pointer;
  background-color: blue;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
}
.add-mapping-button:hover {
  background-color: darkblue;
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
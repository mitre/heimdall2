<template>
  <div :key="renderKey">
    <img @click="toggleModal" src="../../../assets/settingsgear.png" alt="Toggle Modal" style="width: 60px; height: 60px; margin-right: 20px; cursor: pointer;">
    <Modal :isVisible="isModalVisible" @close="toggleModal">
      <div class="checkbox-container" v-for="checkbox in combinedCheckboxes" :key="checkbox.id">
        <label>
          <input type="checkbox" :value="checkbox.id" v-model="localCheckedValues" />
          {{ checkbox.label }}
        </label>
      </div>
      <button @click="triggerFileInput" class="add-mapping-button">Add Mapping</button>
      <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" />
    </Modal>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';
import Modal from './CheckboxModal.vue';
export default {
  components: {
    Modal
  },
  data() {
    return {
      isModalVisible: false,
      localCheckedValues: [],
      renderKey: 0 // Key for forcing re-render
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
    ...mapActions('mappings', ['addMapping', 'removeMapping', 'updateMapping']),
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
        const reader = new FileReader();
        reader.onload = (e) => {
          const contents = e.target.result;
          const lines = contents.split('\n');
          
          if (lines.length > 0) {
            const firstLine = lines[0].trim(); // Trim to remove any leading/trailing whitespace
            const firstCommaIndex = firstLine.indexOf(',');
            if (firstCommaIndex !== -1) {
              const type = firstLine.substring(0, firstCommaIndex).trim();
              const restOfFirstLine = firstLine.substring(firstCommaIndex + 1).trim();
              if (type === "CCI") {
                this.handleCCILines(lines.slice(1), restOfFirstLine); // Pass the rest of the lines and the rest of the first line to a handler function
              } else if (type === "800-53") {
                this.handle80053Lines(lines.slice(1), restOfFirstLine); // Pass the rest of the lines and the rest of the first line to a handler function
              } else {
                console.error("Unrecognized file format");
              }
            } else {
              console.error("Invalid format: No comma found in the first line");
            }
          }
        };
        reader.readAsText(file);
      }
    },
    handleCCILines(lines, restOfFirstLine) {
      const cciMapping = {};
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === "") {
          return;
        }
        const firstCommaIndex = trimmedLine.indexOf(',');
        if (firstCommaIndex === -1) {
          console.error(`Invalid line format (no comma found): ${line}`);
          return;
        }
        const key = trimmedLine.substring(0, firstCommaIndex).trim();
        let value = trimmedLine.substring(firstCommaIndex + 1).trim();
        value = value.replace(/'/g, '"');
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const parsedValue = JSON.parse(value);
            if (Array.isArray(parsedValue)) {
              cciMapping[key] = parsedValue;
            } else {
              console.error(`Value for ${key} is not a valid array:`, value);
            }
          } catch (e) {
            console.error(`Error parsing value for ${key}:`, value, e);
          }
        } else {
          console.error(`Value for ${key} is not a valid JSON array format:`, value);
        }
      });
      console.log("CCI Mapping:", cciMapping);
      // Use the Vuex action to add the mapping with the unique key
      //I should probably have a separate object for cci's and for 80053s. OR I just name them differently for 
      this.addMapping({ id: "CCIs  ->" + restOfFirstLine, mapping: cciMapping });
    },
    handle80053Lines(lines, restOfFirstLine) {
      // Perform actions on the rest of the lines for "800-53"
      const nistMapping = {};
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === "") {
          return;
        }
        const firstCommaIndex = trimmedLine.indexOf(',');
        if (firstCommaIndex === -1) {
          console.error(`Invalid line format (no comma found): ${line}`);
          return;
        }
        const key = trimmedLine.substring(0, firstCommaIndex).trim();
        let value = trimmedLine.substring(firstCommaIndex + 1).trim();
        value = value.replace(/'/g, '"');
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const parsedValue = JSON.parse(value);
            if (Array.isArray(parsedValue)) {
              nistMapping[key] = parsedValue;
            } else {
              console.error(`Value for ${key} is not a valid array:`, value);
            }
          } catch (e) {
            console.error(`Error parsing value for ${key}:`, value, e);
          }
        } else {
          console.error(`Value for ${key} is not a valid JSON array format:`, value);
        }
      });
      console.log("NIST Mapping:", nistMapping);
      // Use the Vuex action to add the mapping with the unique key
      //I should probably have a separate object for cci's and for 80053s. OR I just name them differently for 
      this.addMapping({ id: "800-53->" + restOfFirstLine, mapping: nistMapping });
    }
  }
};
</script>
<style scoped>
.checkbox-container {
  text-align: left;
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
</style>
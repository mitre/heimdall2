import { Module } from 'vuex';
import Vue from 'vue';
// Define the structure of a dictionary object
interface DictionaryObject {
  [key: string]: string[];
}
// Define the state interface
interface MappingsState {
  mappings: { [id: string]: DictionaryObject };
  descriptions: { [id: string]: { [mappingName: string]: string } };
}
// Initial state
const state: MappingsState = {
  mappings: {},
  descriptions: {}
};
// Mutations
const mutations = {
  ADD_MAPPING(state: MappingsState, { id, mapping }: { id: string, mapping: DictionaryObject }) {
    console.log('Adding mapping:', id, mapping);
    Vue.set(state.mappings, id, mapping); // Use Vue.set for reactivity
  },
  REMOVE_MAPPING(state: MappingsState, id: string) {
    Vue.delete(state.mappings, id); // Use Vue.delete for reactivity
    console.log('Removed mapping:', id, state.mappings);
  },
  UPDATE_MAPPING(state: MappingsState, { id, updatedMapping }: { id: string, updatedMapping: DictionaryObject }) {
    if (state.mappings[id]) {
      Vue.set(state.mappings, id, updatedMapping); // Use Vue.set for reactivity
    }
  },
  ADD_DESCRIPTION(state: MappingsState, { id, descriptions }: { id: string, descriptions: { [mappingName: string]: string } }) {    
    Vue.set(state.descriptions, id, descriptions); // Use Vue.set for reactivity
  },
  REMOVE_DESCRIPTION(state: MappingsState, id: string) {
    Vue.delete(state.descriptions, id); // Use Vue.delete for reactivity
    console.log('Removed description:', id, state.descriptions);
  },
  UPDATE_DESCRIPTION(state: MappingsState, { id, updatedDescriptions }: { id: string, updatedDescriptions: { [mappingName: string]: string } }) {
    if (state.descriptions[id]) {
      Vue.set(state.descriptions, id, updatedDescriptions); // Use Vue.set for reactivity
    }
  }
};
// Actions
const actions = {
  addMapping({ commit }: any, { id, mapping }: { id: string, mapping: DictionaryObject }) {
    commit('ADD_MAPPING', { id, mapping });
  },
  removeMapping({ commit }: any, id: string) {
    commit('REMOVE_MAPPING', id);
  },
  updateMapping({ commit }: any, { id, updatedMapping }: { id: string, updatedMapping: DictionaryObject }) {
    commit('UPDATE_MAPPING', { id, updatedMapping });
  },
  addDescription({ commit }: any, { id, descriptions }: { id: string, descriptions: { [mappingName: string]: string } }) {
    commit('ADD_DESCRIPTION', { id, descriptions });
  },
  removeDescription({ commit }: any, id: string) {
    commit('REMOVE_DESCRIPTION', id);
  },
  updateDescription({ commit }: any, { id, updatedDescriptions }: { id: string, updatedDescriptions: { [mappingName: string]: string } }) {
    commit('UPDATE_DESCRIPTION', { id, updatedDescriptions });
  }
};
// Getters
const getters = {
  mappings: (state: MappingsState) => state.mappings,
  getMappingById: (state: MappingsState) => (id: string) => {
    return state.mappings[id];
  },
  descriptions: (state: MappingsState) => state.descriptions,
  getDescriptionById: (state: MappingsState) => (id: string) => {
    return state.descriptions[id];
  }
};
// Define the namespaced module
const mappings: Module<MappingsState, any> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
export default mappings;
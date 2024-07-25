import { Module } from 'vuex';
import Vue from 'vue';
// Define the structure of a dictionary object
interface DictionaryObject {
  [key: string]: string[];
}
// Define the state interface
interface MappingsState {
  mappings: { [id: string]: DictionaryObject };
}
// Initial state
const state: MappingsState = {
  mappings: {}
};
const mutations = {
  ADD_MAPPING(state: MappingsState, { id, mapping }: { id: string, mapping: DictionaryObject }) {
    console.log('Adding mapping:', id, mapping); // Add this line
    Vue.set(state.mappings, id, mapping); // Use Vue.set for reactivity
  },
  REMOVE_MAPPING(state: MappingsState, id: string) {
    Vue.delete(state.mappings, id); // Use Vue.delete for reactivity
  },
  UPDATE_MAPPING(state: MappingsState, { id, updatedMapping }: { id: string, updatedMapping: DictionaryObject }) {
    if (state.mappings[id]) {
      Vue.set(state.mappings, id, updatedMapping); // Use Vue.set for reactivity
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
  }
};
// Getters
const getters = {
  mappings: (state: MappingsState) => state.mappings,
  getMappingById: (state: MappingsState) => (id: string) => {
    return state.mappings[id];
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
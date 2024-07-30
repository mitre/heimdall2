import { Module } from 'vuex';
interface Checkbox {
  id: string;
  label: string;
}
interface SelectedTagsState {
  checkedValues: string[];
  defaultCheckboxes: Checkbox[];
}
const state: SelectedTagsState = {
  checkedValues: [],
  defaultCheckboxes: [
    { id: 'cci', label: 'CCIs' },
    { id: 'nist', label: '800-53s' }
  ]
};
const mutations = {
  ADD_VALUE(state: SelectedTagsState, value: string) {
    if (!state.checkedValues.includes(value)) {
      state.checkedValues.push(value);
    }
  },
  REMOVE_VALUE(state: SelectedTagsState, value: string) {
    state.checkedValues = state.checkedValues.filter(item => item !== value);
  }
};
const actions = {
  addValue({ commit }: any, value: string) {
    commit('ADD_VALUE', value);
  },
  removeValue({ commit }: any, value: string) {
    commit('REMOVE_VALUE', value);
  }
};
const getters = {
  checkedValues: (state: SelectedTagsState) => state.checkedValues,
  defaultCheckboxes: (state: SelectedTagsState) => state.defaultCheckboxes,
  combinedCheckboxes: (state: SelectedTagsState, getters: any, rootState: any) => {
    const mappings = rootState.mappings.mappings;
    const descriptions = rootState.mappings.descriptions;
    console.log('Mappings in getter:', mappings); // Add this line
    console.log('Descriptions in getter:', descriptions); // Add this line
    const mappingCheckboxes = Object.keys(mappings).map(id => {
      const label = id.includes('->') ? id.split('->')[1].trim() : id;
      return {
        id,
        label: `${label}`
      };
    });
    return [...state.defaultCheckboxes, ...mappingCheckboxes];
  }
};
const selectedTags: Module<SelectedTagsState, any> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
export default selectedTags;
import TagRow from '@/components/global/tags/TagRow.vue';
import {EvaluationModule} from '@/store/evaluations';
import {SnackbarModule} from '@/store/snackbar';
import {IEvaluation, IEvaluationTag} from '@heimdall/common/interfaces';
import {mount, Wrapper} from '@vue/test-utils';
import {AxiosHeaders, AxiosResponse} from 'axios';
import {afterEach, describe, expect, it, vi} from 'vitest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testingUtils';

addElemWithDataAppToBody();

function emptyAxiosResponse(): AxiosResponse {
  return {
    config: {headers: new AxiosHeaders()},
    data: undefined,
    headers: {},
    status: 200,
    statusText: 'OK'
  };
}

function makeTag(evaluationId: string, value: string): IEvaluationTag {
  return {
    id: `${evaluationId}_${value}`,
    evaluationId,
    value,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function makeEvaluation(
  id: string,
  tagValues: string[],
  editable = false
): IEvaluation {
  return {
    id,
    filename: `${id}.json`,
    groups: [],
    editable,
    public: false,
    evaluationTags: tagValues.map((value) => makeTag(id, value)),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function mountTagRow(evaluation: IEvaluation): Wrapper<Vue> {
  return mount(TagRow, {
    vuetify: new Vuetify(),
    propsData: {evaluation}
  });
}

describe('EvaluationModule.allEvaluationTags', () => {
  afterEach(() => {
    EvaluationModule.SET_ALL_EVALUATION([]);
  });

  it('returns deduplicated tag values sorted alphabetically case-insensitively', () => {
    EvaluationModule.SET_ALL_EVALUATION([
      makeEvaluation('1', ['zeta', 'Charlie', 'bravo']),
      makeEvaluation('2', ['alpha', 'zeta'])
    ]);
    expect(EvaluationModule.allEvaluationTags).toEqual([
      'alpha',
      'bravo',
      'Charlie',
      'zeta'
    ]);
  });
});

describe('TagRow', () => {
  it('renders tag chips in case-insensitive alphabetical order', () => {
    const evaluation = makeEvaluation('1', ['zeta', 'apple', 'Banana']);
    const wrapper = mountTagRow(evaluation);
    const chipTexts = wrapper
      .findAll('.v-chip')
      .wrappers.map((chip) => chip.text());
    expect(chipTexts).toEqual(['apple', 'Banana', 'zeta']);
  });

  it('does not mutate the evaluationTags prop when sorting', () => {
    const evaluation = makeEvaluation('1', ['zeta', 'apple', 'Banana']);
    mountTagRow(evaluation);
    expect(evaluation.evaluationTags.map((tag) => tag.value)).toEqual([
      'zeta',
      'apple',
      'Banana'
    ]);
  });

  it('populates the edit dialog tag list in sorted order', () => {
    const evaluation = makeEvaluation('1', ['zeta', 'apple', 'Banana'], true);
    const wrapper = mountTagRow(evaluation);
    expect(wrapper.vm.$data.tags).toEqual(['apple', 'Banana', 'zeta']);
  });

  it('still diffs added and removed tags correctly from the sorted list', async () => {
    const evaluation = makeEvaluation('1', ['bravo', 'alpha'], true);
    const wrapper = mountTagRow(evaluation);
    const addTag = vi
      .spyOn(EvaluationModule, 'addTag')
      .mockResolvedValue(emptyAxiosResponse());
    const deleteTag = vi
      .spyOn(EvaluationModule, 'deleteTag')
      .mockResolvedValue(emptyAxiosResponse());
    const loadEvaluation = vi
      .spyOn(EvaluationModule, 'loadEvaluation')
      .mockResolvedValue(evaluation);
    const notify = vi.spyOn(SnackbarModule, 'notify').mockReturnValue();

    // User removes 'alpha' and adds 'charlie' in the combobox
    await wrapper.setData({tags: ['bravo', 'charlie']});
    (wrapper.vm as Vue & {save: () => void}).save();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(addTag).toHaveBeenCalledTimes(1);
    expect(addTag).toHaveBeenCalledWith({
      evaluation,
      tag: {value: 'charlie'}
    });
    expect(deleteTag).toHaveBeenCalledTimes(1);
    expect(deleteTag).toHaveBeenCalledWith(
      expect.objectContaining({value: 'alpha'})
    );

    addTag.mockRestore();
    deleteTag.mockRestore();
    loadEvaluation.mockRestore();
    notify.mockRestore();
  });
});

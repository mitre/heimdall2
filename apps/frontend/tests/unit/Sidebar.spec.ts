import Sidebar from '@/components/global/Sidebar.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import 'jest';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import {EvaluationFile, ProfileFile} from '../../src/store/report_intake';
import {loadAll} from '../util/testingUtils';
import axios from 'axios'

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueRouter);
const router = new VueRouter();

jest.mock('axios', () => ({
  get: function() {
    return {
      data: {
        "IsTruncated": false,
        "Contents": [
            {
                "Key": "92638-IWA-Java/11009522/anchore-sbom.json",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"8f16fefe8e4a9ddb5313ef3c657d71a4-3\"",
                "ChecksumAlgorithm": [],
                "Size": 7947126,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/archive-11009522.zip",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"cad67451a20120284fed6dd2484ec4e3\"",
                "ChecksumAlgorithm": [],
                "Size": 2008144,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/cyclonedx-sbom.json",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"0819ac74b57fbcbaf3b9934bc7874591\"",
                "ChecksumAlgorithm": [],
                "Size": 1265027,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/gl-container-scanning-report.json",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"95a9aaaf7b9c423c5ad17179098260fe\"",
                "ChecksumAlgorithm": [],
                "Size": 810628,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/boe-artifact-263-20231016-224300-ASD.xlsx",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"af07c5ded8c39af980f508a5ea044063\"",
                "ChecksumAlgorithm": [],
                "Size": 149498,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/boe-artifact-263-20231016-224300-POAM.xlsx",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"43884e7b1a24fb0bf045b801df20b493\"",
                "ChecksumAlgorithm": [],
                "Size": 47733,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/boe-artifact-263-20231016-224300-SCAP.xlsx",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"0708b5e8eb1b6456ba21a1e24dd1d608\"",
                "ChecksumAlgorithm": [],
                "Size": 205522,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            },
            {
                "Key": "92638-IWA-Java/11009522/boe-artifact-263-20231016-224300-SCTM.xlsx",
                "LastModified": "2023-10-16T22:43:05.000Z",
                "ETag": "\"02ae2b085f1d6e74dcfa84a1273612f1\"",
                "ChecksumAlgorithm": [],
                "Size": 188621,
                "StorageClass": "STANDARD",
                "Owner": {
                    "ID": "0"
                }
            }
        ],
        "Name": "boe",
        "Prefix": "92638-IWA-Java/11009522/",
        "Delimiter": "/",
        "MaxKeys": 32,
        "CommonPrefixes": [],
        "KeyCount": 8
      }
    };
  }
}));

const wrapper: Wrapper<Vue> = shallowMount(Sidebar, {
  localVue,
  router,
  vuetify,
  propsData: {}
});

describe('Sidebar tests', () => {
  it('has the correct number of sidebar links', async () => {
    loadAll();
    expect(
      (
        wrapper.vm as Vue & {
          visible_evaluation_files: EvaluationFile[];
        }
      ).visible_evaluation_files.length
    ).toBe(InspecDataModule.allEvaluationFiles.length);
    expect(
      (
        wrapper.vm as Vue & {
          visible_profile_files: ProfileFile[];
        }
      ).visible_profile_files.length
    ).toBe(InspecDataModule.allProfileFiles.length);
  });

  it('displays properly when select/deselect is clicked', async () => {
    // deselect all profiles and evaluations
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids).toEqual([]);

    // select all profiles and evaluations
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allFiles.length
    );

    // select profiles only
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allProfileFiles.length
    );

    // select evaluations only
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allEvaluationFiles.length
    );
  });
});

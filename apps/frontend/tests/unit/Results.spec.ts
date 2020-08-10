import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {getModule} from 'vuex-module-decorators';
import {shallowMount, Wrapper} from '@vue/test-utils';
import Store from '../../src/store/store';
import FilteredDataModule from '@/store/data_filters';
import StatusCountModule, {StatusHash} from '@/store/status_counts';
import {readFileSync} from 'fs';
import InspecDataModule from '@/store/data_store';
import {
  removeAllFiles,
  selectAllFiles,
  loadSample,
  loadAll,
  expectedCount
} from '../util/testingUtils';
import Results from '@/views/Results.vue';
import ProfData from '@/components/cards/ProfData.vue';
import {profile_unique_key} from '../../src/utilities/format_util';
import StatusCardRow from '../../src/components/cards/StatusCardRow.vue';
import StatusChart from '../../src/components/cards/StatusChart.vue';
import SeverityChart from '../../src/components/cards/SeverityChart.vue';
import ComplianceChart from '../../src/components/cards/ComplianceChart.vue';
import ControlTable from '../../src/components/cards/controltable/ControlTable.vue';
import {context} from 'inspecjs';
interface ListElt {
  // A unique id to be used as a key.
  key: string;

  // Computed values for status and severity "value", for sorting
  status_val: number;
  severity_val: number;

  control: context.ContextualizedControl;
}

interface InfoItem {
  label: string;
  text: string;
  info?: string;
}

const vuetify = new Vuetify();
let wrapper: Wrapper<Vue>;
let profInfoWrapper: Wrapper<Vue>;
let scrWrapper: Wrapper<Vue>;
let statusChartWrapper: Wrapper<Vue>;
let sevChartWrapper: Wrapper<Vue>;
let compChartWrapper: Wrapper<Vue>;
let controlTableWrapper: Wrapper<Vue>;

wrapper = shallowMount(Results, {
  vuetify,
  propsData: {}
});

let filter_store = getModule(FilteredDataModule, Store);
let data_store = getModule(InspecDataModule, Store);
let status_count = getModule(StatusCountModule, Store);

loadSample('Acme Overlay Example');
selectAllFiles();

describe('Profile Info', () => {
  it('shows correct number of files', () => {
    loadAll();
    selectAllFiles();
    expect((wrapper.vm as any).file_filter.length).toBe(
      filter_store.selected_file_ids.length
    );
  });

  it('no children', () => {
    removeAllFiles();
    loadSample('NGINX Clean Sample');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    expect((profInfoWrapper.vm as any).items.length).toBe(0);
  });

  it('2 children', () => {
    removeAllFiles();
    loadSample('Acme Overlay Example');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    let actual = [
      (profInfoWrapper.vm as any).items[0].name,
      (profInfoWrapper.vm as any).items[1].name
    ];
    let expected = ['ssh-baseline', 'ssl-baseline'];

    expect(actual).toEqual(expected);
  });

  it('children of children', () => {
    removeAllFiles();
    loadSample('Triple Overlay Example');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    expect((profInfoWrapper.vm as any).items[0].children[0].name).toBe(
      'Oracle Database 12c Security Technical Implementation Guide'
    );
  });

  it('parent has correct data', () => {
    let expected: InfoItem[] = [
      {label: 'Version', text: '0.1.0'},
      {label: 'From file', text: 'Triple Overlay Example'},
      {label: 'Start time', text: '2020-06-01T18:50:31+00:00'},
      {
        label: 'Sha256 Hash',
        text: '3fe40f9476a23b5b4dd6c0da2bb8dbe8ca5a4a8b6bfb27ffbf9f1797160c0f91'
      },
      {label: 'Title', text: '.'},
      {label: 'Maintainer', text: 'CMS InSpec Dev Team'},
      {label: 'Copyright', text: '.'},
      {label: 'Controls', text: '200'}
    ];
    expect((profInfoWrapper.vm as any).selected_info).toEqual(expected);
  });

  it('children have correct data', () => {
    let expected: InfoItem[] = [
      {label: 'Version', text: '0.1.0'},
      {label: 'From file', text: 'Triple Overlay Example'},
      {label: 'Start time', text: '2020-06-01T18:50:31+00:00'},
      {
        label: 'Sha256 Hash',
        text: 'a34d4b2bb6d5675173abdb1df727cc552807b5c80c1d5de027b85c640f8a0fee'
      },
      {label: 'Title', text: 'InSpec Profile'},
      {label: 'Maintainer', text: 'The Authors'},
      {label: 'Copyright', text: 'The Authors'},
      {label: 'Copyright Email', text: 'you@example.com'},
      {label: 'Controls', text: '200'}
    ];
    (profInfoWrapper.vm as any).active = [];
    (profInfoWrapper.vm as any).child_active = [
      profile_unique_key((wrapper.vm as any).visible_profiles[1])
    ];
    expect((profInfoWrapper.vm as any).selected_info).toEqual(expected);
  });
});

describe('Status card row', () => {
  it('count is correct', () => {
    removeAllFiles();
    loadAll();
    selectAllFiles();
    scrWrapper = shallowMount(StatusCardRow, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });

    let expected = [
      {
        icon: 'check-circle',
        title: 'Passed',
        subtitle: 'All tests passed',
        color: 'statusPassed',
        number: expectedCount('passed')
      },
      {
        icon: 'close-circle',
        title: 'Failed',
        subtitle: 'Has tests that failed',
        color: 'statusFailed',
        number: expectedCount('failed')
      },
      {
        icon: 'minus-circle',
        title: 'Not Applicable',
        subtitle: 'System exception or absent component',
        color: 'statusNotApplicable',
        number: expectedCount('notApplicable')
      },
      {
        icon: 'alert-circle',
        title: 'Not Reviewed',
        subtitle: 'Can only be tested manually at this time',
        color: 'statusNotReviewed',
        number: expectedCount('notReviewed')
      }
    ];
    let expectedNum = expected.map(p => p.number);
    expect(
      (scrWrapper.vm as any).standardCardProps.map(
        (p: {number: any}) => p.number
      )
    ).toEqual(expectedNum);
  });

  it('count on file with overlays is correct', () => {
    removeAllFiles();
    loadSample('Triple Overlay Example');
    selectAllFiles();
    let failed = 55;
    let passed = 19;
    let notReviewed = 82;
    let notApplicable = 44;

    let expected = [
      {
        icon: 'check-circle',
        title: 'Passed',
        subtitle: 'All tests passed',
        color: 'statusPassed',
        number: passed
      },
      {
        icon: 'close-circle',
        title: 'Failed',
        subtitle: 'Has tests that failed',
        color: 'statusFailed',
        number: failed
      },
      {
        icon: 'minus-circle',
        title: 'Not Applicable',
        subtitle: 'System exception or absent component',
        color: 'statusNotApplicable',
        number: notApplicable
      },
      {
        icon: 'alert-circle',
        title: 'Not Reviewed',
        subtitle: 'Can only be tested manually at this time',
        color: 'statusNotReviewed',
        number: notReviewed
      }
    ];
    let expectedNum = expected.map(p => p.number);
    expect(
      (scrWrapper.vm as any).standardCardProps.map(
        (p: {number: any}) => p.number
      )
    ).toEqual(expectedNum);
  });

  it('counts errors', () => {
    removeAllFiles();
    loadSample('Red Hat Clean Sample');
    loadSample('Red Hat With Failing Tests');
    selectAllFiles();
    let errors = 2;

    let expected = {
      icon: 'alert-circle',
      title: 'Profile Errors',
      subtitle:
        'Errors running test - check profile run privileges or check with the author of profile',
      color: 'statusProfileError',
      number: errors
    };

    expect((scrWrapper.vm as any).errorProps.number).toEqual(expected.number);
  });
});

describe('Status, Severity, Compliance, chart', () => {
  it('status count is correct', () => {
    removeAllFiles();
    loadAll();
    selectAllFiles();
    statusChartWrapper = shallowMount(StatusChart, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });

    let expected = [
      expectedCount('passed'),
      expectedCount('failed'),
      expectedCount('notApplicable'),
      expectedCount('notReviewed'),
      expectedCount('profileError')
    ];

    expect((statusChartWrapper.vm as any).series).toEqual(expected);
  });

  it('status count on file with overlays is correct', () => {
    removeAllFiles();
    loadSample('Triple Overlay Example');
    selectAllFiles();
    let failed = 55;
    let passed = 19;
    let notReviewed = 82;
    let notApplicable = 44;
    let profileError = 0;

    let expected = [passed, failed, notApplicable, notReviewed, profileError];
    expect((statusChartWrapper.vm as any).series).toEqual(expected);
  });

  it('severity count is correct', () => {
    sevChartWrapper = shallowMount(SeverityChart, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });
    let low = 7;
    let med = 140;
    let high = 9;
    let critical = 0;

    let expected = [low, med, high, critical];
    expect((sevChartWrapper.vm as any).series).toEqual(expected);
  });

  it('severity doesnt count Not Applicable', () => {
    removeAllFiles();
    loadSample('Red Hat Clean Sample');
    selectAllFiles();
    let recieved = 0;
    for (let count of (sevChartWrapper.vm as any).series) {
      recieved += count;
    }

    //all counts but profile error
    let expected =
      status_count.countOf((wrapper.vm as any).all_filter, 'Passed') +
      status_count.countOf((wrapper.vm as any).all_filter, 'Failed') +
      status_count.countOf((wrapper.vm as any).all_filter, 'Profile Error') +
      status_count.countOf((wrapper.vm as any).all_filter, 'Not Reviewed');
    expect(recieved).toEqual(expected);
  });

  it('compliance value is accurate', () => {
    removeAllFiles();
    loadAll();
    selectAllFiles();
    compChartWrapper = shallowMount(ComplianceChart, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });

    let expected = Math.round(
      (100.0 * expectedCount('passed')!) /
        (expectedCount('passed')! +
          expectedCount('failed')! +
          expectedCount('notReviewed')! +
          expectedCount('profileError')!)
    );
    expect((compChartWrapper.vm as any).series[0]).toBe(expected);
  });
});

describe('Datatable', () => {
  it('displays correct number of controls with many files', () => {
    removeAllFiles();
    loadAll();
    selectAllFiles();
    controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });
    let expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');
    expect((controlTableWrapper.vm as any).items.length).toBe(expected);
  });

  it('control row and table data is correct', () => {
    expect(
      (controlTableWrapper.vm as any).items
        .map((item: ListElt) => item.control.data.id)
        .sort()
    ).toEqual(
      filter_store
        .controls({
          fromFile: filter_store.selected_file_ids,
          omit_overlayed_controls: true
        })
        .map(c => c.data.id)
        .sort()
    );
  });
});

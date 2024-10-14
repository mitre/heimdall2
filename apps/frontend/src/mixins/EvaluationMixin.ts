import {GroupsModule} from '@/store/groups';
import {IVuetifyItems} from '@/utilities/helper_util';
import {IGroup} from '@heimdall/interfaces';
import {intersectionBy} from 'lodash';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class EvaluationMixin extends Vue {
  convertGroupsToIVuetifyItems(groups: IGroup[] | undefined): IVuetifyItems[] {
    if (!groups) {
      return [];
    }

    return intersectionBy(groups, GroupsModule.myGroups, 'id').map((group) => {
      return {
        text: group.name,
        value: group.id
      };
    });
  }
}

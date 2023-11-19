import {GroupsModule} from '@/store/groups';
import {IGroup} from '@heimdall/interfaces';
import {Component, Vue} from 'vue-property-decorator';
import {IVuetifyItems} from '../utilities/helper_util';

@Component({})
export default class EvaluationMixin extends Vue {
  convertGroupsToIVuetifyItems(groups: IGroup[] | undefined): IVuetifyItems[] {
    if (!groups) {
      return [];
    }

    return GroupsModule.myGroups.map((group) => {
      return {
        text: group.name,
        value: group.id
      };
    });
  }
}

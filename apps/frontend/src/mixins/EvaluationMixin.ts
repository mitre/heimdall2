import {GroupsModule} from '@/store/groups';
import {getAllDescendants} from '@/utilities/group_relations_util';
import {IGroup} from '@heimdall/interfaces';
import {Component, Vue} from 'vue-property-decorator';
import {IVuetifyItems} from '../utilities/helper_util';

@Component({})
export default class EvaluationMixin extends Vue {
  convertGroupsToIVuetifyItems(groups: IGroup[] | undefined): IVuetifyItems[] {
    if (!groups) {
      return [];
    }
    const descendants = groups
      .map((group) => getAllDescendants(group.id))
      .flat()
      .filter(
        (descendantId) => !groups.some((group) => group.id === descendantId)
      );
    return groups
      .concat(
        GroupsModule.allGroups.filter((group) =>
          descendants.some((descendantId) => descendantId === group.id)
        )
      )
      .map((group) => {
        return {
          text: group.name,
          value: group.id
        };
      });
  }
}

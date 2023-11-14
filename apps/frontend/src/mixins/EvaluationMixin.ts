import {ServerModule} from '@/store/server';
import {IGroup} from '@heimdall/interfaces';
import {Component, Vue} from 'vue-property-decorator';
import {IVuetifyItems} from '../utilities/helper_util';

@Component({})
export default class EvaluationMixin extends Vue {
  convertGroupsToIVuetifyItems(groups: IGroup[] | undefined): IVuetifyItems[] {
    const currentUserId = ServerModule.userInfo.id;
    if (!groups) {
      return [];
    }
    const validatedGroups = groups.filter((group) =>
      group.users.some((user) => user.id === currentUserId)
    );

    return validatedGroups.map((group) => {
      return {
        text: group.name,
        value: group.id
      };
    });
  }
}

<template>
  <v-card>
    <v-card-title class="pb-0">
      <GroupModal id="groupModal" :create="true" :admin="adminPanel">
        <template #clickable="{on, attrs}">
          <v-btn
            color="primary"
            data-cy="createNewGroupBtn"
            class="mb-2"
            v-bind="attrs"
            v-on="on"
          >
            Create New Group
          </v-btn>
        </template>
      </GroupModal>
    </v-card-title>
    <v-container>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        dense
        hide-details
      />
    </v-container>
    <v-row class="pa-4" justify="space-between">
      <v-col xs="12" sm="12" lg="5">
        <v-container>
          <v-treeview
            hoverable
            activatable
            :items="groupTree"
            :search="search"
            open-all
            @update:active="setSelectedGroupId"
          >
            <template #label="{item}">
              <span>
                {{ item.name }}
              </span>
            </template>
          </v-treeview>
        </v-container>
      </v-col>
      <v-divider vertical class="hidden-sm-and-down" />
      <v-col xs="12" sm="12" lg="3">
        <v-container>
          <v-scroll-y-transition mode="out-in">
            <v-card v-if="selectedGroup.id === '-1'" flat>
              <v-card-title> No Group Selected. </v-card-title>
            </v-card>
            <v-card v-else :key="selectedGroup.id" flat>
              <v-card-title>
                {{ selectedGroup.name }}
              </v-card-title>
              <v-card-subtitle class="pt-2">
                <v-tooltip color="secondary" right>
                  <template #activator="{on}">
                    <v-icon small title="Info" data-cy="info" v-on="on">
                      mdi-information
                    </v-icon>
                  </template>
                  <v-card
                    color="transparent"
                    flat
                    max-width="600px"
                    overflow-y-auto
                  >
                    <span>
                      <v-card-text>
                        <div>Created At: {{ selectedGroup.createdAt }}</div>
                        <div>Updated At: {{ selectedGroup.updatedAt }}</div>
                      </v-card-text>
                    </span>
                  </v-card>
                </v-tooltip>
                (id={{ selectedGroup.id }})
              </v-card-subtitle>
              <v-card-text>
                <div>
                  <strong>Your Role:</strong>
                  {{
                    selectedGroup.role
                      ? selectedGroup.role === 'owner'
                        ? 'Owner'
                        : 'Member'
                      : 'None'
                  }}
                </div>
                <div>
                  <strong>Visibility:</strong>
                  {{ selectedGroup.public ? 'Public' : 'Private' }}
                </div>
              </v-card-text>
              <v-card-subtitle>
                <strong>Group Description</strong>
              </v-card-subtitle>
              <v-card-text v-if="selectedGroup.desc !== ''">
                <div
                  v-for="(line, index) in selectedGroup.desc.split('\n')"
                  :key="index"
                >
                  {{ line }} <br />
                </div>
              </v-card-text>
              <v-card-text v-else>None</v-card-text>
              <v-card-actions v-if="isOwner || adminPanel">
                <GroupModal
                  id="editGroupModal"
                  :create="false"
                  :admin="adminPanel"
                  :group="selectedGroup"
                  @group-saved="setSelectedGroupId"
                >
                  <template #clickable="{on}">
                    <v-btn title="Edit" data-cy="edit" v-on="on">
                      Edit <v-icon small>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                </GroupModal>
                <v-btn
                  v-if="adminPanel"
                  title="Delete"
                  data-cy="delete"
                  class="ml-2"
                  @click="deleteGroupDialog(selectedGroup)"
                >
                  Delete <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-scroll-y-transition>
        </v-container>
      </v-col>
      <v-divider vertical class="hidden-sm-and-down" />
      <v-col xs="12" sm="12" lg="4">
        <v-tabs v-model="activeTab" fixed-tabs dark>
          <v-tab key="owners"> Owners </v-tab>
          <v-tab key="members"> Members </v-tab>
          <v-tab key="childMembers">Child Members</v-tab>
        </v-tabs>
        <v-tabs-items v-model="activeTab">
          <v-tab-item key="owners">
            <Users v-model="selectedGroup.owners" :editable="false" />
          </v-tab-item>
          <v-tab-item key="members">
            <Users v-model="selectedGroup.members" :editable="false" />
          </v-tab-item>
          <v-tab-item key="childMembers">
            <Users v-model="selectedGroup.childMembers" :editable="false" />
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>
    <ActionDialog
      v-model="dialogDelete"
      type="group"
      message="WARNING: Deleting this group will also delete its all children."
      @cancel="closeActionDialog"
      @confirm="deleteGroupConfirm"
    />
  </v-card>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import GroupModal from '@/components/global/groups/GroupModal.vue';
import Users from '@/components/global/groups/Users.vue';
import {GroupsModule} from '@/store/groups';
import {GroupRelationsModule} from '@/store/group_relations';
import {SnackbarModule} from '@/store/snackbar';
import {IGroup, ISlimUser} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

export type Tree = {
  id: string;
  name: string;
  children?: Tree[];
};
@Component({
  components: {
    ActionDialog,
    GroupModal,
    Users
  }
})
export default class GroupManagement extends Vue {
  @Prop({type: Boolean, default: false}) readonly adminPanel!: boolean;

  editedGroup: IGroup | null = null;
  dialogDelete = false;
  dialogDisplayUsers = false;
  search = '';
  selectedGroupId: string = '-1';
  activeTab = 'owners';

  groupsHeaders: {
    text: string;
    value: string;
    sortable?: boolean;
    align?: string;
  }[] = [
    {
      text: 'ID',
      sortable: true,
      value: 'id'
    },
    {
      text: 'Group Name',
      align: 'start',
      sortable: true,
      value: 'name'
    },
    {
      text: 'Public',
      sortable: true,
      value: 'public'
    },
    {text: 'Your Role', value: 'role', sortable: true},
    {text: 'Owners', value: 'owners', sortable: true},
    {text: 'Members', value: 'members', sortable: true},
    {text: 'Actions', value: 'actions', sortable: false}
  ];

  get selectedGroup(): IGroup & {
    members: ISlimUser[];
    owners: ISlimUser[];
    childMembers: ISlimUser[];
  } {
    const updatedGroup = this.visibleGroups.find(
      (group) => group.id === this.selectedGroupId
    );
    if (updatedGroup) {
      return {
        ...updatedGroup,
        members: updatedGroup.users.filter(
          (user) => user.groupRole === 'member'
        ),
        owners: updatedGroup.users.filter((user) => user.groupRole === 'owner'),
        childMembers: updatedGroup.users.filter(
          (user) => user.groupRole === 'childMember'
        )
      };
    } else {
      return {
        id: '-1',
        name: '',
        role: '',
        public: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        desc: '',
        users: [],
        members: [],
        owners: [],
        childMembers: []
      };
    }
  }

  get isOwner() {
    return this.selectedGroup.role === 'owner';
  }

  setSelectedGroupId(selectedId: string[]) {
    this.selectedGroupId = selectedId[0] || '-1';
  }

  get visibleGroups() {
    let groups: IGroup[] = GroupsModule.myGroups;
    if (this.adminPanel) {
      groups = GroupsModule.myGroups.concat(
        GroupsModule.allGroups.filter(
          (group) =>
            !GroupsModule.myGroups
              .map((myGroup) => myGroup.id)
              .includes(group.id)
        )
      );
    } else {
      groups = GroupsModule.myGroups;
    }
    return groups;
  }

  get groupTree() {
    const baseGroups = this.visibleGroups.filter(
      (group) =>
        !GroupRelationsModule.allGroupRelations.some(
          (relation) => relation.childId === group.id
        )
    );
    return baseGroups.map((group) => {
      return {
        id: group.id,
        name: group.name,
        children: this.getDescendants(group.id)
      };
    });
  }

  getDescendants(parentId: string): Tree[] {
    const adjacentRelations = GroupRelationsModule.allGroupRelations.filter(
      (relation) => relation.parentId === parentId
    );
    return adjacentRelations.map((relation) => {
      const group = GroupsModule.allGroups.find(
        (group) => group.id === relation.childId
      );
      return {
        id: group?.id,
        name: group?.name,
        children: this.getDescendants(group?.id || '-1')
      } as Tree;
    });
  }

  deleteGroupDialog(group: IGroup): void {
    this.editedGroup = group;
    this.dialogDelete = true;
  }

  deleteGroupConfirm(): void {
    if (this.editedGroup) {
      GroupsModule.DeleteGroup(this.editedGroup)
        .then((data) => {
          SnackbarModule.notify(`Successfully deleted group ${data.name}`);
        })
        .finally(async () => {
          // If we do not fetch the group data upon deletion,
          // the tree will not react to the database change
          await GroupsModule.FetchGroupData();
          this.closeActionDialog();
        });
    }
  }

  closeActionDialog() {
    this.dialogDelete = false;
    this.editedGroup = null;
  }

  get loading(): boolean {
    return GroupsModule.loading;
  }

  get groupData(): (IGroup & {members: ISlimUser[]; owners: ISlimUser[]})[] {
    let groups: IGroup[];
    if (this.adminPanel) {
      groups = GroupsModule.myGroups.concat(
        GroupsModule.allGroups.filter(
          (group) =>
            !GroupsModule.myGroups
              .map((myGroup) => myGroup.id)
              .includes(group.id)
        )
      );
    } else {
      groups = GroupsModule.myGroups;
    }
    return groups.map((group) => {
      return {
        ...group,
        members: group.users.filter((user) => user.groupRole === 'member'),
        owners: group.users.filter((user) => user.groupRole === 'owner')
      };
    });
  }
}
</script>

import Users from '@/components/global/groups/Users.vue';
import type {ISlimUser} from '@heimdall/common/interfaces';
import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testing-utils';

addElemWithDataAppToBody();

interface UsersVm {
  currentUsers: ISlimUser[];
  editedUserID: string;
  displayedHeaders: {text: string; value: string}[];
  onUpdateGroupUserRole(newRole: string): boolean;
  deleteUserConfirm(): boolean;
}

function twoOwnersAndAMember(): ISlimUser[] {
  return [
    {
      id: 'u1',
      email: 'one@example.com',
      firstName: 'One',
      lastName: 'Owner',
      groupRole: 'owner'
    },
    {
      id: 'u2',
      email: 'two@example.com',
      firstName: 'Two',
      lastName: 'Owner',
      groupRole: 'owner'
    },
    {
      id: 'u3',
      email: 'three@example.com',
      firstName: 'Three',
      lastName: 'Member',
      groupRole: 'member'
    }
  ];
}

// `editable: false` renders each role as a plain <span> rather than a Vuetify
// v-select, so a role is assertable as row text instead of through the select's
// internals. The methods under test are called directly either way.
function mountUsers(currentUsers: ISlimUser[]) {
  const vuetify = new Vuetify();
  return mount(Users, {
    vuetify,
    propsData: {value: currentUsers, editable: false}
  });
}

function roleCellsOf(wrapper: ReturnType<typeof mountUsers>): string[] {
  return wrapper.findAll('tbody tr').wrappers.map((row) => row.text());
}

describe('Users (group membership table)', () => {
  // Pins the reactivity fix. The array is mutated either way — by the old
  // `currentUsers[i] = x` as much as by `splice` — so asserting on
  // vm.currentUsers would pass against the bug. Vue 2 cannot observe an index
  // write, so only the RENDERED row distinguishes them.
  it('renders a promoted role, not just records it in the array', async () => {
    const wrapper = mountUsers(twoOwnersAndAMember());
    const vm = wrapper.vm as unknown as UsersVm;

    expect(roleCellsOf(wrapper)[2]).toContain('member');

    vm.editedUserID = 'u3';
    vm.onUpdateGroupUserRole('owner');
    await wrapper.vm.$nextTick();

    expect(roleCellsOf(wrapper)[2]).toContain('owner');
    expect(roleCellsOf(wrapper)[2]).not.toContain('member');
  });

  // Pins the `userToUpdate !== -1` guard. getEditedUser() falls back to a fresh
  // {id:'0', email:''} when editedUserID is its default '0', and indexOf on that
  // fresh object returns -1 — so the old `currentUsers[-1] = x` wrote a stray
  // '-1' own property onto the array instead of updating anybody.
  it('does not write a stray "-1" property when no user is being edited', () => {
    const users = twoOwnersAndAMember();
    const wrapper = mountUsers(users);
    const vm = wrapper.vm as unknown as UsersVm;

    expect(vm.editedUserID).toBe('0');
    vm.onUpdateGroupUserRole('owner');

    expect(Object.hasOwn(vm.currentUsers, '-1')).toBe(false);
    expect(vm.currentUsers).toHaveLength(3);
    expect(vm.currentUsers.map((user) => user.groupRole)).toStrictEqual([
      'owner',
      'owner',
      'member'
    ]);
  });

  // Pins the guard in deleteUserConfirm. With editedUserID at its default the
  // indexOf is -1, and the old `this.currentUsers[-1].groupRole` read
  // undefined.groupRole — a TypeError, not a wrong answer.
  it('does not throw when confirming a delete with no user selected', () => {
    const wrapper = mountUsers(twoOwnersAndAMember());
    const vm = wrapper.vm as unknown as UsersVm;

    expect(vm.editedUserID).toBe('0');
    expect(() => vm.deleteUserConfirm()).not.toThrow();
    expect(vm.currentUsers).toHaveLength(3);
  });

  // displayedHeaders is a computed that PUSHES into this.headers. Because
  // this.headers is reactive, that push invalidates the computed's own cache, so
  // every re-evaluation appends another "Actions" column. Four headers plus
  // Actions is five, no matter how many times it is read or re-rendered.
  it('does not accumulate the Actions column when edit mode is toggled', async () => {
    const wrapper = mount(Users, {
      vuetify: new Vuetify(),
      propsData: {value: twoOwnersAndAMember(), editable: true}
    });
    const vm = wrapper.vm as unknown as UsersVm;

    expect(vm.displayedHeaders).toHaveLength(5);

    // Toggling `editable` is the real trigger: it is a dependency of the
    // computed, so each flip back to true re-evaluates the getter. Reading the
    // getter repeatedly is NOT enough — the cache holds — which is why this
    // exercises the prop rather than the data.
    for (let pass = 0; pass < 3; pass++) {
      await wrapper.setProps({editable: false});
      await wrapper.setProps({editable: true});
      expect(vm.displayedHeaders).toHaveLength(5);
    }

    expect(
      vm.displayedHeaders.filter((header) => header.value === 'actions')
    ).toHaveLength(1);
  });

  // The sole owner must still be protected — the guard must not have turned the
  // owner check into a no-op that always reports saveable.
  it('reports not-saveable when deleting the last remaining owner', () => {
    const users: ISlimUser[] = [
      {
        id: 'u1',
        email: 'one@example.com',
        firstName: 'One',
        lastName: 'Owner',
        groupRole: 'owner'
      },
      {
        id: 'u2',
        email: 'two@example.com',
        firstName: 'Two',
        lastName: 'Member',
        groupRole: 'member'
      }
    ];
    const wrapper = mountUsers(users);
    const vm = wrapper.vm as unknown as UsersVm;

    vm.editedUserID = 'u1';
    expect(vm.deleteUserConfirm()).toBe(false);
  });
});

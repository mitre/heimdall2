import { AuthzService } from '../authz/authz.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { EvaluationGroupDto } from './dto/evaluation-group.dto';
import { GroupDto } from './dto/group.dto';
import { RemoveUserFromGroupDto } from './dto/remove-user-from-group.dto';
import { GroupsService } from './groups.service';
export declare class GroupsController {
    private readonly groupsService;
    private readonly usersService;
    private readonly evaluationsService;
    private readonly authz;
    constructor(groupsService: GroupsService, usersService: UsersService, evaluationsService: EvaluationsService, authz: AuthzService);
    findAll(request: {
        user: User;
    }): Promise<GroupDto[]>;
    findForUser(request: {
        user: User;
    }): Promise<GroupDto[]>;
    create(request: {
        user: User;
    }, createGroupDto: CreateGroupDto): Promise<GroupDto>;
    addUserToGroup(id: string, request: {
        user: User;
    }, addUserToGroupDto: AddUserToGroupDto): Promise<GroupDto>;
    removeUserFromGroup(id: string, request: {
        user: User;
    }, removeUserFromGroupDto: RemoveUserFromGroupDto): Promise<GroupDto>;
    addEvaluationToGroup(id: string, request: {
        user: User;
    }, evaluationGroupDto: EvaluationGroupDto): Promise<GroupDto>;
    removeEvaluationFromGroup(id: string, request: {
        user: User;
    }, evaluationGroupDto: EvaluationGroupDto): Promise<GroupDto>;
    findById(request: {
        user: User;
    }, id: string): Promise<GroupDto>;
    update(request: {
        user: User;
    }, id: string, updateGroup: CreateGroupDto): Promise<GroupDto>;
    remove(request: {
        user: User;
    }, id: string): Promise<GroupDto>;
}

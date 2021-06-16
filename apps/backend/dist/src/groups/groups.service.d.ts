import { Evaluation } from '../evaluations/evaluation.model';
import { User } from '../users/user.model';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './group.model';
export declare class GroupsService {
    private readonly groupModel;
    constructor(groupModel: typeof Group);
    findAll(): Promise<Group[]>;
    count(): Promise<number>;
    findByPkBang(id: string): Promise<Group>;
    findByIds(id: string[]): Promise<Group[]>;
    addUserToGroup(group: Group, user: User, role: string): Promise<void>;
    removeUserFromGroup(group: Group, user: User): Promise<Group>;
    addEvaluationToGroup(group: Group, evaluation: Evaluation): Promise<void>;
    removeEvaluationFromGroup(group: Group, evaluation: Evaluation): Promise<Group>;
    create(createGroupDto: CreateGroupDto): Promise<Group>;
    update(groupToUpdate: Group, groupDto: CreateGroupDto): Promise<Group>;
    remove(groupToDelete: Group): Promise<Group>;
}

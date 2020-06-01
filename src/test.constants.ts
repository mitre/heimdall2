import { CreateUserDto } from "./users/dto/create-user.dto";
import { UpdateUserDto } from "./users/dto/update-user.dto";
import { DeleteUserDto } from "./users/dto/delete-user.dto";
import { User } from './users/user.model';
import { UserDto } from "./users/dto/user.dto";

export const ID: number = 7;

// @ts-ignore
export const TEST_USER: User = {
    email: "abc@yahoo.com",
    firstName: "Test",
    lastName: "Dummy",
    role: "user",
    title: "fake title",
    encryptedPassword: "$2b$14$qXq14f2Ttm/Sj2XiIQu3pub67ZkZ.vOalKSSjOiFCkvMZmn5y6Eiy",
    organization: "Fake Org",
}

export const NULL_USER: User = null;

// @ts-ignore
export const USER_ARRAY: User[] = [
    // @ts-ignore
    TEST_USER,
    // @ts-ignore
    { id: 10, email: "fakeemail@yahoo.com" },
];

export const CREATE_USER_DTO_TEST_OBJ: CreateUserDto = {
    email: "abc@yahoo.com",
    password: "Letmein123",
    passwordConfirmation: "Letmein123",
    firstName: "Test",
    lastName: "Dummy",
    title: "fake title",
    organization: "Fake Org",
};

export const UPDATE_USER_DTO_TEST_OBJ: UpdateUserDto = {
    email: "updatedemail@yahoo.com",
    firstName: "Doe",
    lastName: "John",
    organization: "Fake org",
    title: "Fake title",
    password: "Letmein123",
    passwordConfirmation: "Letmein123",
    currentPassword: "Letmein123"
};

export const UPDATE_FAILURE_USER_DTO_TEST_OBJ: UpdateUserDto = {
    email: "updatedemail@yahoo.com",
    firstName: "Doe",
    lastName: "John",
    organization: "Fake Org",
    title: "fake title",
    password: "Letmein12",
    passwordConfirmation: "Letmein12",
    currentPassword: "Letmein12"
};

export const DELETE_USER_DTO_TEST_OBJ: DeleteUserDto = {
    password: "Letmein123"
};

export const DELETE_FAILRE_USER_DTO_TEST_OBJ: DeleteUserDto = {
    password: "Letmein12"
};

// TEST_USER dto
export const USER_ONE_DTO = new UserDto(USER_ARRAY[0]);

export const USER_TWO_DTO = new UserDto(USER_ARRAY[1]);

export const USER_DTO_ARRAY: UserDto[] = [USER_ONE_DTO];

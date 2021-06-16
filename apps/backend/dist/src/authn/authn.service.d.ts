import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
export declare class AuthnService {
    private usersService;
    private readonly configService;
    private jwtService;
    constructor(usersService: UsersService, configService: ConfigService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<User | null>;
    validateOrCreateUser(email: string, firstName: string, lastName: string, creationMethod: string): Promise<User>;
    login(user: {
        id: string;
        email: string;
        role: string;
        forcePasswordChange: boolean | undefined;
    }): Promise<{
        userID: string;
        accessToken: string;
    }>;
    splitName(fullName: string): {
        firstName: string;
        lastName: string;
    };
}

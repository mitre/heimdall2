import { CanActivate } from '@nestjs/common';
export declare class TestGuard implements CanActivate {
    canActivate(): Promise<boolean>;
}

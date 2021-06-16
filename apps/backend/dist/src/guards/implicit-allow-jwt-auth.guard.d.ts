declare const ImplicitAllowJwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class ImplicitAllowJwtAuthGuard extends ImplicitAllowJwtAuthGuard_base {
    handleRequest(_err: any, user: any, _info: any): any;
}
export {};

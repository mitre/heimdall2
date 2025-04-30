import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OktaAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		console.log('in okta guard');
		const request = context.switchToHttp().getRequest();
		console.log(JSON.stringify(request, null, 2));
		console.log(`is authenticated: ${request.isAuthenticated()}`);
		return request.isAuthenticated();
	}
}

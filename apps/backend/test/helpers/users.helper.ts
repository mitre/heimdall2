import {INestApplication} from '@nestjs/common';
import request, {Test} from 'supertest';
import {UpdateUserDto} from '../../src/users/dto/update-user.dto';

export function register(
  app: INestApplication,
  user: {email: string; password: string; passwordConfirmation: string}
): Test {
  return request(app.getHttpServer())
    .post('/users')
    .set('Content-Type', 'application/json')
    .send(user);
}

export function update(
  app: INestApplication,
  userId: string,
  user: UpdateUserDto,
  authorizationJWT: string
): Test {
  return request(app.getHttpServer())
    .put('/users/' + userId)
    .set('Authorization', 'bearer ' + authorizationJWT)
    .send(user);
}

export function login(
  app: INestApplication,
  user: {email: string; password: string}
): Test {
  return request(app.getHttpServer())
    .post('/authn/login')
    .set('Content-Type', 'application/json')
    .send(user);
}

export function destroy(
  app: INestApplication,
  userId: string,
  user: {password?: string},
  authorizationJWT: string
): Test {
  return request(app.getHttpServer())
    .delete('/users/' + userId)
    .set('Authorization', 'bearer ' + authorizationJWT)
    .send(user);
}

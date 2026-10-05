import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';
import type { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export class UsersTestManager {
   constructor(private readonly app: INestApplication) {}

   async createUser(input: CreateUserInputDto): Promise<UserViewDto> {
      // Создаём пользователя через HTTP API приложения.
      const response = await request(this.app.getHttpServer())
         .post(`/${GLOBAL_PREFIX}/users`)
         .auth('admin', 'qwerty')
         .send(input)
         .expect(201);

      return response.body;
   }
}

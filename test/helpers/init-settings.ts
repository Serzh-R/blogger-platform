import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './users-test-manager';

export const initSettings = async () => {
   // Создаём тестовый модуль на основе модулей приложения.
   const testingModule = await Test.createTestingModule({
      imports: [AppModule],
   }).compile();

   const app = testingModule.createNestApplication();

   // Применяем те же настройки, что используются в main.ts.
   appSetup(app);

   await app.init();

   const usersTestManager = new UsersTestManager(app);

   return {
      app,
      usersTestManager,
   };
};

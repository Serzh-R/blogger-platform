import { Test } from '@nestjs/testing';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { UsersTestManager } from './users-test-manager';

export const initSettings = async (
   // ДОБАВЛЕНО: дополнительные настройки конкретного набора тестов.
   addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
   // Создаём builder тестового модуля.
   const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
   });

   // ДОБАВЛЕНО: применяем дополнительные настройки до компиляции.
   if (addSettingsToModuleBuilder) {
      addSettingsToModuleBuilder(testingModuleBuilder);
   }

   const testingModule = await testingModuleBuilder.compile();

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

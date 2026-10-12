import type { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user.input-dto';

export const createUserTestData = (
   customData: Partial<CreateUserInputDto> = {},
): CreateUserInputDto => {
   // Каждый вызов возвращает новый объект с данными пользователя.
   return {
      login: 'testuser',
      email: 'testuser@example.com',
      password: 'Test12345',

      // Переданные поля заменяют соответствующие стандартные значения.
      ...customData,
   };
};

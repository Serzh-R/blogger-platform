import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CoreConfig } from '../../src/core/core.config';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export const deleteAllData = async (app: INestApplication): Promise<void> => {
   // Проверяем выбранную базу перед очисткой.
   expect(app.get(CoreConfig).dbName).toBe('blogger_platform_test');

   // Очищаем данные и проверяем успешный ответ.
   await request(app.getHttpServer())
      .delete(`/${GLOBAL_PREFIX}/testing/all-data`)
      .expect(204);
};

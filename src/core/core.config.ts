import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

@Injectable()
export class CoreConfig {
   @IsNotEmpty({ message: 'Задайте переменную окружения MONGO_URL' })
   mongoUrl: string;

   @IsNotEmpty({ message: 'Задайте имя базы данных DB_NAME' })
   dbName: string;

   constructor(private configService: ConfigService<any, true>) {
      this.mongoUrl = this.configService.get('MONGO_URL');
      this.dbName =
         this.configService.get('DB_NAME') || 'blogger_platform_local';

      configValidationUtility.validateConfig(this);
   }
}

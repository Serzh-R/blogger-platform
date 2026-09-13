import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SETTINGS } from './core/settings';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { APP_FILTER } from '@nestjs/core';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';

@Module({
   imports: [
      MongooseModule.forRoot(SETTINGS.MONGO_URL, {
         dbName: SETTINGS.DB_NAME,
      }),
      UserAccountsModule,
      BloggersPlatformModule,
      TestingModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { CqrsModule } from '@nestjs/cqrs';
import { configModule } from './config-dynamic-module';
import { CoreModule } from './core/core.module';
import { CoreConfig } from './core/core.config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
   imports: [
      configModule,
      CoreModule,
      CqrsModule.forRoot(),

      ThrottlerModule.forRoot([
         {
            ttl: 10_000,
            limit: 5,
         },
      ]),

      MongooseModule.forRootAsync({
         useFactory: (coreConfig: CoreConfig) => ({
            uri: coreConfig.mongoUrl,
            dbName: coreConfig.dbName,
         }),
         inject: [CoreConfig],
      }),
      UserAccountsModule,
      BloggersPlatformModule,
      TestingModule,
   ],
   controllers: [AppController],
   providers: [AppService],
})
export class AppModule {}

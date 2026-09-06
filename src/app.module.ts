import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import {MongooseModule} from '@nestjs/mongoose'
import {SETTINGS} from './core/settings'

@Module({
  imports: [
    MongooseModule.forRoot(SETTINGS.MONGO_URL, {
      dbName: SETTINGS.DB_NAME,
    }),
    UserAccountsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

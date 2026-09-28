import {
   Controller,
   Delete,
   Get,
   HttpCode,
   HttpStatus,
   Param,
   Req,
   UseGuards,
} from '@nestjs/common';
import { SecurityDevicesQueryRepository } from '../infrastructure/query/security-devices.query-repository';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import type { UserContextDto } from '../guards/dto/user-context.dto';
import { DeviceSessionViewDto } from './view-dto/device-session.view-dto';
import { RefreshTokenGuard } from '../guards/refresh/refresh-token.guard';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherDevicesCommand } from '../application/usecases/delete-other-devices.usecase';
import { DeleteDeviceByIdCommand } from '../application/usecases/delete-device-by-id.usecase';

@Controller('security/devices')
export class SecurityDevicesController {
   constructor(
      private readonly commandBus: CommandBus,
      private readonly securityDevicesQueryRepository: SecurityDevicesQueryRepository,
   ) {}

   @Get()
   @UseGuards(RefreshTokenGuard)
   getDevices(
      @ExtractUserFromRequest() user: UserContextDto,
   ): Promise<DeviceSessionViewDto[]> {
      return this.securityDevicesQueryRepository.findAllByUserId(user.userId);
   }

   @Delete()
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(RefreshTokenGuard)
   async deleteOtherDevices(
      @Req()
      request: Request & {
         user: {
            userId: string;
            deviceId: string;
         };
      },
   ): Promise<void> {
      await this.commandBus.execute<DeleteOtherDevicesCommand, void>(
         new DeleteOtherDevicesCommand(
            request.user.userId,
            request.user.deviceId,
         ),
      );
   }

   @Delete(':deviceId')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(RefreshTokenGuard)
   async deleteDeviceById(
      @Param('deviceId') deviceId: string,
      @Req()
      request: Request & {
         user: {
            userId: string;
         };
      },
   ): Promise<void> {
      await this.commandBus.execute<DeleteDeviceByIdCommand, void>(
         new DeleteDeviceByIdCommand(deviceId, request.user.userId),
      );
   }
}

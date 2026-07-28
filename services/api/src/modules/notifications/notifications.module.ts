import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NOTIFICATIONS_QUEUE } from "./notifications.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsService, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}

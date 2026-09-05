import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { PrismaService } from "./prisma.service";
import { TestRegisterController } from "./test-register.controller";
import { OtpController } from "./otp/otp.controller";
import { OtpService } from "./otp/otp.service";
import { CardsModule } from "./cards/cards.module";
import { WalletModule } from "./wallet/wallet.module";

@Module({
  imports: [AuthModule, CardsModule, WalletModule],
  controllers: [TestRegisterController, OtpController],
  providers: [PrismaService, OtpService],
  exports: [PrismaService],
})
export class AppModule {}

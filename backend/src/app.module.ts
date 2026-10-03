import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaService } from "./prisma.service";
import { TestRegisterController } from "./test-register.controller";
import { OtpController } from "./otp/otp.controller";
import { OtpService } from "./otp/otp.service";
import { CardsModule } from "./cards/cards.module";
import { WalletModule } from "./wallet/wallet.module";
import { TransfersModule } from "./transfers/transfers.module";
import { PaymentsModule } from "./payments/payments.module";
import { MerchantsModule } from "./merchants/merchants.module";
import { CashiersModule } from "./cashiers/cashiers.module";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { SmsVerificationService } from "./otp/sms-verification.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CardsModule,
    WalletModule,
    TransfersModule,
    PaymentsModule,
    MerchantsModule,
    CashiersModule,
    AdminModule,
  ],
  controllers: [AppController, TestRegisterController, OtpController],
  providers: [PrismaService, OtpService, SmsVerificationService],
  exports: [PrismaService],
})
export class AppModule {}

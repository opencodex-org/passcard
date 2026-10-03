import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { randomUUID } from "node:crypto";

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async transfer(
    senderId: string,
    recipientEmail: string,
    amountMinor: number,
  ) {
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new BadRequestException("Invalid amount");
    }

    const recipient = await this.prisma.user.findUnique({
      where: { email: recipientEmail.trim().toLowerCase() },
      include: { wallet: true },
    });

    if (!recipient) throw new NotFoundException("Recipient not found");
    if (recipient.id === senderId) {
      throw new BadRequestException("Cannot transfer to yourself");
    }
    if (!recipient.wallet) {
      throw new BadRequestException("Recipient wallet not found");
    }

    const senderWallet = await this.prisma.wallet.findUnique({
      where: { userId: senderId },
    });

    if (!senderWallet) throw new NotFoundException("Sender wallet not found");

    if (senderWallet.balanceMinor < amountMinor) {
      throw new BadRequestException("Insufficient balance");
    }

    const reference = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.wallet.updateMany({
        where: {
          id: senderWallet.id,
          balanceMinor: { gte: amountMinor },
        },
        data: { balanceMinor: { decrement: amountMinor } },
      });
      if (debit.count !== 1) {
        throw new BadRequestException("Insufficient balance");
      }

      await tx.wallet.update({
        where: { id: recipient.wallet!.id },
        data: { balanceMinor: { increment: amountMinor } },
      });

      await tx.transaction.createMany({
        data: [
          {
            userId: senderId,
            walletId: senderWallet.id,
            amountMinor: -amountMinor,
            type: "TRANSFER_OUT",
            status: "COMPLETED",
            reference: `${reference}-OUT`,
            description: `Transfer to ${recipient.email}`,
          },
          {
            userId: recipient.id,
            walletId: recipient.wallet!.id,
            amountMinor,
            type: "TRANSFER_IN",
            status: "COMPLETED",
            reference: `${reference}-IN`,
            description: `Transfer from sender`,
          },
        ],
      });

      return {
        success: true,
        message: "Transfer completed successfully.",
        amountMinor,
        recipient: {
          id: recipient.id,
          email: recipient.email,
        },
      };
    });
  }
}

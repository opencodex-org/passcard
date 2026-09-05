import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    return {
      success: true,
      wallet: {
        id: wallet.id,
        balanceMinor: wallet.balanceMinor,
        points: wallet.points,
        transactions: wallet.transactions,
      },
    };
  }
}

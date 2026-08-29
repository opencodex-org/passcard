import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminReviewDto } from "./dto/admin-review.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";

@Injectable()
export class AdminService {
  getDashboard() {
    return {
      success: true,
      pendingCardRequests: 0,
      pendingVerifications: 0,
      users: 0,
      childrenAccounts: 0,
      status: "operational",
    };
  }

  reviewCardRequest(
    requestId: string,
    data: AdminReviewDto,
  ) {
    if (!requestId) {
      throw new NotFoundException("Card request not found");
    }

    return {
      success: true,
      requestId,
      decision: data.decision,
      reason: data.reason ?? null,
      reviewedAt: new Date().toISOString(),
    };
  }

  userAction(
    userId: string,
    data: AdminUserActionDto,
  ) {
    if (!userId) {
      throw new NotFoundException("User not found");
    }

    return {
      success: true,
      userId,
      action: data.action,
      reason: data.reason ?? null,
      updatedAt: new Date().toISOString(),
    };
  }
}

import { Injectable } from "@nestjs/common";

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
}

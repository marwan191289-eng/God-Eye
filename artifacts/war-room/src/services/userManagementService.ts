import { v4 as uuidv4 } from 'uuid';

export interface ManagedUser {
  id: string;
  clerkId?: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'banned' | 'suspended' | 'deleted';
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  lastLogin?: Date;
  totalTrades: number;
  totalVolume: number;
  totalFees: number;
  walletCount: number;
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: string; // Admin ID who banned the user
  suspendedUntil?: Date;
  metadata?: Record<string, any>;
}

export interface UserBanRecord {
  id: string;
  userId: string;
  bannedBy: string; // Admin ID
  reason: string;
  banType: 'permanent' | 'temporary';
  bannedAt: Date;
  unbannedAt?: Date;
  notes?: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

class UserManagementService {
  private users: Map<string, ManagedUser> = new Map();
  private banRecords: Map<string, UserBanRecord> = new Map();
  private activityLogs: UserActivityLog[] = [];

  /**
   * Get user by ID
   */
  getUser(userId: string): ManagedUser | null {
    return this.users.get(userId) || null;
  }

  /**
   * Get all users
   */
  getAllUsers(filter?: { status?: string; kycStatus?: string }): ManagedUser[] {
    let users = Array.from(this.users.values());

    if (filter?.status) {
      users = users.filter((u) => u.status === filter.status);
    }

    if (filter?.kycStatus) {
      users = users.filter((u) => u.kycStatus === filter.kycStatus);
    }

    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Search users
   */
  searchUsers(query: string): ManagedUser[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (u) =>
        u.email.toLowerCase().includes(lowerQuery) ||
        u.firstName.toLowerCase().includes(lowerQuery) ||
        u.lastName.toLowerCase().includes(lowerQuery) ||
        u.id.includes(query)
    );
  }

  /**
   * Ban user
   */
  banUser(userId: string, adminId: string, reason: string, banType: 'permanent' | 'temporary' = 'permanent', suspendDays?: number): UserBanRecord {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    user.status = 'banned';
    user.banReason = reason;
    user.bannedAt = new Date();
    user.bannedBy = adminId;

    if (banType === 'temporary' && suspendDays) {
      user.status = 'suspended';
      user.suspendedUntil = new Date(Date.now() + suspendDays * 24 * 60 * 60 * 1000);
    }

    const banRecord: UserBanRecord = {
      id: uuidv4(),
      userId,
      bannedBy: adminId,
      reason,
      banType,
      bannedAt: new Date(),
    };

    this.banRecords.set(banRecord.id, banRecord);
    this.logActivity(userId, 'user_banned', { reason, banType, adminId });

    return banRecord;
  }

  /**
   * Unban user
   */
  unbanUser(userId: string, adminId: string, reason?: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.status = 'active';
    user.banReason = undefined;
    user.bannedAt = undefined;
    user.bannedBy = undefined;
    user.suspendedUntil = undefined;

    // Update ban record
    const banRecord = Array.from(this.banRecords.values()).find((r) => r.userId === userId && !r.unbannedAt);
    if (banRecord) {
      banRecord.unbannedAt = new Date();
      banRecord.notes = reason;
    }

    this.logActivity(userId, 'user_unbanned', { reason, adminId });
    return true;
  }

  /**
   * Delete user
   */
  deleteUser(userId: string, adminId: string, reason?: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.status = 'deleted';
    this.logActivity(userId, 'user_deleted', { reason, adminId });

    return true;
  }

  /**
   * Get user ban history
   */
  getUserBanHistory(userId: string): UserBanRecord[] {
    return Array.from(this.banRecords.values()).filter((r) => r.userId === userId);
  }

  /**
   * Get user activity logs
   */
  getUserActivityLogs(userId: string, limit: number = 100): UserActivityLog[] {
    return this.activityLogs
      .filter((l) => l.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Log user activity
   */
  private logActivity(userId: string, action: string, details: Record<string, any>): void {
    const log: UserActivityLog = {
      id: uuidv4(),
      userId,
      action,
      details,
      timestamp: new Date(),
    };

    this.activityLogs.push(log);
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;

    const userLogs = this.activityLogs.filter((l) => l.userId === userId);

    return {
      user,
      totalActivities: userLogs.length,
      lastActivity: userLogs[userLogs.length - 1]?.timestamp,
      banHistory: this.getUserBanHistory(userId),
    };
  }

  /**
   * Get platform statistics
   */
  getPlatformStats() {
    const users = Array.from(this.users.values());
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const bannedUsers = users.filter((u) => u.status === 'banned').length;
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
    const verifiedUsers = users.filter((u) => u.kycStatus === 'verified').length;

    const totalVolume = users.reduce((sum, u) => sum + u.totalVolume, 0);
    const totalFees = users.reduce((sum, u) => sum + u.totalFees, 0);
    const totalTrades = users.reduce((sum, u) => sum + u.totalTrades, 0);

    return {
      totalUsers: users.length,
      activeUsers,
      bannedUsers,
      suspendedUsers,
      verifiedUsers,
      totalVolume,
      totalFees,
      totalTrades,
      averageVolume: users.length > 0 ? totalVolume / users.length : 0,
      averageFees: users.length > 0 ? totalFees / users.length : 0,
    };
  }

  /**
   * Update user KYC status
   */
  updateUserKYC(userId: string, status: 'pending' | 'verified' | 'rejected', adminId?: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.kycStatus = status;
    this.logActivity(userId, 'kyc_updated', { status, adminId });

    return true;
  }

  /**
   * Get users by status
   */
  getUsersByStatus(status: 'active' | 'banned' | 'suspended' | 'deleted'): ManagedUser[] {
    return Array.from(this.users.values()).filter((u) => u.status === status);
  }

  /**
   * Export user data
   */
  exportUserData(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;

    return {
      user,
      activityLogs: this.getUserActivityLogs(userId),
      banHistory: this.getUserBanHistory(userId),
    };
  }

  /**
   * Bulk update user status
   */
  bulkUpdateUserStatus(userIds: string[], status: 'active' | 'banned' | 'suspended', adminId: string, reason?: string): number {
    let updated = 0;

    for (const userId of userIds) {
      const user = this.users.get(userId);
      if (user) {
        user.status = status;
        if (status === 'banned') {
          user.banReason = reason;
          user.bannedBy = adminId;
        }
        this.logActivity(userId, 'bulk_status_update', { status, reason, adminId });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Get all activity logs (admin view)
   */
  getAllActivityLogs(limit: number = 1000): UserActivityLog[] {
    return this.activityLogs.slice(-limit).reverse();
  }

  /**
   * Create mock user (for testing)
   */
  createMockUser(email: string, firstName: string, lastName: string): ManagedUser {
    const userId = uuidv4();
    const user: ManagedUser = {
      id: userId,
      email,
      firstName,
      lastName,
      status: 'active',
      kycStatus: 'pending',
      createdAt: new Date(),
      totalTrades: 0,
      totalVolume: 0,
      totalFees: 0,
      walletCount: 0,
    };

    this.users.set(userId, user);
    return user;
  }
}

export const userManagementService = new UserManagementService();

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface TwoFactorVerifyRequest {
  userId: string;
  token: string;
}

interface KYCVerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  country: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  documentType: 'passport' | 'national_id' | 'driver_license' | 'residence_permit';
  documentNumber: string;
  documentImageFront: string; // base64
  documentImageBack?: string; // base64
  selfieImage: string; // base64
}

interface FacialRecognitionResult {
  passed: boolean;
  score: number;
  confidence: number;
}

interface DeviceFingerprintData {
  userAgent: string;
  ipAddress: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

/**
 * Authentication Service
 * Handles 2FA, KYC, Facial Recognition, Device Fingerprinting, and Security
 */
export class AuthenticationService {
  /**
   * Setup Two-Factor Authentication (Authenticator App)
   */
  static async setupTwoFactorAuthenticator(userId: string): Promise<TwoFactorSetupResponse> {
    const secret = speakeasy.generateSecret({
      name: `TradeXRay AI (${userId})`,
      issuer: 'TradeXRay AI',
      length: 32,
    });

    // Generate QR Code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify Two-Factor Authentication Token
   */
  static verifyTwoFactorToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  /**
   * Verify Backup Code
   */
  static verifyBackupCode(backupCode: string, storedBackupCodes: string[]): boolean {
    return storedBackupCodes.includes(backupCode);
  }

  /**
   * Generate Device Fingerprint
   */
  static generateDeviceFingerprint(data: DeviceFingerprintData): string {
    const fingerprint = `${data.userAgent}|${data.ipAddress}|${data.screenResolution}|${data.timezone}|${data.language}|${data.platform}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Validate IP Address
   */
  static isIPInWhitelist(ipAddress: string, whitelist: string[]): boolean {
    return whitelist.includes(ipAddress) || this.isIPInCIDR(ipAddress, whitelist);
  }

  /**
   * Check if IP is in CIDR range
   */
  static isIPInCIDR(ip: string, cidrList: string[]): boolean {
    // Simplified CIDR check - in production, use a proper library
    for (const cidr of cidrList) {
      if (cidr.includes('/')) {
        // Basic CIDR matching
        const [network] = cidr.split('/');
        if (ip.startsWith(network.substring(0, network.lastIndexOf('.')))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Detect Suspicious Login Activity
   */
  static detectSuspiciousActivity(
    currentLogin: DeviceFingerprintData,
    previousLogins: DeviceFingerprintData[]
  ): { isSuspicious: boolean; reason?: string } {
    if (previousLogins.length === 0) {
      return { isSuspicious: false };
    }

    const lastLogin = previousLogins[previousLogins.length - 1];

    // Check for impossible travel (different countries in short time)
    if (currentLogin.timezone !== lastLogin.timezone) {
      return {
        isSuspicious: true,
        reason: 'Login from different timezone detected',
      };
    }

    // Check for unusual device
    if (currentLogin.userAgent !== lastLogin.userAgent) {
      return {
        isSuspicious: true,
        reason: 'Login from new device detected',
      };
    }

    return { isSuspicious: false };
  }

  /**
   * Generate OTP for Email/SMS Verification
   */
  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Hash Password (should use bcrypt in production)
   */
  static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify Password
   */
  static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Generate Secure Token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Email Format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Password Strength
   */
  static validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Password must be at least 8 characters');

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Password must contain lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Password must contain uppercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Password must contain numbers');

    if (/[!@#$%^&*]/.test(password)) score++;
    else feedback.push('Password must contain special characters (!@#$%^&*)');

    return {
      isStrong: score >= 4,
      score,
      feedback,
    };
  }

  /**
   * Detect Phishing Attempts
   */
  static detectPhishingAttempts(
    email: string,
    loginHistory: Array<{ email: string; timestamp: number }>
  ): { isPhishing: boolean; reason?: string } {
    // Check for similar email addresses (typosquatting)
    const emailDomain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'tradexray.ai'];

    if (!commonDomains.includes(emailDomain)) {
      // Check for similar domains
      for (const domain of commonDomains) {
        if (this.isSimilarString(emailDomain, domain)) {
          return {
            isPhishing: true,
            reason: 'Similar domain detected (possible typosquatting)',
          };
        }
      }
    }

    // Check for multiple failed login attempts
    const recentFailedAttempts = loginHistory.filter(
      (log) => Date.now() - log.timestamp < 3600000 // Last hour
    );

    if (recentFailedAttempts.length > 5) {
      return {
        isPhishing: true,
        reason: 'Multiple failed login attempts detected',
      };
    }

    return { isPhishing: false };
  }

  /**
   * Check String Similarity (Levenshtein Distance)
   */
  static isSimilarString(str1: string, str2: string, threshold: number = 0.8): boolean {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = (maxLength - distance) / maxLength;
    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein Distance
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate KYC Verification Request
   */
  static async generateKYCVerificationRequest(
    request: KYCVerificationRequest
  ): Promise<{
    kycId: string;
    status: string;
    nextSteps: string[];
  }> {
    // In production, this would call a KYC verification service
    const kycId = crypto.randomUUID();

    return {
      kycId,
      status: 'pending_review',
      nextSteps: [
        'Document verification in progress',
        'Facial recognition verification',
        'Address verification',
      ],
    };
  }

  /**
   * Validate KYC Data
   */
  static validateKYCData(request: KYCVerificationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.firstName || request.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!request.lastName || request.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!request.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    if (!request.nationality) {
      errors.push('Nationality is required');
    }

    if (!request.country) {
      errors.push('Country is required');
    }

    if (!request.city) {
      errors.push('City is required');
    }

    if (!request.postalCode) {
      errors.push('Postal code is required');
    }

    if (!request.streetAddress) {
      errors.push('Street address is required');
    }

    if (!request.documentNumber) {
      errors.push('Document number is required');
    }

    if (!request.documentImageFront) {
      errors.push('Front document image is required');
    }

    if (!request.selfieImage) {
      errors.push('Selfie image is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Rate Limiting Check
   */
  static checkRateLimit(
    attempts: Array<{ timestamp: number }>,
    maxAttempts: number = 5,
    windowMs: number = 900000 // 15 minutes
  ): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const recentAttempts = attempts.filter((a) => now - a.timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts.map((a) => a.timestamp));
      const resetTime = oldestAttempt + windowMs;

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime,
      };
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - recentAttempts.length,
    };
  }

  /**
   * Session Validation
   */
  static validateSession(
    sessionToken: string,
    storedToken: string,
    expiryTime: number,
    currentTime: number = Date.now()
  ): { isValid: boolean; reason?: string } {
    if (sessionToken !== storedToken) {
      return { isValid: false, reason: 'Invalid session token' };
    }

    if (currentTime > expiryTime) {
      return { isValid: false, reason: 'Session expired' };
    }

    return { isValid: true };
  }

  /**
   * Generate CSRF Token
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate CSRF Token
   */
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
  }
}

export default AuthenticationService;

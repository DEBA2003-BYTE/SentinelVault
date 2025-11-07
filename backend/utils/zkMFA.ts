import crypto from 'crypto';
import { MFASecret } from '../models/MFASecret';

export interface MFAProof {
  secretType: string;
  proof: string;
  publicSignals: string[];
  nullifierHash: string;
}

export interface MFAChallenge {
  challengeId: string;
  challenge: string;
  requiredFactors: string[];
  expiresAt: Date;
}

export class ZKMFAService {
  /**
   * Generate MFA challenge requiring multiple factors
   */
  static generateMFAChallenge(requiredFactors: string[]): MFAChallenge {
    const challengeId = crypto.randomUUID();
    const challenge = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    return {
      challengeId,
      challenge,
      requiredFactors,
      expiresAt
    };
  }

  /**
   * Generate ZK proof for a secret without revealing it
   */
  static async generateSecretProof(
    secretType: string,
    secretValue: string,
    challenge: string,
    salt: string
  ): Promise<MFAProof> {
    // Hash the secret with salt
    const secretHash = crypto
      .createHash('sha256')
      .update(secretValue + salt)
      .digest('hex');

    // Create proof data
    const proofData = {
      secretHash,
      challenge,
      timestamp: Date.now()
    };

    // Generate ZK proof (simulated)
    const proof = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    // Generate nullifier
    const nullifierHash = crypto
      .createHash('sha256')
      .update(secretHash + challenge)
      .digest('hex');

    return {
      secretType,
      proof,
      publicSignals: [
        secretType,
        challenge,
        Date.now().toString()
      ],
      nullifierHash
    };
  }

  /**
   * Verify MFA proof without accessing the original secret
   */
  static async verifyMFAProof(
    userId: string,
    proof: MFAProof,
    challenge: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Find the user's MFA secret
      const mfaSecret = await MFASecret.findOne({
        userId,
        secretType: proof.secretType,
        isActive: true
      });

      if (!mfaSecret) {
        return {
          valid: false,
          reason: `MFA secret not found for type: ${proof.secretType}`
        };
      }

      // Check if account is locked
      if (mfaSecret.lockedUntil && mfaSecret.lockedUntil > new Date()) {
        return {
          valid: false,
          reason: 'Account temporarily locked due to failed attempts'
        };
      }

      // Verify challenge matches
      const providedChallenge = proof.publicSignals[1];
      if (providedChallenge !== challenge) {
        await this.handleFailedAttempt(mfaSecret);
        return {
          valid: false,
          reason: 'Challenge mismatch'
        };
      }

      // Check timestamp
      const proofTimestamp = parseInt(proof.publicSignals[2]);
      const now = Date.now();
      const maxAge = 2 * 60 * 1000; // 2 minutes for MFA

      if (now - proofTimestamp > maxAge) {
        return {
          valid: false,
          reason: 'Proof expired'
        };
      }

      // In a real implementation, verify the cryptographic proof here
      // For demo, we'll simulate verification
      const isValidProof = proof.proof.length === 64;

      if (!isValidProof) {
        await this.handleFailedAttempt(mfaSecret);
        return {
          valid: false,
          reason: 'Invalid cryptographic proof'
        };
      }

      // Reset failed attempts on success
      mfaSecret.failedAttempts = 0;
      mfaSecret.lastUsed = new Date();
      mfaSecret.lockedUntil = undefined;
      await mfaSecret.save();

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Register a new MFA secret
   */
  static async registerMFASecret(
    userId: string,
    secretType: string,
    secretValue: string,
    metadata?: any
  ): Promise<{ success: boolean; secretId?: string; error?: string }> {
    try {
      // Generate salt
      const salt = crypto.randomBytes(16).toString('hex');

      // Create commitment (hash of secret + salt)
      const secretCommitment = crypto
        .createHash('sha256')
        .update(secretValue + salt)
        .digest('hex');

      // Deactivate existing secrets of the same type
      await MFASecret.updateMany(
        { userId, secretType },
        { isActive: false }
      );

      // Create new MFA secret
      const mfaSecret = new MFASecret({
        userId,
        secretType,
        secretCommitment,
        salt,
        metadata
      });

      await mfaSecret.save();

      return {
        success: true,
        secretId: mfaSecret._id.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle failed authentication attempt
   */
  private static async handleFailedAttempt(mfaSecret: any): Promise<void> {
    mfaSecret.failedAttempts += 1;

    // Lock account after 5 failed attempts
    if (mfaSecret.failedAttempts >= 5) {
      mfaSecret.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await mfaSecret.save();
  }

  /**
   * Get user's registered MFA factors
   */
  static async getUserMFAFactors(userId: string): Promise<Array<{
    type: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed?: Date;
    metadata?: any;
  }>> {
    const factors = await MFASecret.find({ userId }).select('-secretCommitment -salt');
    
    return factors.map(factor => ({
      type: factor.secretType,
      isActive: factor.isActive,
      createdAt: factor.createdAt,
      lastUsed: factor.lastUsed,
      metadata: factor.metadata
    }));
  }

  /**
   * Verify multiple MFA factors
   */
  static async verifyMultipleFactors(
    userId: string,
    proofs: MFAProof[],
    challenge: string,
    requiredFactors: string[]
  ): Promise<{ valid: boolean; verifiedFactors: string[]; missingFactors: string[]; reason?: string }> {
    const verifiedFactors: string[] = [];
    const missingFactors: string[] = [];

    // Check each required factor
    for (const requiredFactor of requiredFactors) {
      const proof = proofs.find(p => p.secretType === requiredFactor);
      
      if (!proof) {
        missingFactors.push(requiredFactor);
        continue;
      }

      const verification = await this.verifyMFAProof(userId, proof, challenge);
      if (verification.valid) {
        verifiedFactors.push(requiredFactor);
      } else {
        missingFactors.push(requiredFactor);
      }
    }

    const allFactorsVerified = missingFactors.length === 0;

    return {
      valid: allFactorsVerified,
      verifiedFactors,
      missingFactors,
      reason: allFactorsVerified ? undefined : `Missing or invalid factors: ${missingFactors.join(', ')}`
    };
  }

  /**
   * Get available MFA factor types
   */
  static getAvailableFactorTypes(): Array<{
    type: string;
    name: string;
    description: string;
    security: 'low' | 'medium' | 'high';
    setup: 'easy' | 'medium' | 'complex';
  }> {
    return [
      {
        type: 'pin_hash',
        name: 'PIN Code',
        description: 'Numeric PIN (4-8 digits)',
        security: 'medium',
        setup: 'easy'
      },
      {
        type: 'biometric_hash',
        name: 'Biometric',
        description: 'Fingerprint, face, or iris scan',
        security: 'high',
        setup: 'medium'
      },
      {
        type: 'pattern_hash',
        name: 'Pattern Lock',
        description: 'Visual pattern on grid',
        security: 'medium',
        setup: 'easy'
      },
      {
        type: 'voice_hash',
        name: 'Voice Recognition',
        description: 'Voice biometric pattern',
        security: 'high',
        setup: 'complex'
      },
      {
        type: 'behavioral_hash',
        name: 'Behavioral Biometric',
        description: 'Typing pattern or mouse movement',
        security: 'high',
        setup: 'complex'
      }
    ];
  }
}

export default ZKMFAService;
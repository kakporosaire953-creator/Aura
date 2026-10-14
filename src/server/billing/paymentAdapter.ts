import crypto from 'crypto';
import { PlanId } from '../../shared/plans.ts';

export type PaymentProvider = 'fedapay' | 'kkiapay' | 'stripe' | 'none';

export interface PaymentGatewayConfig {
  provider: PaymentProvider;
  isConfigured: boolean;
  currency: string;
  supportedMethodsFr: string[];
  supportedMethodsEn: string[];
  statusMessageFr: string;
  statusMessageEn: string;
}

export interface WebhookEventPayload {
  eventId: string;
  provider: PaymentProvider;
  eventType: string;
  userId?: string;
  planId?: PlanId;
  amount?: number;
  currency?: string;
  status: 'succeeded' | 'failed' | 'pending';
  rawPayload: unknown;
}

export class PaymentGatewayService {
  /**
   * Inspects server environment to detect which payment gateway is configured.
   * Priority given to local West African gateways (FedaPay, Kkiapay) and Stripe.
   */
  getGatewayStatus(): PaymentGatewayConfig {
    const hasFedaPay = Boolean(process.env.FEDAPAY_SECRET_KEY && process.env.FEDAPAY_SECRET_KEY.trim());
    const hasKkiapay = Boolean(process.env.KKIAPAY_PRIVATE_KEY && process.env.KKIAPAY_PRIVATE_KEY.trim());
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim());

    if (hasFedaPay) {
      return {
        provider: 'fedapay',
        isConfigured: true,
        currency: 'XOF',
        supportedMethodsFr: ['MTN Mobile Money', 'Moov Money', 'Cartes Bancaires Visa & Mastercard'],
        supportedMethodsEn: ['MTN Mobile Money', 'Moov Money', 'Visa & Mastercard Cards'],
        statusMessageFr: 'Passerelle FedaPay active (Bénin & Afrique de l’Ouest).',
        statusMessageEn: 'FedaPay gateway active (Benin & West Africa).',
      };
    }

    if (hasKkiapay) {
      return {
        provider: 'kkiapay',
        isConfigured: true,
        currency: 'XOF',
        supportedMethodsFr: ['MTN MoMo', 'Moov Money', 'Celtiis Cash', 'Cartes Visa/Mastercard'],
        supportedMethodsEn: ['MTN MoMo', 'Moov Money', 'Celtiis Cash', 'Visa/Mastercard'],
        statusMessageFr: 'Passerelle Kkiapay active (Bénin).',
        statusMessageEn: 'Kkiapay gateway active (Benin).',
      };
    }

    if (hasStripe) {
      return {
        provider: 'stripe',
        isConfigured: true,
        currency: 'EUR',
        supportedMethodsFr: ['Cartes Bancaires', 'Apple Pay', 'Google Pay'],
        supportedMethodsEn: ['Credit Cards', 'Apple Pay', 'Google Pay'],
        statusMessageFr: 'Passerelle Stripe internationale active.',
        statusMessageEn: 'International Stripe gateway active.',
      };
    }

    return {
      provider: 'none',
      isConfigured: false,
      currency: 'XOF',
      supportedMethodsFr: [
        'MTN Mobile Money (FedaPay / Kkiapay)',
        'Moov Money (FedaPay / Kkiapay)',
        'Cartes Bancaires Visa & Mastercard',
      ],
      supportedMethodsEn: [
        'MTN Mobile Money (FedaPay / Kkiapay)',
        'Moov Money (FedaPay / Kkiapay)',
        'Credit Cards (Visa / Mastercard)',
      ],
      statusMessageFr:
        'Aucune passerelle de paiement en production. Les paiements réels sont désactivés pour protéger le budget.',
      statusMessageEn:
        'No production payment gateway configured. Real billing is locked to protect user budget.',
    };
  }

  /**
   * Cryptographic verification of incoming webhook signatures
   */
  verifyWebhookSignature(params: {
    provider: PaymentProvider;
    rawBody: string;
    signatureHeader?: string;
    signingSecret?: string;
  }): boolean {
    const { provider, rawBody, signatureHeader, signingSecret } = params;
    if (!signatureHeader || !signingSecret) {
      return false;
    }

    try {
      if (provider === 'fedapay' || provider === 'kkiapay') {
        const expectedSig = crypto
          .createHmac('sha256', signingSecret)
          .update(rawBody)
          .digest('hex');
        return crypto.timingSafeEqual(
          Buffer.from(signatureHeader, 'hex'),
          Buffer.from(expectedSig, 'hex')
        );
      }

      if (provider === 'stripe') {
        // Basic HMAC-SHA256 signature check for t=...,v1=... format
        const pairs = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
          const [k, v] = part.split('=');
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {});

        const timestamp = pairs['t'];
        const v1 = pairs['v1'];
        if (!timestamp || !v1) return false;

        const signedPayload = `${timestamp}.${rawBody}`;
        const expectedSig = crypto
          .createHmac('sha256', signingSecret)
          .update(signedPayload)
          .digest('hex');

        return crypto.timingSafeEqual(
          Buffer.from(v1, 'hex'),
          Buffer.from(expectedSig, 'hex')
        );
      }
    } catch {
      return false;
    }

    return false;
  }
}

export const paymentGatewayService = new PaymentGatewayService();

export type PaymentRequest = {
  amount: number;
  currency: string;
  reference: string;
  returnUrl: string;
  metadata: Record<string, string>;
};

export type PaymentSession = { provider: string; providerReference: string; checkoutUrl: string };

export interface PaymentProvider {
  createCheckout(request: PaymentRequest): Promise<PaymentSession>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}

export class UnconfiguredPaymentProvider implements PaymentProvider {
  async createCheckout(): Promise<PaymentSession> { throw new Error("Payment provider is not configured."); }
  verifyWebhook(): boolean { return false; }
}

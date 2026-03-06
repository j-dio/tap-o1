import { describe, it, expect } from "vitest";
import {
  pushSubscriptionSchema,
  pushSubscriptionKeysSchema,
} from "@/lib/validations/notifications";

describe("pushSubscriptionKeysSchema", () => {
  it("should accept valid base64url-encoded keys", () => {
    const result = pushSubscriptionKeysSchema.safeParse({
      p256dh:
        "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8RfxB9g",
      auth: "tBHItJI5svbpC7Gq-A2Aq",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty p256dh", () => {
    const result = pushSubscriptionKeysSchema.safeParse({
      p256dh: "",
      auth: "tBHItJI5svbpC7Gq-A2Aq",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty auth", () => {
    const result = pushSubscriptionKeysSchema.safeParse({
      p256dh:
        "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8RfxB9g",
      auth: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing keys", () => {
    const result = pushSubscriptionKeysSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("pushSubscriptionSchema", () => {
  const validSubscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: {
      p256dh:
        "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8RfxB9g",
      auth: "tBHItJI5svbpC7Gq-A2Aq",
    },
  };

  it("should accept a valid push subscription", () => {
    const result = pushSubscriptionSchema.safeParse(validSubscription);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endpoint).toBe(validSubscription.endpoint);
      expect(result.data.keys.p256dh).toBe(validSubscription.keys.p256dh);
      expect(result.data.keys.auth).toBe(validSubscription.keys.auth);
    }
  });

  it("should accept endpoints from different push services", () => {
    const mozillaEndpoint = {
      ...validSubscription,
      endpoint: "https://updates.push.services.mozilla.com/wpush/v2/abc",
    };
    expect(pushSubscriptionSchema.safeParse(mozillaEndpoint).success).toBe(
      true,
    );

    const webpushEndpoint = {
      ...validSubscription,
      endpoint: "https://web.push.apple.com/QGZ123",
    };
    expect(pushSubscriptionSchema.safeParse(webpushEndpoint).success).toBe(
      true,
    );
  });

  it("should reject invalid endpoint URL", () => {
    const result = pushSubscriptionSchema.safeParse({
      ...validSubscription,
      endpoint: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing endpoint", () => {
    const result = pushSubscriptionSchema.safeParse({
      keys: validSubscription.keys,
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing keys", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: validSubscription.endpoint,
    });
    expect(result.success).toBe(false);
  });

  it("should reject null input", () => {
    const result = pushSubscriptionSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("should reject non-object input", () => {
    const result = pushSubscriptionSchema.safeParse("string-input");
    expect(result.success).toBe(false);
  });

  it("should reject endpoint with non-string type", () => {
    const result = pushSubscriptionSchema.safeParse({
      ...validSubscription,
      endpoint: 12345,
    });
    expect(result.success).toBe(false);
  });

  it("should strip extra fields via Zod parse", () => {
    const result = pushSubscriptionSchema.safeParse({
      ...validSubscription,
      extraField: "ignore-me",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extraField");
    }
  });
});

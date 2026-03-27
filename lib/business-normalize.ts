import type { AddressRecord, BusinessRecord } from "@/types/business";

export function normalizeBusinessName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s&-]/g, "")
    .replace(/\b(llc|inc|ltd|corp|corporation|co|company)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d]/g, "");

  if (!digits) return undefined;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return `+${digits}`;
}

export function normalizeWebsite(url?: string): string | undefined {
  if (!url) return undefined;

  const trimmed = url.trim().toLowerCase();
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "");
  }
}

export function normalizeAddress(
  address?: AddressRecord
): AddressRecord | undefined {
  if (!address) return undefined;

  const clean = (value?: string) => value?.trim() || undefined;

  return {
    addressLine1: clean(address.addressLine1),
    addressLine2: clean(address.addressLine2),
    city: clean(address.city),
    district: clean(address.district),
    neighborhood: clean(address.neighborhood),
    postalCode: clean(address.postalCode),
    country: clean(address.country),
  };
}

export function buildBusinessMergeKeys(business: BusinessRecord): string[] {
  const keys = new Set<string>();

  const normalizedName = normalizeBusinessName(business.name);
  if (normalizedName) {
    keys.add(`name:${business.island}:${normalizedName}`);
  }

  const phone = normalizePhone(business.phone);
  if (phone) {
    keys.add(`phone:${business.island}:${phone}`);
  }

  const websiteHost = normalizeWebsite(business.website);
  if (websiteHost) {
    keys.add(`website:${business.island}:${websiteHost}`);
  }

  const city = business.address?.city?.trim().toLowerCase();
  if (normalizedName && city) {
    keys.add(`name_city:${business.island}:${normalizedName}:${city}`);
  }

  return Array.from(keys);
}

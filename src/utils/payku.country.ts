import { PaykuUnsupportedFeatureError } from "../errors";
import {
  PAYKU_COUNTRY_FEATURES,
  type PaykuCountry,
  type PaykuFeature,
} from "../types/payku.common";

export function isFeatureSupported(
  country: PaykuCountry,
  feature: PaykuFeature,
): boolean {
  return (PAYKU_COUNTRY_FEATURES[country] as readonly PaykuFeature[]).includes(
    feature,
  );
}

export function assertFeature(
  country: PaykuCountry,
  feature: PaykuFeature,
): void {
  if (!isFeatureSupported(country, feature)) {
    throw new PaykuUnsupportedFeatureError(feature, country);
  }
}

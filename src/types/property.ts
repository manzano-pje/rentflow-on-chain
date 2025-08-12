export type PropertyType = "apartamento" | "casa" | "studio" | "loft" | "comercial";

export interface Property {
  id: string;
  title: string;
  description: string;
  pricePerDayWei: bigint;
  availableDays: number;
  imageUrl: string;
  type: PropertyType;
  owner: string; // wallet address
}

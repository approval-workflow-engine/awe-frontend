export type EnvironmentType = "development" | "staging" | "production";

export const ENVIRONMENT_STORAGE_KEY = "activeEnvironmentType";

export const ENVIRONMENT_OPTIONS: EnvironmentType[] = [
  "development",
  "staging",
  "production",
];

export const DEFAULT_ENVIRONMENT: EnvironmentType = "development";

export function getActiveEnvironmentType(): EnvironmentType {
  const value = localStorage.getItem(ENVIRONMENT_STORAGE_KEY) as EnvironmentType | null;
  if (value && ENVIRONMENT_OPTIONS.includes(value)) {
    return value;
  }
  return DEFAULT_ENVIRONMENT;
}

export function getEnvironmentBadgeLabel(environmentType: EnvironmentType): string {
  if (environmentType === "development") return "DEV";
  if (environmentType === "staging") return "STAGING";
  return "PROD";
}

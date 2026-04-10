export type EnvironmentType = "development" | "staging" | "production";

export const ENVIRONMENT_STORAGE_KEY = "activeEnvironmentType";

export const ENVIRONMENT_OPTIONS: EnvironmentType[] = [
  "development",
  "staging",
  "production",
];

export const DEFAULT_ENVIRONMENT: EnvironmentType = "development";

export function getActiveEnvironmentType(): EnvironmentType {
  const storedValue = localStorage.getItem(ENVIRONMENT_STORAGE_KEY);

  if (!storedValue) {
    return DEFAULT_ENVIRONMENT;
  }

  const first = storedValue.split(",")[0]?.trim();

  if (first && ENVIRONMENT_OPTIONS.includes(first as EnvironmentType)) {
    return first as EnvironmentType;
  }

  return DEFAULT_ENVIRONMENT;
}

export function getActiveEnvironmentTypes(): EnvironmentType[] {
  return [getActiveEnvironmentType()];
}

export function setActiveEnvironmentType(environmentType: EnvironmentType): void {
  localStorage.setItem(ENVIRONMENT_STORAGE_KEY, environmentType);
}

export function setActiveEnvironmentTypes(environmentTypes: EnvironmentType[]): void {
  const next = environmentTypes[0] ?? DEFAULT_ENVIRONMENT;
  setActiveEnvironmentType(next);
}

export function getEnvironmentSelectionLabel(environmentTypes: EnvironmentType[]): string {
  if (environmentTypes.length === 0) {
    return getEnvironmentBadgeLabel(DEFAULT_ENVIRONMENT);
  }

  return getEnvironmentBadgeLabel(environmentTypes[0]);
}

export function getEnvironmentBadgeLabel(environmentType: EnvironmentType): string {
  if (environmentType === "development") return "DEV";
  if (environmentType === "staging") return "STAGING";
  return "PROD";
}

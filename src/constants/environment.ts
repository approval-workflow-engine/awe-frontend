export type EnvironmentType = "development" | "staging" | "production";

export const ENVIRONMENT_STORAGE_KEY = "activeEnvironmentType";

export const ENVIRONMENT_OPTIONS: EnvironmentType[] = [
  "development",
  "staging",
  "production",
];

export const DEFAULT_ENVIRONMENT: EnvironmentType = "development";

function normalizeEnvironmentTypes(values: string[]): EnvironmentType[] {
  return values.filter((value): value is EnvironmentType =>
    ENVIRONMENT_OPTIONS.includes(value as EnvironmentType),
  );
}

export function getActiveEnvironmentTypes(): EnvironmentType[] {
  const storedValue = localStorage.getItem(ENVIRONMENT_STORAGE_KEY);

  if (!storedValue) {
    return [...ENVIRONMENT_OPTIONS];
  }

  const parsedValues = normalizeEnvironmentTypes(
    storedValue.split(",").map((value) => value.trim()),
  );

  if (parsedValues.length > 0) {
    return parsedValues;
  }

  if (ENVIRONMENT_OPTIONS.includes(storedValue as EnvironmentType)) {
    return [storedValue as EnvironmentType];
  }

  return [...ENVIRONMENT_OPTIONS];
}

export function getActiveEnvironmentType(): EnvironmentType {
  return getActiveEnvironmentTypes()[0] ?? DEFAULT_ENVIRONMENT;
}

export function setActiveEnvironmentTypes(environmentTypes: EnvironmentType[]): void {
  const normalized = normalizeEnvironmentTypes(environmentTypes);
  const nextValue = normalized.length > 0 ? normalized : [...ENVIRONMENT_OPTIONS];
  localStorage.setItem(ENVIRONMENT_STORAGE_KEY, nextValue.join(","));
}

export function getEnvironmentSelectionLabel(environmentTypes: EnvironmentType[]): string {
  if (environmentTypes.length === ENVIRONMENT_OPTIONS.length) {
    return "All Environments";
  }

  return environmentTypes.map(getEnvironmentBadgeLabel).join(" + ");
}

export function getEnvironmentBadgeLabel(environmentType: EnvironmentType): string {
  if (environmentType === "development") return "DEV";
  if (environmentType === "staging") return "STAGING";
  return "PROD";
}

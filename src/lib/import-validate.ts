import type {
    BusinessCategory,
    BusinessInput,
    BusinessStatus,
    IslandCode,
  } from "../../types/business";
  
  export type ImportValidationIssue = {
    row: number;
    field: string;
    level: "error" | "warning";
    message: string;
  };
  
  export type ImportValidationResult = {
    valid: Array<BusinessInput & { id?: string }>;
    issues: ImportValidationIssue[];
  };
  
  const VALID_ISLANDS: IslandCode[] = ["st_thomas", "st_john", "st_croix"];
  const VALID_CATEGORIES: BusinessCategory[] = [
    "restaurant",
    "retail",
    "tourism_hospitality",
    "transport",
    "health_beauty",
    "professional_services",
    "construction",
    "real_estate",
    "automotive",
    "grocery",
    "education",
    "other",
  ];
  const VALID_STATUS: BusinessStatus[] = ["active", "inactive", "lead", "unspecified"];
  
  function hasMeaningfulValue(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  }
  
  function isValidIsland(value: unknown): value is IslandCode {
    return typeof value === "string" && VALID_ISLANDS.includes(value as IslandCode);
  }
  
  function isValidCategory(value: unknown): value is BusinessCategory {
    return (
      typeof value === "string" && VALID_CATEGORIES.includes(value as BusinessCategory)
    );
  }
  
  function isValidStatus(value: unknown): value is BusinessStatus {
    return typeof value === "string" && VALID_STATUS.includes(value as BusinessStatus);
  }
  
  function looksLikeEmail(value?: string): boolean {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
  
  function looksLikeWebsite(value?: string): boolean {
    if (!value) return false;
    const trimmed = value.trim().toLowerCase();
    return (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.includes(".com") ||
      trimmed.includes(".net") ||
      trimmed.includes(".org") ||
      trimmed.includes(".vi")
    );
  }
  
  export function validateImportedBusinesses(
    rows: Array<BusinessInput & { id?: string }>
  ): ImportValidationResult {
    const issues: ImportValidationIssue[] = [];
    const valid: Array<BusinessInput & { id?: string }> = [];
  
    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      let hasError = false;
  
      if (!hasMeaningfulValue(row.name)) {
        hasError = true;
        issues.push({
          row: rowNumber,
          field: "name",
          level: "error",
          message: "Business name is required.",
        });
      }
  
      if (!isValidIsland(row.island)) {
        hasError = true;
        issues.push({
          row: rowNumber,
          field: "island",
          level: "error",
          message: `Island must be one of: ${VALID_ISLANDS.join(", ")}.`,
        });
      }
  
      if (!isValidCategory(row.category)) {
        hasError = true;
        issues.push({
          row: rowNumber,
          field: "category",
          level: "error",
          message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
        });
      }
  
      if (!isValidStatus(row.status)) {
        hasError = true;
        issues.push({
          row: rowNumber,
          field: "status",
          level: "error",
          message: `Status must be one of: ${VALID_STATUS.join(", ")}.`,
        });
      }
  
      if (row.email && !looksLikeEmail(row.email)) {
        issues.push({
          row: rowNumber,
          field: "email",
          level: "warning",
          message: "Email format looks invalid.",
        });
      }
  
      if (row.website && !looksLikeWebsite(row.website)) {
        issues.push({
          row: rowNumber,
          field: "website",
          level: "warning",
          message: "Website format looks unusual.",
        });
      }
  
      if (!row.phone && !row.email && !row.website) {
        issues.push({
          row: rowNumber,
          field: "contact",
          level: "warning",
          message: "No phone, email, or website provided.",
        });
      }
  
      if (!row.description) {
        issues.push({
          row: rowNumber,
          field: "description",
          level: "warning",
          message: "Description is missing.",
        });
      }
  
      if (!hasError) {
        valid.push(row);
      }
    });
  
    return { valid, issues };
  }
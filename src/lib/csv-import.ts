import type {
    BusinessCategory,
    BusinessInput,
    BusinessStatus,
    IslandCode,
  } from "../../types/business";
  
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
  const VALID_STATUS: BusinessStatus[] = [
    "active",
    "inactive",
    "lead",
    "unspecified",
  ];
  
  function normalize(value: string): string {
    return value.trim();
  }
  
  function normalizeKey(value: string): string {
    return value.trim().toLowerCase();
  }
  
  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
  
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
  
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
  
      if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
  
      current += char;
    }
  
    result.push(current);
    return result.map((cell) => cell.trim());
  }
  
  function toBoolean(value?: string): boolean | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1", "y"].includes(normalized)) return true;
    if (["false", "no", "0", "n"].includes(normalized)) return false;
    return undefined;
  }
  
  function toStringArray(value?: string): string[] | undefined {
    if (!value) return undefined;
    const items = value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  
  function safeIsland(value?: string): IslandCode {
    const normalized = (value ?? "").trim().toLowerCase() as IslandCode;
    return VALID_ISLANDS.includes(normalized) ? normalized : "st_thomas";
  }
  
  function safeCategory(value?: string): BusinessCategory {
    const normalized = (value ?? "").trim().toLowerCase() as BusinessCategory;
    return VALID_CATEGORIES.includes(normalized) ? normalized : "other";
  }
  
  function safeStatus(value?: string): BusinessStatus {
    const normalized = (value ?? "").trim().toLowerCase() as BusinessStatus;
    return VALID_STATUS.includes(normalized) ? normalized : "unspecified";
  }
  
  export function parseBusinessesCsv(csv: string): BusinessInput[] {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  
    if (lines.length < 2) {
      throw new Error("CSV must include a header row and at least one data row.");
    }
  
    const headers = splitCsvLine(lines[0]).map(normalizeKey);
    const rows = lines.slice(1);
  
    return rows.map((line, index) => {
      const values = splitCsvLine(line);
      const row: Record<string, string> = {};
  
      headers.forEach((header, headerIndex) => {
        row[header] = normalize(values[headerIndex] ?? "");
      });
  
      const verification = {
        ...(row.phone
          ? {
              phone: {
                value: row.phone,
                provenance: {
                  source: row.source || "csv_import",
                  confidence: "low" as const,
                },
              },
            }
          : {}),
        ...(row.website
          ? {
              website: {
                value: row.website,
                provenance: {
                  source: row.source || "csv_import",
                  confidence: "low" as const,
                },
              },
            }
          : {}),
      };
  
      const business: BusinessInput = {
        name: row.name || `Imported Business ${index + 1}`,
        island: safeIsland(row.island),
        category: safeCategory(row.category),
        status: safeStatus(row.status),
        legalName: row.legalname || undefined,
        subcategory: row.subcategory || undefined,
        description: row.description || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        website: row.website || undefined,
        ownerName: row.ownername || undefined,
        tags: toStringArray(row.tags),
        notes: row.notes || undefined,
        pipelineStage:
          (row.pipelinestage as BusinessInput["pipelineStage"]) || "discovered",
        address:
          row.addressline1 || row.city || row.district || row.postalcode
            ? {
                addressLine1: row.addressline1 || undefined,
                addressLine2: row.addressline2 || undefined,
                city: row.city || undefined,
                district: row.district || undefined,
                neighborhood: row.neighborhood || undefined,
                postalCode: row.postalcode || undefined,
                country: row.country || "USVI",
              }
            : undefined,
        social:
          row.facebook ||
          row.instagram ||
          row.googlebusinessprofile ||
          row.tiktok ||
          row.linkedin
            ? {
                facebook: row.facebook || undefined,
                instagram: row.instagram || undefined,
                googleBusinessProfile: row.googlebusinessprofile || undefined,
                tiktok: row.tiktok || undefined,
                linkedin: row.linkedin || undefined,
              }
            : undefined,
        digitalPresence: {
          hasWebsite: toBoolean(row.haswebsite),
          hasOnlineMenu: toBoolean(row.hasonlinemenu),
          hasOnlineBooking: toBoolean(row.hasonlinebooking),
          hasOnlineOrdering: toBoolean(row.hasonlineordering),
          hasSocialPresence: toBoolean(row.hassocialpresence),
          hasRecentSocialActivity: toBoolean(row.hasrecentsocialactivity),
          hasGoogleBusinessProfile: toBoolean(row.hasgooglebusinessprofile),
        },
        source: {
          source: row.source || "csv_import",
          sourceUrl: row.sourceurl || "local-csv-upload",
        },
        verification,
      };
  
      return business;
    });
  }
  
  export function getSampleBusinessCsv(): string {
    return [
      "name,island,category,status,description,phone,email,website,city,district,addressLine1,tags,hasWebsite,hasOnlineMenu,hasOnlineBooking,hasOnlineOrdering,hasSocialPresence,hasRecentSocialActivity,hasGoogleBusinessProfile,source",
      '"Harbor View Bistro",st_thomas,restaurant,active,"Waterfront casual dining in Charlotte Amalie.",+1-340-555-0101,hello@harborviewbistro.com,harborviewbistrovi.com,"Charlotte Amalie","St. Thomas-St. John","12 Waterfront Lane","restaurant|waterfront|tourism",true,false,false,false,true,false,true,csv_preset',
      '"Island Escape Villas",st_john,tourism_hospitality,active,"Boutique villa rentals for short-stay visitors.",,bookings@islandescapevillas.com,islandescapevillas.com,"Coral Bay","St. Thomas-St. John","7 Bay Ridge Road","villa rentals|tourism|booking",true,false,true,false,true,true,true,csv_preset',
    ].join("\n");
  }
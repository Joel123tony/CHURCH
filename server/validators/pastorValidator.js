import { z } from "zod";

const DEFAULT_CHURCH = "Methodist Tamil Church Padikuppam";

const emptyToUndefined = (value) => {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  return value;
};

const toTrimmedString = () =>
  z.preprocess(
    (value) => {
      const normalized = emptyToUndefined(value);
      if (normalized === undefined) return undefined;
      return String(normalized).trim();
    },
    z.string().trim().optional()
  );

const toNumber = () =>
  z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;

    if (typeof normalized === "number") return normalized;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : normalized;
  }, z.number().int().optional());

const toBoolean = () =>
  z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;

    if (typeof normalized === "boolean") return normalized;
    if (typeof normalized === "number") return normalized !== 0;

    if (typeof normalized === "string") {
      const lower = normalized.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(lower)) return true;
      if (["false", "0", "no", "off"].includes(lower)) return false;
    }

    return Boolean(normalized);
  }, z.boolean().optional());

const toEducationArray = () =>
  z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;

    if (Array.isArray(normalized)) {
      return normalized
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (typeof normalized === "string") {
      const trimmed = normalized.trim();

      if (!trimmed) return undefined;

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        // fall through to string parsing
      }

      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return [trimmed];
    }

    return undefined;
  }, z.array(z.string().trim()).optional());

const toImageObject = () =>
  z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return undefined;

    if (typeof normalized === "string") {
      const trimmed = normalized.trim();
      if (!trimmed) return undefined;

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          const url = parsed.url || parsed.secure_url || "";
          const public_id = parsed.public_id || "";

          if (!url && !public_id) return undefined;

          return { url, public_id };
        }
      } catch {
        // treat as direct URL
      }

      return {
        url: trimmed,
        public_id: "",
      };
    }

    if (typeof normalized === "object") {
      const url = normalized.url || normalized.secure_url || "";
      const public_id = normalized.public_id || "";

      if (!url && !public_id) return undefined;

      return {
        url,
        public_id,
      };
    }

    return undefined;
  }, z.object({ url: z.string().default(""), public_id: z.string().default("") }).optional());

const pastorBodySchema = z.object({
  name: toTrimmedString(),
  role: toTrimmedString(),
  bio: toTrimmedString(),
  joinedYear: toNumber(),
  leftYear: toNumber(),
  endYear: toNumber(),
  education: toEducationArray(),
  church: toTrimmedString(),
  email: z.preprocess(
    (value) => {
      const normalized = emptyToUndefined(value);
      return normalized === undefined ? undefined : String(normalized).trim();
    },
    z.string().trim().email().optional()
  ),
  number: toTrimmedString(),
  phone: toTrimmedString(),
  active: toBoolean(),
  isActive: toBoolean(),
  isCurrent: toBoolean(),
  image: toImageObject(),
});

const normalizeCreatePastor = (data) => {
  const image = data.image || {
    url: "",
    public_id: "",
  };

  return {
    name: data.name,
    role: data.role || "Pastor",
    bio: data.bio || "",
    joinedYear: data.joinedYear,
    leftYear: data.leftYear ?? data.endYear ?? null,
    education: data.education || [],
    church: data.church || DEFAULT_CHURCH,
    email: data.email || "",
    number: data.number ?? data.phone ?? "",
    active: data.active ?? data.isActive ?? true,
    isCurrent: data.isCurrent ?? false,
    image,
  };
};

const normalizeUpdatePastor = (data) => {
  const payload = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.joinedYear !== undefined) payload.joinedYear = data.joinedYear;
  if (data.leftYear !== undefined || data.endYear !== undefined) {
    payload.leftYear = data.leftYear ?? data.endYear ?? null;
  }
  if (data.education !== undefined) payload.education = data.education;
  if (data.church !== undefined) payload.church = data.church;
  if (data.email !== undefined) payload.email = data.email;
  if (data.number !== undefined || data.phone !== undefined) {
    payload.number = data.number ?? data.phone ?? "";
  }
  if (data.active !== undefined || data.isActive !== undefined) {
    payload.active = data.active ?? data.isActive;
  }
  if (data.isCurrent !== undefined) {
    payload.isCurrent = data.isCurrent;
  }
  if (data.image !== undefined) {
    payload.image = data.image;
  }

  return payload;
};

export const pastorCreateSchema = pastorBodySchema
  .superRefine((data, ctx) => {
    if (!data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Name is required",
      });
    }

    if (data.joinedYear === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["joinedYear"],
        message: "Joined year is required",
      });
    }
  })
  .transform(normalizeCreatePastor);

export const pastorUpdateSchema = pastorBodySchema.transform(
  normalizeUpdatePastor
);

import Pastor from "../models/Pastor.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

const EMPTY_IMAGE = {
  url: "",
  public_id: "",
};

const toPlainObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

const toText = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text === "" ? fallback : text;
};

const toSafeNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeBoolean = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return Boolean(value);
};

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeImage = (value) => {
  const parsed = parseMaybeJson(value);

  if (!parsed) return undefined;

  if (typeof parsed === "string") {
    return {
      url: parsed.trim(),
      public_id: "",
    };
  }

  const obj = toPlainObject(parsed);
  const url = toText(obj.url || obj.secure_url, "");
  const public_id = toText(obj.public_id, "");

  if (!url && !public_id) return undefined;

  return {
    url,
    public_id,
  };
};

const normalizeEducation = (value) => {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map((item) => toText(item)).filter(Boolean);
  }

  if (typeof parsed === "string") {
    const text = parsed.trim();
    if (!text) return [];

    if (text.includes(",")) {
      return text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [text];
  }

  return [];
};

const normalizeBody = (req) => {
  const body = toPlainObject(req?.validatedBody || req?.body);

  const normalized = {};

  normalized.name = toText(body.name);
  normalized.role = toText(body.role, "Pastor") || "Pastor";
  normalized.bio = toText(body.bio, "");
  normalized.joinedYear = toSafeNumber(body.joinedYear);
  normalized.leftYear = toSafeNumber(body.leftYear ?? body.endYear, null);
  normalized.education = normalizeEducation(body.education);
  normalized.church =
    toText(body.church, "Methodist Tamil Church Padikuppam") ||
    "Methodist Tamil Church Padikuppam";
  normalized.email = toText(body.email, "");
  normalized.number = toText(body.number ?? body.phone, "");
  normalized.active = toSafeBoolean(body.active ?? body.isActive, true);
  normalized.isCurrent = toSafeBoolean(body.isCurrent, false);
  normalized.image = normalizeImage(body.image);

  return normalized;
};

const safeErrorResponse = (res, err, fallbackMessage) => {
  const status =
    err?.status ||
    err?.statusCode ||
    (err?.name === "ValidationError" || err?.name === "CastError"
      ? 400
      : 500);

  if (err?.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    message: err?.message || fallbackMessage,
  });
};

const buildImageFromRequest = async ({ req, existingPastor, body }) => {
  if (req?.file?.buffer) {
    if (existingPastor?.image?.public_id) {
      await deleteFromCloudinary(existingPastor.image.public_id);
    }

    const upload = await uploadToCloudinary(req.file.buffer);

    return {
      url: upload?.url || upload?.secure_url || "",
      public_id: upload?.public_id || "",
    };
  }

  if (body?.image && typeof body.image === "object") {
    return {
      url: toText(body.image.url || body.image.secure_url, ""),
      public_id: toText(body.image.public_id, ""),
    };
  }

  return existingPastor?.image || EMPTY_IMAGE;
};

const logPastorRequest = (label, req, normalizedBody) => {
  console.log(`[PASTOR] ${label}`, {
    path: req?.originalUrl,
    method: req?.method,
    hasBody: !!req?.body,
    bodyKeys: req?.body ? Object.keys(req.body) : [],
    hasFile: !!req?.file,
    fileMime: req?.file?.mimetype || null,
    normalizedBody,
  });
};

/* =========================
  CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    const body = normalizeBody(req);

    logPastorRequest("CREATE REQUEST", req, {
      ...body,
      image: body.image
        ? {
            url: body.image.url,
            public_id: body.image.public_id,
          }
        : null,
    });

    if (!body.name || body.joinedYear === undefined || body.joinedYear === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid pastor payload",
      });
    }

    const image = await buildImageFromRequest({
      req,
      existingPastor: null,
      body,
    });

    const pastorPayload = {
      name: body.name,
      role: body.role,
      bio: body.bio,
      image: {
        url: image?.url || "",
        public_id: image?.public_id || "",
      },
      joinedYear: body.joinedYear,
      leftYear: body.leftYear,
      education: Array.isArray(body.education) ? body.education : [],
      church: body.church,
      email: body.email,
      number: body.number,
      active: body.active ?? true,
      isCurrent: body.isCurrent ?? false,
    };

    console.log("[PASTOR] CREATE PAYLOAD", pastorPayload);

    const pastor = await Pastor.create(pastorPayload);

    return res.status(201).json({
      success: true,
      pastor,
    });
  } catch (err) {
    console.error("CREATE PASTOR ERROR:", err);
    return safeErrorResponse(res, err, "Failed to create pastor");
  }
};

/* =========================
  GET ALL PASTORS
========================= */
export const getAllPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    console.error("GET ALL PASTORS ERROR:", err);
    return res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
  PUBLIC PASTORS
========================= */
export const getPublicPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find({
      $or: [{ active: true }, { active: { $exists: false } }],
    }).sort({ joinedYear: -1 });

    return res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    console.error("PUBLIC PASTORS ERROR:", err);
    return res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
  SEARCH PASTORS
========================= */
export const searchPastors = async (req, res) => {
  try {
    const { name = "" } = req.query;

    const pastors = await Pastor.find({
      name: { $regex: name, $options: "i" },
    });

    return res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({
      success: false,
      pastors: [],
      message: err.message,
    });
  }
};

/* =========================
  UPDATE PASTOR
========================= */
export const updatePastor = async (req, res) => {
  try {
    const body = normalizeBody(req);
    const pastor = await Pastor.findById(req.params.id);

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    logPastorRequest("UPDATE REQUEST", req, {
      ...body,
      image: body.image
        ? {
            url: body.image.url,
            public_id: body.image.public_id,
          }
        : null,
    });

    const image = await buildImageFromRequest({
      req,
      existingPastor: pastor,
      body,
    });

    const updatePayload = {
      ...(body.name ? { name: body.name } : {}),
      ...(body.role ? { role: body.role } : {}),
      ...(body.bio !== undefined ? { bio: body.bio } : {}),
      ...(body.joinedYear !== undefined ? { joinedYear: body.joinedYear } : {}),
      ...(body.leftYear !== undefined ? { leftYear: body.leftYear } : {}),
      ...(Array.isArray(body.education) ? { education: body.education } : {}),
      ...(body.church !== undefined ? { church: body.church } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.number !== undefined ? { number: body.number } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.isCurrent !== undefined ? { isCurrent: body.isCurrent } : {}),
      image: {
        url: image?.url || "",
        public_id: image?.public_id || "",
      },
    };

    console.log("[PASTOR] UPDATE PAYLOAD", updatePayload);

    const updated = await Pastor.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      pastor: updated,
    });
  } catch (err) {
    console.error("UPDATE PASTOR ERROR:", err);
    return safeErrorResponse(res, err, "Failed to update pastor");
  }
};

/* =========================
  DELETE PASTOR
========================= */
export const deletePastor = async (req, res) => {
  try {
    const pastor = await Pastor.findById(req.params.id);

    if (!pastor) {
      return res.status(404).json({
        success: false,
        message: "Pastor not found",
      });
    }

    if (pastor.image?.public_id) {
      await deleteFromCloudinary(pastor.image.public_id);
    }

    await Pastor.deleteOne({ _id: req.params.id });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

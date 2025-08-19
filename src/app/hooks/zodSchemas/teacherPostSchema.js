// schemas/teacherPost.js
import { z } from "zod";

/** ===== Shared enums (match your Mongoose model) ===== */
export const EducationSystem = z.enum([
  "English-Medium",
  "Bangla-Medium",
  "University-Admission",
  "GED",
  "Entrance-Exams",
  "BCS",
]);

export const Board = z.enum([
  "CIE", "Edexcel", "IB", "Others",
  "IELTS", "PTE", "SAT", "GRE", "GMAT", "TOEFL",
  "Public-University", "Engineering", "Medical", "IBA",
  "Preliminary", "Written", "Viva",
]);

export const SubLevel = z.enum(["AS_Level", "A_Level", "Both", ""]);

/** ===== Field fragments ===== */
const titleSchema = z.string().trim().min(1, "Title is required");
const descriptionSchema = z.string().trim().min(1, "Description is required");

// normalize unknown → array<string>
const arrayFromUnknown = z.preprocess(
  (v) => (Array.isArray(v) ? v : v == null ? [] : [v]),
  z.array(z.string())
);

// Subjects (strict for step 4 only; final will be conditional for BCS)
export const subjectsSchema = arrayFromUnknown
  .pipe(
    z
      .array(z.string())
      .min(1, "Select at least one subject")
      .max(5, "Max 5 subjects allowed")
  )
  .transform((a) => a.map((s) => s.trim()).filter(Boolean).sort());

// Tags (always optional; you removed PU tag requirement)
export const tagsSchema = z
  .preprocess(
    (v) => (Array.isArray(v) ? v : v == null ? [] : [v]),
    z.array(z.string())
  )
  .transform((a) => a.map((t) => t.trim()).filter(Boolean));

const hourlyRateSchema = z.coerce.number().min(0, "Rate must be positive");

const youtubeLinkSchema = z
  .string()
  .optional()
  .transform((v) => v ?? "")
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), {
    message: "Invalid URL",
  });

// for final schema we’ll accept any (File or existing string path)
const videoFileFinal = z.any().optional();

// optional defaults kept for compatibility
const locationOptional = z.string().optional().transform((v) => v ?? "");
const languageOptional = z.string().optional().transform((v) => v ?? "");

/** ===== Per-step schemas ===== */

// STEP 1
export const step1Schema = z.object({
  educationSystem: EducationSystem,
});

// STEP 2 (Board / Group)
// - BM still needs group (Science/Commerce/Arts)
// - BCS uses only board as stage (Preliminary/Written/Viva); group is ignored/not required
export const step2Schema = z
  .object({
    educationSystem: EducationSystem,
    board: z.string().optional(),
    group: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { educationSystem, board, group } = data;

    const needBoard = !["Bangla-Medium", "GED"].includes(educationSystem);
    if (needBoard && !board) {
      ctx.addIssue({ path: ["board"], code: z.ZodIssueCode.custom, message: "Board is required" });
    }
    if (board && !Board.options.includes(board)) {
      ctx.addIssue({ path: ["board"], code: z.ZodIssueCode.custom, message: "Invalid board value" });
    }

    if (educationSystem === "Bangla-Medium") {
      if (!group) {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Group is required" });
      } else if (!["Science", "Commerce", "Arts"].includes(group)) {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Invalid group for Bangla-Medium" });
      }
      return;
    }

    if (educationSystem === "BCS") {
      // BCS: stage-only in board, no group required/used
      if (!["Preliminary", "Written", "Viva"].includes(board || "")) {
        ctx.addIssue({
          path: ["board"],
          code: z.ZodIssueCode.custom,
          message: "For BCS, board must be Preliminary / Written / Viva",
        });
      }
      // If someone passed a non-empty group, gently flag it (optional)
      if (group && group.trim() !== "") {
        ctx.addIssue({
          path: ["group"],
          code: z.ZodIssueCode.custom,
          message: "Group is not used for BCS",
        });
      }
      return;
    }

    // Other systems: group must be empty/omitted
    if (group && group !== "") {
      ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Group must be empty for this system" });
    }
  });

// STEP 3 (Level/SubLevel)
export const step3Schema = z
  .object({
    educationSystem: EducationSystem,
    board: z.string().optional(),
    group: z.string().optional(),
    level: z.string().optional(),
    subLevel: SubLevel.optional(), // "", "AS_Level", "A_Level", "Both"
  })
  .superRefine((data, ctx) => {
    const { educationSystem, board, group, level, subLevel } = data;

    // show/require "level" for:
    // - English-Medium with a board
    // - Bangla-Medium with a group
    // - University-Admission with Public-University
    const needLevel =
      (educationSystem === "English-Medium" && !!board) ||
      (educationSystem === "Bangla-Medium" && !!group) ||
      (educationSystem === "University-Admission" && board === "Public-University");

    if (needLevel && (!level || level === "")) {
      ctx.addIssue({ path: ["level"], code: z.ZodIssueCode.custom, message: "Level is required" });
    }

    // Sublevel only for EM + (CIE|Edexcel) + A_Level
    const needSub =
      educationSystem === "English-Medium" &&
      (board === "CIE" || board === "Edexcel") &&
      level === "A_Level";

    if (needSub) {
      if (!subLevel || subLevel === "") {
        ctx.addIssue({
          path: ["subLevel"],
          code: z.ZodIssueCode.custom,
          message: "Sublevel is required for Edexcel/CIE A_Level",
        });
      } else if (!SubLevel.options.includes(subLevel)) {
        ctx.addIssue({ path: ["subLevel"], code: z.ZodIssueCode.custom, message: "Invalid subLevel" });
      }
    } else {
      if (subLevel && subLevel !== "" && !SubLevel.options.includes(subLevel)) {
        ctx.addIssue({ path: ["subLevel"], code: z.ZodIssueCode.custom, message: "Invalid subLevel" });
      }
    }
  });

// STEP 4 (Subjects/Tags) — strict here (≥1) because BCS skips this step anyway
export const step4Schema = z.object({
  educationSystem: EducationSystem,
  board: z.string().optional(),
  subjects: subjectsSchema,
  tags: tagsSchema.optional(),
});

// STEP 5 (Post details)
export const step5Schema = z.object({
  title: z.string().trim().min(5, "Title too short"),
  description: z.string().trim().min(10, "Description is too short"),
  hourlyRate: z
    .string()
    .trim()
    .min(1, "Hourly Rate (BDT) is required")
    .refine((s) => !Number.isNaN(Number(s)), "Hourly Rate must be a number")
    .transform((s) => Number(s))
    .refine((n) => n >= 0, "Rate must be positive"),
});

// STEP 6 (Extras)
export const step6Schema = z
  .object({
    location: z.string().trim().min(1, "Location is required"),
    language: z.string().trim().min(1, "Language is required"),
    youtubeLink: z.string().optional().transform((v) => v ?? ""),
    videoFile: z.any().optional(),
  })
  .superRefine((data, ctx) => {
    const hasYT = !!data.youtubeLink && data.youtubeLink.trim() !== "";
    const hasFile =
      data.videoFile != null &&
      !(typeof data.videoFile === "string" && data.videoFile.trim() === "");

    if (hasYT && !/^https?:\/\/.+/i.test(data.youtubeLink)) {
      ctx.addIssue({ path: ["youtubeLink"], code: z.ZodIssueCode.custom, message: "Invalid URL." });
    }
    if (hasYT && hasFile) {
      ctx.addIssue({
        path: ["youtubeLink"],
        code: z.ZodIssueCode.custom,
        message: "Choose either a YouTube Link OR Upload a Video, not both.",
      });
      ctx.addIssue({
        path: ["videoFile"],
        code: z.ZodIssueCode.custom,
        message: "Remove one: YouTube Link and Video cannot be used together.",
      });
    }
  });

/** ===== Final schema (full submit) =====
 *  IMPORTANT: For BCS, subjects can be empty; for others, ≥1.
 */
const subjectsForFinal = z
  .preprocess(
    (v) => (Array.isArray(v) ? v : v == null ? [] : [v]),
    z.array(z.string())
  )
  .transform((a) => a.map((s) => s.trim()).filter(Boolean).sort());

export const finalTeacherPostSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,

    // conditional later (BCS may be empty)
    subjects: subjectsForFinal,

    // required at final submit
    location: z.string().trim().min(1, "Location is required"),
    language: z.string().trim().min(1, "Language is required"),

    hourlyRate: hourlyRateSchema,
    youtubeLink: youtubeLinkSchema,
    videoFile: videoFileFinal,
    tags: tagsSchema,

    educationSystem: EducationSystem,
    board: z.string().optional(),
    level: z.string().optional(),
    subLevel: SubLevel.optional(),
    group: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { educationSystem, board, level, subLevel, group, subjects } = data;

    const needBoard = !["Bangla-Medium", "GED"].includes(educationSystem);
    const hasValidBoard = !!board && Board.options.includes(board);

    if (needBoard && !board) {
      ctx.addIssue({ path: ["board"], code: z.ZodIssueCode.custom, message: "Board is required" });
    }
    if (board && !Board.options.includes(board)) {
      ctx.addIssue({ path: ["board"], code: z.ZodIssueCode.custom, message: "Invalid board value" });
    }

    // Level rules
    if (educationSystem === "English-Medium" || educationSystem === "Bangla-Medium") {
      if (!level) ctx.addIssue({ path: ["level"], code: z.ZodIssueCode.custom, message: "Level is required" });
    }
    if (
      educationSystem === "English-Medium" &&
      (board === "CIE" || board === "Edexcel") &&
      level === "A_Level"
    ) {
      if (!subLevel || subLevel === "") {
        ctx.addIssue({
          path: ["subLevel"],
          code: z.ZodIssueCode.custom,
          message: "Sublevel is required for Edexcel/CIE A_Level",
        });
      }
    }

    // Group rules
    if (educationSystem === "Bangla-Medium") {
      if (!group) {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Group is required" });
      } else if (!["Science", "Commerce", "Arts"].includes(group)) {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Invalid group for Bangla-Medium" });
      }
    } else if (educationSystem === "BCS") {
      // No group for BCS; if present non-empty, warn
      if (group && group.trim() !== "") {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Group is not used for BCS" });
      }
      if (board && !["Preliminary", "Written", "Viva"].includes(board)) {
        ctx.addIssue({
          path: ["board"],
          code: z.ZodIssueCode.custom,
          message: "For BCS, board must be Preliminary / Written / Viva",
        });
      }
    } else {
      if (group && group !== "") {
        ctx.addIssue({ path: ["group"], code: z.ZodIssueCode.custom, message: "Group must be empty for this system" });
      }
    }

    // ===== Subjects rules (final):
    // - BCS: subjects may be empty
    // - Others: at least one
    // - Always enforce max 5
    if (subjects && subjects.length > 5) {
      ctx.addIssue({
        path: ["subjects"],
        code: z.ZodIssueCode.custom,
        message: "Max 5 subjects allowed",
      });
    }

    if (educationSystem !== "BCS") {
      if (!subjects || subjects.length === 0) {
        ctx.addIssue({
          path: ["subjects"],
          code: z.ZodIssueCode.custom,
          message: educationSystem === "Public-University"
            ? "You must select at least one Unit"
            : "Select at least one subject",
        });
      }
    }

    // University-Admission specifics
    if (educationSystem === "University-Admission" && hasValidBoard) {
      if (board === "Public-University") {
        // Only require ≥1 unit (handled above by generic rule)
      }
      if (["Engineering", "Medical", "IBA"].includes(board || "")) {
        // Also ≥1 subject (already enforced above)
      }
    }

    if (educationSystem === "Entrance-Exams") {
      if (!hasValidBoard) {
        ctx.addIssue({ path: ["board"], code: z.ZodIssueCode.custom, message: "Select an Exam (IELTS, SAT, etc.)" });
      }
      if (!subjects?.length) {
        ctx.addIssue({ path: ["subjects"], code: z.ZodIssueCode.custom, message: "Select at least one part" });
      }
    }

    if (educationSystem === "GED") {
      if (!subjects?.length) {
        ctx.addIssue({ path: ["subjects"], code: z.ZodIssueCode.custom, message: "Select at least one subject" });
      }
    }

    // Step 6 XOR (YouTube vs Video)
    const hasYT = !!data.youtubeLink && data.youtubeLink.trim() !== "";
    const hasFile =
      data.videoFile != null &&
      !(typeof data.videoFile === "string" && data.videoFile.trim() === "");
    if (hasYT && hasFile) {
      ctx.addIssue({
        path: ["youtubeLink"],
        code: z.ZodIssueCode.custom,
        message: "Choose either a YouTube Link OR Upload a Video, not both.",
      });
      ctx.addIssue({
        path: ["videoFile"],
        code: z.ZodIssueCode.custom,
        message: "Remove one: YouTube Link and Video cannot be used together.",
      });
    }
  });

import { z } from 'zod';

// Base fields shared across all flows
const baseSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().min(10, 'Description is too short'),
  hourlyRate: z.coerce.number().min(0, 'Rate must be positive'),
  location: z.string().optional(),
  language: z.string().optional(),
  youtubeLink: z
    .string()
    .url('Invalid YouTube link')
    .optional()
    .or(z.literal('')),
  file: z.any().optional(),
  tags: z.array(z.string()).max(5).optional(),
});

// Fields based on dynamic selection
const dynamicFields = {
  educationSystem: z.enum([
    'English-Medium',
    'Bangla-Medium',
    'University-Admission',
    'GED',
    'Entrance-Exams',
    'BCS',
  ]),
  board: z.string().optional(), // board / track / exam / stage
  level: z.string().optional(),
  subLevel: z.string().optional(),
  group: z.string().optional(),
  subjects: z
    .array(z.string())
    .min(1, 'Select at least one subject')
    .max(5, 'Max 5 subjects allowed'),
};

export const teacherPostSchema = z
  .object(dynamicFields)
  .merge(baseSchema)
  .superRefine((data, ctx) => {
    const {
      educationSystem,
      board,
      level,
      subLevel,
      group,
      subjects,
      tags,
    } = data;

    // English-Medium
    if (educationSystem === 'English-Medium') {
      if (!board)
        ctx.addIssue({
          path: ['board'],
          message: 'Board is required',
          code: z.ZodIssueCode.custom,
        });
      if (!level)
        ctx.addIssue({
          path: ['level'],
          message: 'Level is required',
          code: z.ZodIssueCode.custom,
        });
      if (board === 'Edexcel' && level === 'A_Level' && !subLevel) {
        ctx.addIssue({
          path: ['subLevel'],
          message: 'Sublevel is required for Edexcel A_Level',
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // Bangla-Medium
    if (educationSystem === 'Bangla-Medium') {
      if (!level)
        ctx.addIssue({
          path: ['level'],
          message: 'Level is required',
          code: z.ZodIssueCode.custom,
        });
      if (!group)
        ctx.addIssue({
          path: ['group'],
          message: 'Group is required',
          code: z.ZodIssueCode.custom,
        });
    }

    // University-Admission
    if (educationSystem === 'University-Admission') {
      if (!board) {
        ctx.addIssue({
          path: ['board'],
          message: 'Track is required',
          code: z.ZodIssueCode.custom,
        });
      } else {
        const isMissingSubjects = !subjects || subjects.length === 0;
        const isMissingTags = !tags || tags.length === 0;

        if (board === 'Public-University') {
          if (isMissingSubjects) {
            ctx.addIssue({
              path: ['subjects'],
              message: 'You must select at least one Unit',
              code: z.ZodIssueCode.custom,
            });
          }
          if (isMissingTags) {
            ctx.addIssue({
              path: ['tags'],
              message: 'Select at least one Targeted University',
              code: z.ZodIssueCode.custom,
            });
          }
        }

        if (board === 'Engineering' || board === 'Medical') {
          if (isMissingSubjects) {
            ctx.addIssue({
              path: ['subjects'],
              message: 'Select at least one subject',
              code: z.ZodIssueCode.custom,
            });
          }
          if (isMissingTags) {
            ctx.addIssue({
              path: ['tags'],
              message: 'Select at least one Targeted University',
              code: z.ZodIssueCode.custom,
            });
          }
        }

        if (board === 'IBA') {
          if (isMissingSubjects) {
            ctx.addIssue({
              path: ['subjects'],
              message: 'Select at least one subject',
              code: z.ZodIssueCode.custom,
            });
          }
        }
      }
    }

    // GED
    if (educationSystem === 'GED') {
      if (!subjects || subjects.length === 0) {
        ctx.addIssue({
          path: ['subjects'],
          message: 'Select at least one subject',
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // Entrance-Exams
    if (educationSystem === 'Entrance-Exams') {
      if (!board) {
        ctx.addIssue({
          path: ['board'],
          message: 'Select an Exam (IELTS, SAT, etc.)',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!subjects || subjects.length === 0) {
        ctx.addIssue({
          path: ['subjects'],
          message: 'Select at least one part',
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // BCS
    if (educationSystem === 'BCS') {
      if (!group) {
        ctx.addIssue({
          path: ['group'],
          message: 'Group (General/Technical/Both) is required',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!board) {
        ctx.addIssue({
          path: ['board'],
          message: 'Stage (Preliminary/Written/Viva) is required',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!subjects || subjects.length === 0) {
        ctx.addIssue({
          path: ['subjects'],
          message: 'Select at least one subject',
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

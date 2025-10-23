import { z } from "zod";

// Allowed image hosting domains for security
const ALLOWED_IMAGE_DOMAINS = [
  'imgur.com',
  'i.imgur.com',
  'cloudinary.com',
  'res.cloudinary.com',
  'supabase.co',
  'unsplash.com',
  'images.unsplash.com',
  'pexels.com',
  'images.pexels.com',
];

// Custom validator for image URLs
export const imageUrlValidator = z
  .string()
  .url("L'URL doit être valide")
  .refine(
    (url) => {
      if (!url) return true; // Optional URLs are allowed
      try {
        const parsedUrl = new URL(url);
        return ALLOWED_IMAGE_DOMAINS.some((domain) =>
          parsedUrl.hostname.endsWith(domain)
        );
      } catch {
        return false;
      }
    },
    {
      message: `L'URL de l'image doit provenir d'un domaine autorisé (${ALLOWED_IMAGE_DOMAINS.join(', ')})`,
    }
  )
  .or(z.literal(""));

// Group validation schema
export const groupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(200, "La localisation ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal("")),
  max_members: z
    .number()
    .min(1, "Le nombre minimum de membres est 1")
    .max(100, "Le nombre maximum de membres est 100"),
  is_private: z.boolean(),
  cover_image_url: imageUrlValidator.optional().or(z.literal("")),
});

// Profile validation schema
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  bio: z
    .string()
    .max(500, "La biographie ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(200, "La localisation ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal("")),
  hiking_experience: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    errorMap: () => ({ message: "Veuillez sélectionner un niveau d'expérience valide" }),
  }),
});

// Event validation schema
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .min(2, "La localisation est requise")
    .max(200, "La localisation ne peut pas dépasser 200 caractères"),
  difficulty_level: z.enum(["easy", "moderate", "hard", "expert"], {
    errorMap: () => ({ message: "Veuillez sélectionner un niveau de difficulté valide" }),
  }),
  max_participants: z
    .number()
    .min(1, "Le nombre minimum de participants est 1")
    .max(100, "Le nombre maximum de participants est 100"),
  meeting_point: z
    .string()
    .max(300, "Le point de rencontre ne peut pas dépasser 300 caractères")
    .optional()
    .or(z.literal("")),
  is_premium: z.boolean().optional(),
});

// Export types
export type GroupFormData = z.infer<typeof groupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type EventFormData = z.infer<typeof eventSchema>;

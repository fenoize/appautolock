import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string(),
  nombre: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(100, "Nombre demasiado largo").optional(),
  apellido: z.string().min(2, "Apellido debe tener al menos 2 caracteres").max(100, "Apellido demasiado largo").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

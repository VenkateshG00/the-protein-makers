import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const mealSchema = z.object({
  category_id: z.string().uuid('Select a category'),
  name: z.string().min(2, 'Meal name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  protein_grams: z.number().min(0, 'Protein must be 0 or more'),
  calories: z.number().int().min(0, 'Calories must be 0 or more'),
  ingredients: z.string().optional(),
  dietary_tag: z.enum(['veg', 'non_veg', 'egg']),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'add_on']),
  preparation_time_minutes: z.number().int().positive().optional(),
  is_available: z.boolean().default(true),
});

export const mealPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().optional(),
  plan_type: z.enum(['fixed', 'customized']),
  duration_type: z.enum(['weekly', 'monthly', 'six_day']),
  duration_days: z.number().int().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  is_active: z.boolean().default(true),
});

export const addressSchema = z.object({
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().default('Hyderabad'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
  delivery_zone_id: z.string().uuid('Select a delivery zone'),
});

export const couponSchema = z.object({
  code: z.string().min(3, 'Coupon code is required').toUpperCase(),
  discount_type: z.enum(['percentage', 'flat']),
  discount_value: z.number().positive('Discount value must be positive'),
  min_order_amount: z.number().positive().optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
  valid_from: z.string(),
  valid_until: z.string(),
});

export const pauseDaysSchema = z.object({
  subscription_id: z.string().uuid(),
  dates: z.array(z.string()).min(5, 'Minimum 5 consecutive days required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type PauseDaysInput = z.infer<typeof pauseDaysSchema>;

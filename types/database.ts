export type UserRole = 'admin' | 'staff' | 'kitchen' | 'customer' | 'delivery';
export type DietaryTag = 'veg' | 'non_veg' | 'egg';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'add_on';
export type MealTime = 'morning' | 'afternoon' | 'dinner';
export type PlanType = 'fixed' | 'customized';
export type DurationType = 'weekly' | 'monthly' | 'six_day' | 'twenty_six_day' | 'custom';
export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type CalendarStatus = 'scheduled' | 'paused' | 'prepared' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';
export type PaymentTransactionStatus = 'pending' | 'successful' | 'failed' | 'refunded';
export type DiscountType = 'percentage' | 'flat';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  protein_grams: number;
  calories: number;
  ingredients: string | null;
  photo_url: string | null;
  dietary_tag: DietaryTag;
  meal_type: MealType;
  preparation_time_minutes: number | null;
  is_available: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  plan_type: PlanType;
  duration_type: DurationType;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  meal_plan_items?: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  meal_id: string;
  day_number: number;
  meal_time: MealTime;
  quantity: number;
  meal?: Meal;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  base_delivery_charge: number;
  free_delivery_threshold: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PincodeDeliveryCharge {
  pincode: string;
  area_name: string;
  distance_tier: string;
  delivery_charge: number;
  is_serviceable: boolean;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  pincode: string;
  delivery_zone_id: string | null;
  delivery_charge: number;
  is_default: boolean;
  created_at: string;
  delivery_zone?: DeliveryZone;
}

export interface Subscription {
  id: string;
  user_id: string;
  meal_plan_id: string;
  address_id: string;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  total_amount: number;
  delivery_charge: number;
  discount_amount: number;
  coupon_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  meal_plan?: MealPlan;
  address?: CustomerAddress;
  user?: User;
  subscription_meals?: SubscriptionMeal[];
}

export interface SubscriptionMeal {
  id: string;
  subscription_id: string;
  meal_id: string;
  meal_time: MealTime;
  quantity: number;
  meal?: Meal;
}

export interface SubscriptionCalendar {
  id: string;
  subscription_id: string;
  date: string;
  status: CalendarStatus;
  pause_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_id: string;
  subscription_id: string;
  user_id: string;
  calendar_id: string;
  order_date: string;
  status: OrderStatus;
  delivery_person_id: string | null;
  delivery_zone_id: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  user?: User;
  delivery_person?: User;
  delivery_zone?: DeliveryZone;
}

export interface OrderItem {
  id: string;
  order_id: string;
  meal_id: string;
  meal_time: MealTime;
  quantity: number;
  unit_price: number;
  status?: string;
  meal?: Meal;
}

export interface Payment {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_signature: string | null;
  status: PaymentTransactionStatus;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_by: string;
  updated_at: string;
}

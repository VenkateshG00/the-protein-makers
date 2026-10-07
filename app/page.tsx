import Link from 'next/link';
import { Dumbbell, Leaf, Clock, Truck, ChefHat, Shield } from 'lucide-react';

const features = [
  {
    icon: Dumbbell,
    title: 'High Protein',
    description: 'Every meal is designed to maximize protein intake for your fitness goals.',
  },
  {
    icon: Leaf,
    title: 'Fresh Ingredients',
    description: 'Locally sourced, organic ingredients prepared fresh daily.',
  },
  {
    icon: Clock,
    title: 'Flexible Plans',
    description: 'Choose weekly or monthly plans. Pause anytime for 5+ days.',
  },
  {
    icon: Truck,
    title: 'Doorstep Delivery',
    description: 'Reliable delivery across Kondapur, Miyapur, and Gachibowli.',
  },
  {
    icon: ChefHat,
    title: 'Expert Chefs',
    description: 'Meals crafted by nutrition-focused chefs with precision.',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    description: 'Hygienically prepared in our certified kitchen facility.',
  },
];

const sampleMeals = [
  {
    name: 'Grilled Chicken Rice Bowl',
    protein: '45g',
    calories: '520 kcal',
    tag: 'non_veg',
    tagLabel: 'Non-Veg',
    tagColor: 'bg-red-100 text-red-700 border-red-300',
  },
  {
    name: 'Paneer Protein Platter',
    protein: '38g',
    calories: '480 kcal',
    tag: 'veg',
    tagLabel: 'Veg',
    tagColor: 'bg-green-100 text-green-700 border-green-300',
  },
  {
    name: 'Whey Protein Shake',
    protein: '30g',
    calories: '180 kcal',
    tag: 'veg',
    tagLabel: 'Veg',
    tagColor: 'bg-green-100 text-green-700 border-green-300',
  },
  {
    name: 'Egg Omelette Supreme',
    protein: '35g',
    calories: '350 kcal',
    tag: 'egg',
    tagLabel: 'Egg',
    tagColor: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-brand-green-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">TPM</span>
            </div>
            <span className="text-lg font-semibold text-white">The Protein Makers</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-green-200 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-white text-brand-green-dark px-4 py-2 rounded-lg font-medium hover:bg-brand-gold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-green-dark to-brand-green py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Pure Protein.<br />Pure Living.
          </h1>
          <p className="text-lg sm:text-xl text-green-200 max-w-2xl mx-auto mb-10">
            Premium protein-focused meals, freshly prepared and delivered to your doorstep in Hyderabad.
            Subscribe to a plan that fits your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-brand-gold text-brand-green-dark px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-gold-dark transition-colors"
            >
              Start Your Plan
            </Link>
            <Link
              href="/login"
              className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Menu highlights */}
      <section className="py-16 sm:py-20 bg-brand-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-green-dark mb-3">Our Menu Highlights</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Every meal is packed with premium protein to fuel your body and your goals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleMeals.map(meal => (
              <div key={meal.name} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-brand-green/10 to-brand-gold/30 flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-brand-green/40" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{meal.name}</h3>
                  </div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${meal.tagColor} mb-3`}>
                    {meal.tagLabel}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium text-brand-green">{meal.protein} protein</span>
                    <span>{meal.calories}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-green-dark mb-3">Choose Your Plan</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Two plan types designed for different needs — affordable fixed meals or fully customizable fitness plans.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-gold rounded-xl flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-brand-green-dark" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fixed Meal Plan</h3>
              <p className="text-gray-600 mb-4">
                Pre-designed 6-day cycle with balanced meals. Includes breakfast oat meals, rice bowls, salads, and protein shakes. Affordable and hassle-free.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Pre-selected meals each day
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Budget-friendly pricing
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Perfect for beginners
                </li>
              </ul>
              <Link
                href="/register"
                className="block text-center bg-brand-green text-white py-2.5 rounded-lg font-medium hover:bg-brand-green-light transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-brand-green hover:shadow-md transition-shadow relative">
              <div className="absolute -top-3 right-6 bg-brand-green text-white text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Customized Meal Plan</h3>
              <p className="text-gray-600 mb-4">
                Build your own meal plan based on your fitness goals — fat loss, muscle gain, or maintenance. Choose meals, portions, and timing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Pick your own meals
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Weekly or monthly duration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  Goal-based customization
                </li>
              </ul>
              <Link
                href="/register"
                className="block text-center bg-brand-green text-white py-2.5 rounded-lg font-medium hover:bg-brand-green-light transition-colors"
              >
                Customize Your Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-brand-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-green-dark mb-3">Why The Protein Makers?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-green-dark py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">TPM</span>
                </div>
                <span className="text-lg font-semibold text-white">The Protein Makers</span>
              </div>
              <p className="text-sm text-green-300">Pure Protein. Pure Living.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-green-300">
                <p>Kondapur, Raghavendra Nagar Colony</p>
                <p>Opp Gold Gym, Hyderabad 500084</p>
                <p>WhatsApp: 9963701238</p>
                <p>Hours: 8:30 AM – 11:00 PM</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="/login" className="block text-green-300 hover:text-white">Sign In</Link>
                <Link href="/register" className="block text-green-300 hover:text-white">Register</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-green-800 text-center text-sm text-green-400">
            &copy; 2026 The Protein Makers. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  );
}

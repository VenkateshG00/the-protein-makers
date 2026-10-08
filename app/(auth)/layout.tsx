import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gold-light px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8 group">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogo placement="login" />
          </div>
          <h1 className="text-2xl font-bold text-brand-green-dark group-hover:text-brand-green transition-colors">The Protein Makers</h1>
          <p className="text-sm text-brand-green mt-1">Pure Protein. Pure Living.</p>
        </Link>
        {children}
      </div>
    </div>
  );
}

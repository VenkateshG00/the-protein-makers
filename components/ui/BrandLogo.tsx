import Link from 'next/link';
import Image from 'next/image';

export type LogoPlacement = 'navbar' | 'sidebar' | 'login' | 'hero' | 'footer' | 'favicon';

interface BrandLogoProps {
  placement: LogoPlacement;
  href?: string;
  collapsed?: boolean;
}

export default function BrandLogo({ placement, href = '/', collapsed }: BrandLogoProps) {
  switch (placement) {
    case 'navbar':
      return (
        <Link href={href} className="inline-flex items-center gap-3 group">
          <Image src="/logo-icon.svg" alt="The Protein Makers" width={40} height={40} className="rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-base text-[#0A4828] leading-none">
              THE PROTEIN MAKERS
            </span>
            <span className="text-[11px] font-medium text-stone-500 mt-0.5 hidden sm:block">
              Fresh Macro-Crafted Meals
            </span>
          </div>
        </Link>
      );

    case 'sidebar':
      return (
        <Link href={href} className="inline-flex items-center gap-3 group">
          <Image src="/logo-icon.svg" alt="The Protein Makers" width={40} height={40} className="rounded-full shrink-0 ring-1 ring-[#E3BA82]/40" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm text-[#E3BA82] leading-none">
                THE PROTEIN MAKERS
              </span>
              <span className="text-[11px] text-white/70 mt-1">Admin Portal</span>
            </div>
          )}
        </Link>
      );

    case 'login':
      return (
        <Link href="/" className="flex flex-col items-center">
          <Image src="/logo-full.svg" alt="The Protein Makers" width={88} height={88} className="rounded-full shadow-md ring-2 ring-[#E3BA82]/60" />
        </Link>
      );

    case 'hero':
      return (
        <div className="inline-flex items-center justify-center rounded-full shadow-2xl ring-4 ring-[#E3BA82]/50">
          <Image src="/logo-full.svg" alt="The Protein Makers" width={110} height={110} className="rounded-full" />
        </div>
      );

    case 'footer':
      return (
        <Link href={href} className="inline-flex items-center gap-3.5">
          <Image src="/logo-full.svg" alt="The Protein Makers" width={64} height={64} className="rounded-full shrink-0 ring-1 ring-[#E3BA82]/50" />
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wide text-base text-[#E3BA82]">THE PROTEIN MAKERS</span>
            <span className="text-xs text-white/70">Pure Protein. Pure Living.</span>
          </div>
        </Link>
      );

    case 'favicon':
      return <Image src="/logo-icon.svg" alt="The Protein Makers" width={32} height={32} className="rounded-full" />;
  }
}

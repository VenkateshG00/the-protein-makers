export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gold-light px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-green rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">TPM</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-green-dark">The Protein Makers</h1>
          <p className="text-sm text-brand-green mt-1">Pure Protein. Pure Living.</p>
        </div>
        {children}
      </div>
    </div>
  );
}

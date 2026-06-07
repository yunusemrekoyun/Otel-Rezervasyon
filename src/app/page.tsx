import App from '@/App';
import { MobileApp } from '@/components/mobile/MobileApp';

export default function HomePage() {
  return (
    <>
      {/* Mobile: new design-system shell (design-refs/refs.pdf) */}
      <div className="md:hidden">
        <MobileApp />
      </div>
      {/* Desktop: existing experience, untouched */}
      <div className="hidden md:block">
        <App />
      </div>
    </>
  );
}

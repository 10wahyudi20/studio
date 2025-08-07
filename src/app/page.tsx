
import ClientPage from './client-page';
import AuthWrapper from './auth-wrapper';
import ClientOnly from '@/components/client-only';

export default function Home() {
  return (
    <ClientOnly>
      <AuthWrapper>
        <ClientPage />
      </AuthWrapper>
    </ClientOnly>
  );
}

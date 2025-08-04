
import ClientPage from './client-page';
import AuthWrapper from './auth-wrapper';

export default function Home() {
  return (
    <AuthWrapper>
      <ClientPage />
    </AuthWrapper>
  );
}

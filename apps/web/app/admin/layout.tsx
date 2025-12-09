/**
 * Layout raíz del panel de administración
 * Este layout NO tiene protección - es solo un wrapper común
 * 
 * La protección de autenticación está en (protected)/layout.tsx
 * La página de login está en (auth)/login/ sin protección
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

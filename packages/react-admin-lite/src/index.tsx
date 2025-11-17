import type { ReactNode, ComponentType } from 'react';

export interface AdminContextProps {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataProvider?: any;
}

export function AdminContext({ children }: AdminContextProps) {
  return <>{children}</>;
}

export interface AdminUILayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: AdminUILayoutProps) {
  return <div className="react-admin-layout">{children}</div>;
}

export interface AdminUIProps {
  layout?: ComponentType<AdminUILayoutProps>;
  dashboard?: ComponentType<any>;
  disableTelemetry?: boolean;
  children?: ReactNode;
}

export function AdminUI({
  layout: LayoutComponent = Layout,
  dashboard: DashboardComponent,
  children,
}: AdminUIProps) {
  return (
    <LayoutComponent>
      {DashboardComponent ? <DashboardComponent /> : children}
    </LayoutComponent>
  );
}

export interface DashboardProps {
  [key: string]: unknown;
}


import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGuard } from '@/components/layout/auth-guard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <SidebarProvider>
          <Sidebar>
            <SidebarNav />
          </Sidebar>
          <SidebarInset>
            <Header />
            <main className="p-4 sm:p-6 lg:p-8 shadow-[-5px_0_15px_-5px_rgba(249,115,22,0.3)]">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </FirebaseClientProvider>
  );
}

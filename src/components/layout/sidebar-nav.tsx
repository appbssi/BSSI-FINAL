'use client';

import {
  LayoutDashboard,
  LucideIcon,
  Rocket,
  Users,
  CalendarClock,
  Loader2,
  BookUser,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useLogo } from '@/context/logo-context';
import Image from 'next/image';
import { useRole } from '@/hooks/use-role';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { useUser } from '@/firebase';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Array<'admin' | 'observer' | 'secretariat'>;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Users, roles: ['admin', 'observer'] },
  { href: '/missions', label: 'Missions', icon: Rocket, roles: ['admin', 'observer'] },
  { href: '/gatherings', label: 'Rassemblements', icon: CalendarClock, roles: ['admin', 'observer'] },
  { href: '/secretariat', label: 'Secrétariat', icon: BookUser, roles: ['admin', 'secretariat'] },
  { href: '/reports', label: 'Rapports', icon: BarChart2, roles: ['admin', 'observer'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logo, isLogoLoading } = useLogo();
  const { role } = useRole();
  const isMounted = useIsMounted();
  const { user } = useUser();
  
  const userName = useMemo(() => {
    if (!role) return 'Utilisateur';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }, [role]);


  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="relative h-full w-full">
      {logo && (
          <Image
              src={logo}
              alt="Sidebar background"
              layout="fill"
              objectFit="cover"
              className="opacity-10 pointer-events-none"
          />
      )}
      <div className={cn("relative z-10 flex flex-col h-full", logo ? "" : "")}>
        <SidebarHeader>
          <div className="flex w-full justify-center p-2 bg-sidebar-accent/50 backdrop-blur-sm">
              <div className="flex w-full justify-center py-3 px-2 items-center gap-2">
                   {isLogoLoading ? (
                        <Loader2 className="h-12 w-12 animate-spin" />
                    ) : logo ? (
                        <Image src={logo} alt="Logo" width={48} height={48} className="rounded-full" />
                    ) : null}
                   <p className="text-4xl font-semibold text-center">
                      <span className="text-primary">s</span>
                      <span className="text-sidebar-foreground">BSSI</span>
                  </p>
              </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
              <SidebarMenu className="mt-6 leading-10">
              {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                      <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className="inline-flex items-center w-full text-sm font-semibold text-sidebar-foreground transition-colors duration-150 cursor-pointer hover:text-primary"
                      >
                      <item.icon />
                      <span className="ml-4">{item.label}</span>
                      </SidebarMenuButton>
                  </Link>
                  </SidebarMenuItem>
              ))}
              </SidebarMenu>
        </SidebarContent>
      </div>
    </div>
  );
}

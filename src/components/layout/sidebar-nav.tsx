
'use client';

import {
  LayoutDashboard,
  LucideIcon,
  Rocket,
  Users,
  CalendarClock,
  Loader2,
  BookUser
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
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logo, isLogoLoading } = useLogo();
  const { role } = useRole();
  const isMounted = useIsMounted();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  if (!isMounted) {
    return null; 
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-background rounded-md p-1 flex items-center justify-center h-14 w-14 relative">
             {isLogoLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : logo ? (
                <Image src={logo} alt="Logo" fill className="rounded-md object-cover" />
              ) : (
                <Rocket className="w-8 h-8 text-primary" />
              )}
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            sBSSI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
            <SidebarMenu>
            {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    >
                    <item.icon />
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
      </SidebarContent>
    </>
  );
}

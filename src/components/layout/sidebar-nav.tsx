
'use client';

import {
  LayoutDashboard,
  LucideIcon,
  Rocket,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { useLogo } from '@/context/logo-context';
import Image from 'next/image';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/missions', label: 'Missions', icon: Rocket },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logo } = useLogo();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md p-1 flex items-center justify-center h-10 w-10 relative">
            {logo ? (
              <Image src={logo} alt="Logo" fill className="rounded-md object-cover" />
            ) : (
              <Rocket className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            sBSSI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
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
      <SidebarFooter>
        <SidebarSeparator />
        <div className="group-data-[collapsible=icon]:hidden">
          <UserNav />
        </div>
      </SidebarFooter>
    </>
  );
}

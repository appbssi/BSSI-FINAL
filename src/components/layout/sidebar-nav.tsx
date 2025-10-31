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
import { useUser } from '@/firebase';
import { useMemo } from 'react';

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
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <p className="text-2xl text-primary font-semibold">BSSI</p>
            <p className="ml-2 font-semibold italic text-white">Système</p>
        </div>
        <div className="flex justify-center mt-4">
            <div className="text-center">
                {isLogoLoading ? (
                    <Loader2 className="h-24 w-24 animate-spin text-primary" />
                ) : (
                    <Image 
                        className="hidden h-24 w-24 rounded-full sm:block object-cover mr-2 border-4 border-green-400"
                        src={logo || "https://image.flaticon.com/icons/png/512/149/149071.png"} 
                        alt="User Avatar"
                        width={96}
                        height={96}
                    />
                )}
                <p className="font-bold text-base text-gray-400 pt-2 text-center w-24">{userName}</p>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
            <SidebarMenu className="mt-6">
            {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    className="text-white hover:text-green-500"
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

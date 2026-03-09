import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  HeadphonesIcon,
  Settings,
  ClipboardList,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useStore();

  const isActive = (path: string) => location.pathname === path;

  const getMenuItems = () => {
    const role = currentUser?.role;

    const commonItems = [
      { path: '/profile', label: 'Profile', icon: Settings },
    ];

    switch (role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/admin/users', label: 'User Management', icon: Users },
          { path: '/admin/orders', label: 'All Orders', icon: ShoppingCart },
          { path: '/admin/support', label: 'Support Tickets', icon: HeadphonesIcon },
          ...commonItems,
        ];
      case 'kitchen':
        return [
          { path: '/kitchen', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/kitchen/orders', label: 'My Orders', icon: ClipboardList },
          { path: '/kitchen/new-order', label: 'Create Order', icon: ShoppingCart },
          { path: '/kitchen/billing', label: 'Billing', icon: Wallet },
          ...commonItems,
        ];
      case 'supplier':
        return [
          { path: '/supplier', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/supplier/orders', label: 'Today\'s Orders', icon: ClipboardList },
          { path: '/supplier/billing', label: 'Billing', icon: Wallet },
          ...commonItems,
        ];
      case 'vendor':
        return [
          { path: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/vendor/orders', label: 'My Orders', icon: ClipboardList },
          { path: '/vendor/billing', label: 'Billing', icon: Wallet },
          ...commonItems,
        ];
      case 'transporter':
        return [
          { path: '/transporter', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/transporter/billing', label: 'Earnings', icon: Wallet },
          ...commonItems,
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className={cn("w-64 h-screen bg-white border-r flex flex-col", className)}>
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant={active ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3",
                  active && "bg-blue-600 text-white hover:bg-blue-700"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{currentUser?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

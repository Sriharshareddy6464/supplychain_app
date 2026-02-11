import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';

import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  CheckCircle,
  TrendingUp,
  Navigation,
  Package
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

export function TransporterDashboard() {
  const navigate = useNavigate();
  const { currentUser, getAvailableRides, getRideByTransporter, getWeeklyStats } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const availableRides = getAvailableRides();
  const myRides = currentUser ? getRideByTransporter(currentUser.id) : [];
  const activeRide = myRides.find(r => ['accepted', 'picked_up', 'in_transit'].includes(r.status));
  const completedRides = myRides.filter(r => r.status === 'delivered');

  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {currentUser?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your deliveries and track earnings
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Available Pickups"
                value={availableRides.length}
                icon={Package}
                description="Nearby requests"
              />
              <StatCard
                title="Active Delivery"
                value={activeRide ? '1' : '0'}
                icon={Truck}
                description={activeRide ? 'In progress' : 'None'}
              />
              <StatCard
                title="Completed Today"
                value={completedRides.filter(r => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return r.deliveredAt && new Date(r.deliveredAt) >= today;
                }).length}
                icon={CheckCircle}
                description="Deliveries completed"
              />
              <StatCard
                title="Weekly Earnings"
                value={`${CURRENCY}${weeklyStats.total.toLocaleString()}`}
                icon={TrendingUp}
                trend={{ value: 20, isPositive: true }}
              />
            </div>

            {/* Active Delivery Card */}
            {activeRide && (
              <Card className="mb-8 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Navigation className="w-5 h-5 animate-pulse" />
                    Active Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pickup Location</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {activeRide.pickupAddress.street}, {activeRide.pickupAddress.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Drop Location</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        {activeRide.dropAddress.street}, {activeRide.dropAddress.city}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button 
                      className="flex-1"
                      onClick={() => navigate(`/transporter/delivery/${activeRide.id}`)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Track Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Pickups */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Available Pickups</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    New delivery requests near you
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {availableRides.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {availableRides.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No available pickups"
                    description="Check back later for new delivery requests"
                  />
                ) : (
                  <div className="space-y-4">
                    {availableRides.slice(0, 5).map((ride) => (
                      <div 
                        key={ride.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">
                                {ride.pickupAddress.city}
                              </span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium">
                                {ride.dropAddress.city}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(ride.createdAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/transporter/ride/${ride.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Recent Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedRides.length === 0 ? (
                    <EmptyState
                      icon={Truck}
                      title="No deliveries yet"
                      description="Your completed deliveries will appear here"
                    />
                  ) : (
                    <div className="space-y-4">
                      {completedRides.slice(0, 5).map((ride) => (
                        <div 
                          key={ride.id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">Order #{ride.orderId.slice(-6)}</p>
                            <p className="text-sm text-gray-500">
                              {ride.pickupAddress.city} → {ride.dropAddress.city}
                            </p>
                            <p className="text-sm text-gray-400">
                              {ride.deliveredAt && formatDistanceToNow(ride.deliveredAt)}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Total Deliveries</span>
                      <span className="font-semibold text-lg">{completedRides.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">This Week</span>
                      <span className="font-semibold text-lg text-blue-600">
                        {completedRides.filter(r => {
                          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          return r.deliveredAt && new Date(r.deliveredAt) >= weekAgo;
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Weekly Earnings</span>
                      <span className="font-semibold text-lg text-green-600">
                        {CURRENCY}{weeklyStats.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

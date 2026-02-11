import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { formatDistanceToNow } from '@/lib/utils';

interface BillingDashboardProps {
  role: 'kitchen' | 'supplier' | 'vendor' | 'transporter';
}

export function BillingDashboard({ role }: BillingDashboardProps) {
  const navigate = useNavigate();
  const { currentUser, getInvoicesByUser, getWeeklyStats, getMonthlyStats } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const invoices = currentUser ? getInvoicesByUser(currentUser.id) : [];
  const weeklyStats = currentUser ? getWeeklyStats(currentUser.id) : { total: 0, count: 0 };
  const monthlyStats = currentUser ? getMonthlyStats(currentUser.id) : { total: 0, count: 0 };

  const draftInvoices = invoices.filter(inv => inv.status === 'draft');
  const sentInvoices = invoices.filter(inv => inv.status === 'sent');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  const totalOutstanding = draftInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // Use role and navigate to avoid unused variable warnings
  void role;
  void navigate;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Billing & Invoices
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your invoices and track payments
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Invoices"
                value={invoices.length}
                icon={FileText}
                description="All time"
              />
              <StatCard
                title="Outstanding"
                value={`${CURRENCY}${totalOutstanding.toLocaleString()}`}
                icon={AlertCircle}
                description="Draft invoices"
              />
              <StatCard
                title="Monthly Total"
                value={`${CURRENCY}${monthlyStats.total.toLocaleString()}`}
                icon={TrendingUp}
                trend={{ value: 10, isPositive: true }}
              />
              <StatCard
                title="Total Paid"
                value={`${CURRENCY}${totalPaid.toLocaleString()}`}
                icon={CheckCircle}
                description="Completed payments"
              />
            </div>

            {/* Revenue Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {CURRENCY}{weeklyStats.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">This Week</p>
                    <p className="text-xs text-gray-500">{weeklyStats.count} invoices</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {CURRENCY}{monthlyStats.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">This Month</p>
                    <p className="text-xs text-gray-500">{monthlyStats.count} invoices</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {CURRENCY}{totalPaid.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Paid</p>
                    <p className="text-xs text-gray-500">{paidInvoices.length} invoices</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">{invoices.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="draft">
                  Draft
                  <Badge variant="secondary" className="ml-2">{draftInvoices.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Sent
                  <Badge variant="secondary" className="ml-2">{sentInvoices.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Paid
                  <Badge variant="secondary" className="ml-2">{paidInvoices.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {['all', 'draft', 'sent', 'paid'].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">{tab} Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const tabInvoices = tab === 'all' 
                          ? invoices 
                          : invoices.filter(inv => inv.status === tab);
                        
                        if (tabInvoices.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                              <p>No {tab} invoices</p>
                            </div>
                          );
                        }

                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Invoice #</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tabInvoices.sort((a, b) => 
                                  b.createdAt.getTime() - a.createdAt.getTime()
                                ).map((invoice) => (
                                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      #{invoice.orderId.slice(-6)}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge variant="secondary">{invoice.items.length} items</Badge>
                                    </td>
                                    <td className="py-3 px-4 font-semibold">
                                      {CURRENCY}{invoice.total.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge 
                                        variant={invoice.status === 'paid' ? 'default' : 
                                                 invoice.status === 'sent' ? 'secondary' : 'outline'}
                                        className={invoice.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                                      >
                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {formatDistanceToNow(invoice.createdAt)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm">
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

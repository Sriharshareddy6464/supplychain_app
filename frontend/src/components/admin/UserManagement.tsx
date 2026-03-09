import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  Search,
  ArrowLeft,
  User,
  MapPin,
  Edit,
  Ban,
  CheckCircle, // Added CheckCircle (already there)
  XCircle, // Need XCircle for Reject
  Filter,
  Mail,
  Phone,
  ShieldCheck, // Icon for Verification
  FileText
} from 'lucide-react';
import { USER_ROLES } from '@/constants';
import type { UserRole } from '@/types';
import { toast } from 'sonner';

export function UserManagement() {
  const navigate = useNavigate();
  const { users, updateUserById } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeUsers = filteredUsers.filter(u => u.isActive);
  const pendingVerifications = users.filter(u => u.verificationDetails?.status === 'pending');

  const handleToggleUserStatus = (userId: string, active: boolean) => {
    updateUserById(userId, { isActive: active });
    toast.success(`User ${active ? 'activated' : 'deactivated'}`);
  };

  const handleVerification = (status: 'verified' | 'rejected') => {
    if (!selectedUser || !selectedUser.verificationDetails) return;

    updateUserById(selectedUser.id, {
      verificationDetails: {
        ...selectedUser.verificationDetails,
        status,
        rejectionReason: status === 'rejected' ? 'Documents invalid' : undefined
      }
    });

    toast.success(`Verification ${status}`);
    setShowUserDialog(false);
  };

  const openUserDialog = (user: typeof users[0]) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                  <div className="flex gap-2 text-sm text-gray-600">
                    <span>{activeUsers.length} active users</span>
                    {pendingVerifications.length > 0 && (
                      <span className="text-orange-600 font-medium">• {pendingVerifications.length} pending verifications</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">User</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Role</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Verification</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Contact</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-right py-4 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-500">{user.businessName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">
                                {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                              </Badge>
                              {user.subRole && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {user.subRole.replace('_', ' ')}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {user.verificationDetails ? (
                                <Badge
                                  variant={
                                    user.verificationDetails.status === 'verified' ? 'default' :
                                      user.verificationDetails.status === 'pending' ? 'secondary' : 'destructive'
                                  }
                                  className={
                                    user.verificationDetails.status === 'verified' ? 'bg-green-100 text-green-700' :
                                      user.verificationDetails.status === 'pending' ? 'bg-orange-100 text-orange-700' : ''
                                  }
                                >
                                  {user.verificationDetails.status.charAt(0).toUpperCase() + user.verificationDetails.status.slice(1)}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm">
                                <p className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {user.email}
                                </p>
                                <p className="flex items-center gap-1 text-gray-500">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {user.phone}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={user.isActive ? 'default' : 'secondary'}
                                className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openUserDialog(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                                >
                                  {user.isActive ? (
                                    <Ban className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.businessName}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>
                    {selectedUser.address.street}, {selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <Badge variant="secondary">
                    {USER_ROLES.find(r => r.value === selectedUser.role)?.label}
                  </Badge>
                </div>
              </div>

              {/* Verification Section */}
              {selectedUser.verificationDetails && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Verification Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">License Number</span>
                      <span className="font-medium">{selectedUser.verificationDetails.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Vehicle RC Number</span>
                      <span className="font-medium">{selectedUser.verificationDetails.rcNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">License Image</span>
                      <a
                        href={selectedUser.verificationDetails.licenseImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> View Document
                      </a>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600 text-sm">Status</span>
                      <Badge
                        variant={
                          selectedUser.verificationDetails.status === 'verified' ? 'default' :
                            selectedUser.verificationDetails.status === 'pending' ? 'secondary' : 'destructive'
                        }
                        className={
                          selectedUser.verificationDetails.status === 'verified' ? 'bg-green-100 text-green-700' :
                            selectedUser.verificationDetails.status === 'pending' ? 'bg-orange-100 text-orange-700' : ''
                        }
                      >
                        {selectedUser.verificationDetails.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {selectedUser.verificationDetails.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerification('verified')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleVerification('rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

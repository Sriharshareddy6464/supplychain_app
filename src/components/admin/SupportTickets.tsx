import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HeadphonesIcon, 
  Search,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Send,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export function SupportTickets() {
  const navigate = useNavigate();
  const { tickets, addResponse, updateTicketStatus } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTickets = filteredTickets.filter(t => ['open', 'in_progress'].includes(t.status));

  const openTicketDialog = (ticket: typeof tickets[0]) => {
    setSelectedTicket(ticket);
    setShowTicketDialog(true);
    if (ticket.status === 'open') {
      updateTicketStatus(ticket.id, 'in_progress');
    }
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    
    addResponse(selectedTicket.id, 'admin', 'Support Team', responseMessage);
    setResponseMessage('');
  };

  const handleCloseTicket = () => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, 'resolved');
    setShowTicketDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
                  <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                  <p className="text-gray-600">
                    {openTickets.length} open tickets
                  </p>
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
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>All Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HeadphonesIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No tickets found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Ticket</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">User</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Priority</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Status</th>
                          <th className="text-left py-4 px-4 text-sm font-medium text-gray-600">Created</th>
                          <th className="text-right py-4 px-4 text-sm font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredTickets.sort((a, b) => 
                          b.createdAt.getTime() - a.createdAt.getTime()
                        ).map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{ticket.subject}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {ticket.message}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium">{ticket.userName}</p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                variant={ticket.status === 'open' ? 'destructive' : 
                                         ticket.status === 'in_progress' ? 'default' : 'secondary'}
                              >
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-600">
                                {formatDistanceToNow(ticket.createdAt)}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openTicketDialog(ticket)}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                View
                              </Button>
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

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Ticket from {selectedTicket?.userName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority} priority
                </Badge>
                <Badge 
                  variant={selectedTicket.status === 'open' ? 'destructive' : 
                           selectedTicket.status === 'in_progress' ? 'default' : 'secondary'}
                >
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {/* Original Message */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTicket.userName}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(selectedTicket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="ml-10 text-gray-700">{selectedTicket.message}</p>
                </div>

                {/* Responses */}
                {selectedTicket.responses.map((response) => (
                  <div key={response.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{response.userName}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(response.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="ml-10 text-gray-700">{response.message}</p>
                  </div>
                ))}
              </ScrollArea>

              {/* Response Input */}
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your response..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={handleSendResponse}
                      disabled={!responseMessage.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCloseTicket}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Close Ticket
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

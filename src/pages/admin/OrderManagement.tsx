import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { orderService } from "@/services/dataService";
import { useRequireAuth } from "@/hooks/useAuth";
import { Search, Filter, Eye, CheckCircle, Clock, Package, Truck, AlertCircle, MoreHorizontal } from "lucide-react";

interface OrderWithDetails {
  _id: string;
  project: any;
  creator: any;
  template: any;
  status: string;
  createdAt: string;
  student_count: number;
}

const OrderManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-gray-500", icon: Clock },
    submitted: { label: "Submitted", color: "bg-yellow-500", icon: Package },
    uploaded: { label: "Uploaded", color: "bg-blue-500", icon: AlertCircle },
    validated: { label: "Validated", color: "bg-purple-500", icon: CheckCircle },
    generated: { label: "Generated", color: "bg-green-500", icon: CheckCircle },
    exported: { label: "Exported", color: "bg-emerald-500", icon: Truck },
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const ordersData = await orderService.getAll();
        const list = Array.isArray(ordersData) ? ordersData : [];

        const ordersWithDetails = list.map((order: any) => ({
          ...order,
          student_count: order.studentCount || 0,
        }));

        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "total_students":
          aValue = a.student_count;
          bValue = b.student_count;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateStatus(orderId, newStatus);

      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status];
    if (!config) return <Badge>{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Order Management</CardTitle>
            <CardDescription>
              Monitor and manage all orders from schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="exported">Exported</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Order Date</SelectItem>
                  <SelectItem value="total_students">Student Count</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {order._id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium">
                          {order.student_count}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast.info('Order details view coming soon');
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) => handleStatusUpdate(order._id, newStatus)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="uploaded">Uploaded</SelectItem>
                              <SelectItem value="validated">Validated</SelectItem>
                              <SelectItem value="generated">Generated</SelectItem>
                              <SelectItem value="exported">Exported</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No orders match your current filters." 
                  : "No orders have been created yet."
                }
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OrderManagement;

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
import { schoolService } from "@/services/dataService";
import { useRequireAuth } from "@/hooks/useAuth";
import { Search, Filter, Eye, CheckCircle, XCircle, MoreHorizontal, UserCheck, UserX } from "lucide-react";

interface SchoolWithStats {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  address: string;
  area: string;
  pinCode: string;
  whatsapp: string;
  isVerified: boolean;
  createdAt: string;
  total_orders: number;
  total_students: number;
  last_order_date: string | null;
}

const SchoolManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const [schools, setSchools] = useState<SchoolWithStats[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchSchools = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const schoolsData = await schoolService.getAll();
        const list = Array.isArray(schoolsData) ? schoolsData : [];

        const schoolsWithStats = list.map((school: any) => ({
          ...school,
          total_orders: 0,
          total_students: 0,
          last_order_date: null,
        }));

        setSchools(schoolsWithStats);
        setFilteredSchools(schoolsWithStats);
      } catch (error) {
        console.error('Error fetching schools:', error);
        toast.error('Failed to load schools');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [user]);

  useEffect(() => {
    let filtered = [...schools];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.whatsapp?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(school => {
        switch (statusFilter) {
          case "active":
            return school.total_orders > 0;
          case "inactive":
            return school.total_orders === 0;
          case "verified":
            return school.isVerified === true;
          case "unverified":
            return school.isVerified === false;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "total_orders":
          aValue = a.total_orders;
          bValue = b.total_orders;
          break;
        case "total_students":
          aValue = a.total_students;
          bValue = b.total_students;
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

    setFilteredSchools(filtered);
  }, [schools, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleVerifySchool = async (schoolId: string) => {
    try {
      await schoolService.toggleVerify(schoolId);
      // Update local state
      setSchools(prev => prev.map(school => 
        school._id === schoolId ? { ...school, isVerified: !school.isVerified } : school
      ));
      toast.success('School verification updated successfully');
    } catch (error) {
      console.error('Error updating school verification:', error);
      toast.error('Failed to update school verification');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading schools...</p>
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
            <CardTitle className="text-2xl">School Management</CardTitle>
            <CardDescription>
              Manage and monitor all registered schools in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name, contact person, or email..."
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
                  <SelectItem value="all">All Schools</SelectItem>
                  <SelectItem value="active">Active (Has Orders)</SelectItem>
                  <SelectItem value="inactive">Inactive (No Orders)</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="name">School Name</SelectItem>
                  <SelectItem value="total_orders">Total Orders</SelectItem>
                  <SelectItem value="total_students">Total Students</SelectItem>
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
              Showing {filteredSchools.length} of {schools.length} schools
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {school._id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{school.contactPerson}</div>
                          <div className="text-sm text-muted-foreground">
                            {school.whatsapp}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">{school.email}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{school.address}</div>
                          {school.area && <div className="text-muted-foreground">{school.area}</div>}
                          {school.pinCode && <div className="text-muted-foreground">{school.pinCode}</div>}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>Orders: {school.total_orders}</div>
                          <div>Students: {school.total_students}</div>
                          {school.last_order_date && (
                            <div className="text-muted-foreground">
                              Last: {formatDate(school.last_order_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={school.isVerified ? "default" : "secondary"}>
                            {school.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge variant={school.total_orders > 0 ? "outline" : "destructive"}>
                            {school.total_orders > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(school.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant={school.isVerified ? "destructive" : "default"}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {school.isVerified ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {school.isVerified ? 'Unverify School' : 'Verify School'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {school.isVerified ? 'unverify' : 'verify'} {school.name}? 
                                  This will {school.isVerified ? 'restrict' : 'allow'} their access to the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleVerifySchool(school._id)}
                                >
                                  {school.isVerified ? 'Unverify' : 'Verify'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredSchools.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No schools match your current filters." 
                  : "No schools have been registered yet."
                }
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SchoolManagement;

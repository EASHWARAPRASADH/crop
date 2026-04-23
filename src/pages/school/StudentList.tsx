import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { studentService } from "@/services/dataService";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Search, Trash2, Edit, UserPlus } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  fatherName: string | null;
  class: string;
  section: string | null;
  rollNumber: string | null;
  photoUrl: string | null;
}

const StudentList = () => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder, isOrderLocked } = useOrder();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!currentOrder) return;

      setIsLoading(true);
      try {
        const result = await studentService.getAll({ orderId: currentOrder._id });
        const data = result?.students || result || [];
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      }
      setIsLoading(false);
    };

    fetchStudents();
  }, [currentOrder]);

  // Filter students
  useEffect(() => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter((student) => student.class === classFilter);
    }

    // Section filter
    if (sectionFilter !== 'all') {
      filtered = filtered.filter((student) => student.section === sectionFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, classFilter, sectionFilter, students]);

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await studentService.delete(studentToDelete._id);
      toast.success(`Student ${studentToDelete.name} deleted`);
      setStudents(students.filter((s) => s._id !== studentToDelete._id));
      await refreshOrder();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }

    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const uniqueClasses = Array.from(new Set(students.map((s) => s.class))).sort();
  const uniqueSections = Array.from(new Set(students.map((s) => s.section).filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate("/school/add-student")}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Total Students: {students.length} | Showing: {filteredStudents.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {uniqueSections.map((section) => (
                    <SelectItem key={section} value={section as string}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {students.length === 0 ? 'No students added yet' : 'No students match your filters'}
                </p>
                {students.length === 0 && (
                  <Button onClick={() => navigate("/school/add-student")}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Student
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Father's Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Roll No.</TableHead>
                      {!isOrderLocked && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                              No Photo
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.fatherName || '-'}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.section || '-'}</TableCell>
                        <TableCell>{student.rollNumber || '-'}</TableCell>
                        {!isOrderLocked && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  toast.info('Edit functionality coming soon');
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setStudentToDelete(student);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {isOrderLocked && students.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Order is locked. Students cannot be edited or deleted.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentList;


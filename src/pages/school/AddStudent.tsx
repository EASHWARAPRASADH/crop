import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { studentService } from "@/services/dataService";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { PhotoEditor } from "@/components/PhotoEditor";

const AddStudent = () => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder, isOrderLocked } = useOrder();
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  
  // Form state
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot add students after submission.
              </p>
              <Button onClick={() => navigate('/school/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setStudentClass("");
    setSection("");
    setStudentName("");
    setFatherName("");
    setDob("");
    setRollNumber("");
    setStudentId("");
    setAddress("");
    setGender("");
    setPhoneNumber("");
    setBloodGroup("");
    setPhotoUrl(null);
  };

  const handleSubmit = async (addAnother: boolean = false) => {
    if (!currentOrder) {
      toast.error("No active order found");
      return;
    }

    if (!studentName || !studentClass) {
      toast.error("Please fill in required fields (Name and Class)");
      return;
    }

    setIsLoading(true);

    try {
      await studentService.create({
        orderId: currentOrder._id,
        schoolId: currentOrder._id, // fallback; should ideally be the school's ID
        name: studentName,
        fatherName: fatherName || '',
        dateOfBirth: dob || '',
        rollNumber: rollNumber || '',
        class: studentClass,
        section: section || '',
        address: address || '',
        gender: gender || '',
        phone: phoneNumber || '',
        bloodGroup: bloodGroup || '',
        photoUrl: photoUrl || '',
      });

      toast.success(`Student ${studentName} added successfully!`);
      await refreshOrder();

      if (addAnother) {
        resetForm();
      } else {
        navigate("/school/students");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSaved = (url: string) => {
    setPhotoUrl(url);
    setShowPhotoEditor(false);
    toast.success("Photo saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
            <CardDescription>Fill in the student details below. Fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Photo */}
              <div className="md:col-span-2">
                <Label>Student Photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {photoUrl ? (
                    <div className="relative">
                      <img src={photoUrl} alt="Student" className="w-32 h-32 object-cover rounded-lg border-2" />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowPhotoEditor(true)}
                        className="mt-2"
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setShowPhotoEditor(true)} variant="outline">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Photo
                    </Button>
                  )}
                </div>
              </div>

              {/* Class */}
              <div>
                <Label htmlFor="class">Class *</Label>
                <Input
                  id="class"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="e.g., Class 10"
                  required
                />
              </div>

              {/* Section */}
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., A"
                />
              </div>

              {/* Student Name */}
              <div>
                <Label htmlFor="studentName">Student Name *</Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>

              {/* Father's Name */}
              <div>
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Father's Full Name"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              {/* Roll Number */}
              <div>
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Roll No."
                />
              </div>

              {/* Student ID */}
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Student ID"
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Blood Group */}
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete Address"
                />
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex gap-4">
                <Button 
                  onClick={() => handleSubmit(false)} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Student"}
                </Button>
                <Button 
                  onClick={() => handleSubmit(true)} 
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Save & Add Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Photo Editor Modal */}
      {showPhotoEditor && (
        <PhotoEditor
          onClose={() => setShowPhotoEditor(false)}
          onSave={handlePhotoSaved}
          orderId={currentOrder?.id || ""}
        />
      )}
    </div>
  );
};

export default AddStudent;


import { useRequireAuth } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrder";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Layout, Upload, FileSpreadsheet, Send, HelpCircle, Info, List, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { advertisementService, templateService } from "@/services/dataService";
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

interface Advertisement {
  _id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

const SchoolDashboard = () => {
  const { user, isLoading: authLoading } = useRequireAuth("/");
  const { currentOrder, isLoading: orderLoading, submitOrder, isOrderLocked } = useOrder();
  const navigate = useNavigate();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState<string>("None");

  // Fetch advertisements
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const data = await advertisementService.getPublic();
        if (data) {
          setAdvertisements(data);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };

    fetchAds();
  }, []);

  // Fetch template name
  useEffect(() => {
    const fetchTemplateName = async () => {
      if (currentOrder?.template_id) {
        try {
          const data = await templateService.getById(currentOrder.template_id);
          if (data) {
            setTemplateName(data.name);
          }
        } catch {
          setTemplateName("None");
        }
      } else {
        setTemplateName("None");
      }
    };

    fetchTemplateName();
  }, [currentOrder?.template_id]);

  // Rotate advertisements every 5 seconds
  useEffect(() => {
    if (advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [advertisements.length]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    const success = await submitOrder();
    setIsSubmitting(false);
    setShowSubmitDialog(false);
    
    if (success) {
      // Order submitted successfully, toast will be shown by submitOrder
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600';
      case 'submitted': return 'text-blue-600';
      case 'in_design': return 'text-purple-600';
      case 'printed': return 'text-green-600';
      case 'delivered': return 'text-indigo-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (authLoading || orderLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-4xl font-bold">
                {currentOrder?.total_students || 0}
              </CardTitle>
              <CardDescription>Total Students</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-xl font-semibold truncate">
                {templateName}
              </CardTitle>
              <CardDescription>Template Selected</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className={`text-xl font-semibold ${getStatusColor(currentOrder?.status || 'draft')}`}>
                {getStatusLabel(currentOrder?.status || 'draft')}
              </CardTitle>
              <CardDescription>Order Status</CardDescription>
            </CardHeader>
          </Card>

          {/* Advertisement Card */}
          {advertisements.length > 0 && (
            <Card className="card-gradient cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => advertisements[currentAdIndex]?.linkUrl && window.open(advertisements[currentAdIndex].linkUrl!, '_blank')}>
              <CardHeader>
                <div className="relative h-24 mb-2 rounded-md overflow-hidden bg-muted">
                  <img 
                    src={advertisements[currentAdIndex]?.imageUrl} 
                    alt={advertisements[currentAdIndex]?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-sm truncate">
                  {advertisements[currentAdIndex]?.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {advertisements[currentAdIndex]?.description || 'Click to learn more'}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/school/add-student')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Add Student</CardTitle>
                  <CardDescription>Add student manually</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/school/students')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <List className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">List Students</CardTitle>
                  <CardDescription>View all students</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/school/upload-excel')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload Excel</CardTitle>
                  <CardDescription>Bulk import students</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/school/upload-photos')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Upload ZIP Photos</CardTitle>
                  <CardDescription>Bulk photo upload</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/school/select-template')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Layout className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Select Template</CardTitle>
                  <CardDescription>Choose ID design</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className={`card-hover cursor-pointer ${!isOrderLocked ? 'bg-primary text-primary-foreground' : 'opacity-50 cursor-not-allowed'}`}
            onClick={() => !isOrderLocked && setShowSubmitDialog(true)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${!isOrderLocked ? 'bg-white/20' : 'bg-muted'}`}>
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Submit for Printing</CardTitle>
                  <CardDescription className={!isOrderLocked ? 'text-primary-foreground/80' : ''}>
                    {isOrderLocked ? 'Order submitted' : 'Send order to admin'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/help')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Help / How to Use</CardTitle>
                  <CardDescription>Tutorial & support</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="card-hover cursor-pointer"
            onClick={() => navigate('/about')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">About Us</CardTitle>
                  <CardDescription>Company information</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Submit Order Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Order for Printing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this order? After submission, you won't be able to edit student data or change the template. 
              <br /><br />
              <strong>Order Summary:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>Total Students: {currentOrder?.total_students || 0}</li>
                <li>Template: {templateName}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitOrder} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolDashboard;

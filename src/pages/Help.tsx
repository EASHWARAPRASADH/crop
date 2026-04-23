import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  HelpCircle, 
  FileText, 
  Users, 
  Upload, 
  Image, 
  Layout, 
  Send, 
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const Help = () => {
  const whatsappNumber = "+919876543210"; // Replace with actual WhatsApp number
  const whatsappMessage = encodeURIComponent("Hi, I need help with the UniCard Solutions platform. Please assist me.");

  const handleWhatsAppContact = () => {
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <HelpCircle className="w-10 h-10 text-primary" />
              Help & Support
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about using UniCard Solutions
            </p>
          </div>

          {/* Quick Contact */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Need Immediate Help?
              </CardTitle>
              <CardDescription>
                Contact our support team directly via WhatsApp for instant assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleWhatsAppContact} size="lg" className="w-full sm:w-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support on WhatsApp
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Follow these steps to create your first ID card order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Badge variant="default" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-semibold">Register Your School</h4>
                    <p className="text-sm text-muted-foreground">
                      Create an account with your school details and verify your email.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Badge variant="default" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-semibold">Add Students</h4>
                    <p className="text-sm text-muted-foreground">
                      Add students manually or upload an Excel file with student data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Badge variant="default" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-semibold">Upload Photos</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload individual photos or a ZIP file with all student photos.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Badge variant="default" className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-semibold">Select Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose from available templates or request a custom design.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Badge variant="default" className="mt-1">5</Badge>
                  <div>
                    <h4 className="font-semibold">Submit Order</h4>
                    <p className="text-sm text-muted-foreground">
                      Review your order and submit for printing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Add students manually with detailed information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Bulk import via Excel with smart column mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Search and filter students by class/section</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Edit student information before submission</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Photo Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Built-in photo editor with crop and adjustments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Automatic background removal (Rembg AI)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Bulk upload via ZIP with smart filename matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Manual photo assignment for unmatched files</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Template Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Choose from pre-designed templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Request custom template designs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Preview templates before selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Change template before order submission</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Real-time order status tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Order validation before submission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Data locking after submission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Order history and tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">How do I upload student photos in bulk?</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a ZIP file with all student photos. Name the files using roll numbers, student IDs, or student names for automatic matching. 
                    You can also manually assign unmatched photos to students.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">What Excel format should I use for student data?</h4>
                  <p className="text-sm text-muted-foreground">
                    Download our template from the Upload Excel page. Include columns for student name, class, and other details. 
                    The system will automatically detect and map columns to the correct fields.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Can I change the template after adding students?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can change the template anytime before submitting your order. Once submitted, the order is locked and cannot be modified.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">How long does it take to process an order?</h4>
                  <p className="text-sm text-muted-foreground">
                    Standard orders are processed within 2-3 business days. Custom template requests may take 24-48 hours for design approval.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">What photo formats are supported?</h4>
                  <p className="text-sm text-muted-foreground">
                    We support JPG, PNG, GIF, BMP, and WebP formats. Photos are automatically optimized and resized for ID card printing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Excel upload fails</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure your Excel file has a header row and at least one data row. Check that required fields (student name, class) are not empty.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Photos not uploading</h4>
                  <p className="text-sm text-muted-foreground">
                    Check that your ZIP file contains only image files. Ensure file sizes are reasonable (under 10MB per photo).
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Template not loading</h4>
                  <p className="text-sm text-muted-foreground">
                    Refresh the page and try again. If the issue persists, contact support for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Support Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Response Time</h4>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp: Within 1 hour<br />
                    Email: Within 24 hours<br />
                    Phone: Immediate during support hours
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Button onClick={handleWhatsAppContact} size="lg">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Help Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { templateService } from "@/services/dataService";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Layout, Eye, CheckCircle, MessageCircle, ExternalLink } from "lucide-react";

interface Template {
  _id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  cardSize: string;
  isPublic: boolean;
  createdAt: string;
}

const SelectTemplate = () => {
  const navigate = useNavigate();
  const { currentOrder, updateOrderTemplate, isOrderLocked } = useOrder();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const whatsappNumber = "+919876543210"; // Replace with actual WhatsApp number
  const whatsappMessage = encodeURIComponent("Hi, I need a custom template design for my school ID cards. Please provide details about your requirements.");

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await templateService.getAll();
        const list = Array.isArray(data) ? data : (data?.templates || []);
        setTemplates(list.filter((t: any) => t.isPublic));
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      }
      setIsLoading(false);
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    if (currentOrder?.template_id) {
      setSelectedTemplate(currentOrder.template_id);
    }
  }, [currentOrder?.template_id]);

  const handleSelectTemplate = async (templateId: string) => {
    if (isOrderLocked) {
      toast.error('Order is locked. Cannot change template after submission.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateOrderTemplate(templateId);
      setSelectedTemplate(templateId);
    } catch (error) {
      console.error('Error selecting template:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestCustom = () => {
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot change the template after submission.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handleRequestCustom} variant="outline">
            <MessageCircle className="w-4 h-4 mr-2" />
            Request Custom Template
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Select ID Card Template
            </CardTitle>
            <CardDescription>
              Choose a template for your student ID cards. You can also request a custom design.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Template selected! You can change it anytime before submitting your order.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Layout className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
              <p className="text-muted-foreground mb-4">
                No public templates are currently available. Request a custom template design.
              </p>
              <Button onClick={handleRequestCustom}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Request Custom Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template._id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedTemplate === template._id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleSelectTemplate(template._id)}
              >
                <CardHeader>
                  <div className="relative">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                        <Layout className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {selectedTemplate === template._id && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary">
                        {template.cardSize}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="mb-3">
                      {template.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      Preview
                    </div>
                    
                    <Button
                      size="sm"
                      variant={selectedTemplate === template._id ? "default" : "outline"}
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(template._id);
                      }}
                    >
                      {isUpdating ? 'Selecting...' : 
                       selectedTemplate === template._id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Custom Template Request */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Need a Custom Design?
            </CardTitle>
            <CardDescription>
              Don't see what you're looking for? We can create a custom template for your school.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our design team can create a custom ID card template that matches your school's branding and requirements. 
                Custom templates typically take 24-48 hours to complete.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">What to Include:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• School logo (high resolution)</li>
                    <li>• Preferred colors and fonts</li>
                    <li>• Layout preferences</li>
                    <li>• Any specific requirements</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Custom Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• School-specific branding</li>
                    <li>• Custom layouts and positioning</li>
                    <li>• Special security features</li>
                    <li>• Multiple design options</li>
                  </ul>
                </div>
              </div>

              <Button onClick={handleRequestCustom} className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Request Custom Template on WhatsApp
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selected Template Summary */}
        {selectedTemplate && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Template Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Your ID cards will use the selected template design.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/school/dashboard')}
                  disabled={isUpdating}
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SelectTemplate;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/unicard-logo.png";
import { School } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { schoolService } from "@/services/dataService";

const SchoolLogin = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/school/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error);
      setIsLoading(false);
      return;
    }

    toast.success("Login successful!");
    navigate("/school/dashboard");
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const schoolName = formData.get("schoolName") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const address = formData.get("address") as string;
    const area = formData.get("area") as string;
    const pinCode = formData.get("pinCode") as string;

    // Validate required fields
    if (!email || !password || !schoolName || !contactPerson || !whatsappNumber || !address) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(whatsappNumber.replace(/\s/g, ''))) {
      toast.error("Please enter a valid phone number");
      setIsLoading(false);
      return;
    }

    try {
      // Register user via Node.js API
      const { error: signUpError } = await signUp(contactPerson, email, password, schoolName);

      if (signUpError) {
        toast.error(signUpError);
        setIsLoading(false);
        return;
      }

      // Create school record via Node.js API
      try {
        const storedUser = localStorage.getItem('gotek_user');
        const userData = storedUser ? JSON.parse(storedUser) : null;
        if (userData?._id) {
          await schoolService.create({
            userId: userData._id,
            name: schoolName,
            contactPerson: contactPerson,
            email: email,
            address: address,
            area: area || '',
            pinCode: pinCode || '',
            whatsapp: whatsappNumber,
            isVerified: false,
          });
        }
      } catch (schoolErr) {
        console.error("School record creation error:", schoolErr);
        // User is registered successfully even if school record fails
      }

      toast.success("Registration successful! You can now login.");
      navigate("/school/dashboard");
      setIsLoading(false);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred during registration");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="UniCard Solutions" className="h-12 mx-auto mb-4" />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <School className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">School Portal</h1>
          </div>
          <p className="text-muted-foreground">Manage your student ID cards</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardTitle>School Login</CardTitle>
                <CardDescription>Access your school dashboard</CardDescription>
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="school@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <CardTitle>Register School</CardTitle>
                <CardDescription>Create a new school account</CardDescription>
                <form onSubmit={handleSignup} className="space-y-4 mt-4 max-h-96 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      placeholder="ABC High School"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Complete Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Street, City, State"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">Area/Location</Label>
                      <Input
                        id="area"
                        name="area"
                        placeholder="Downtown"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">Pin Code</Label>
                      <Input
                        id="pinCode"
                        name="pinCode"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="school@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, IdCard, Users, Layers, Smartphone, Zap } from "lucide-react";
import logo from "@/assets/unicard-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="UniCard Solutions" className="h-10" />
            </div>
            <div className="flex items-center gap-4">
              <Link to="/school/login">
                <Button variant="ghost">School Login</Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="outline">Admin Portal</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                Smart ID Card Management Platform
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Professional ID Cards
              <span className="block gradient-primary bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Complete ID card management solution for schools, colleges, and organizations. 
              From data collection to print-ready cards in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Link to="/school/login">
                <Button size="lg" variant="hero" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to streamline your ID card creation process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Easy Data Collection</CardTitle>
                <CardDescription>
                  Add students manually, upload Excel files, or bulk import photos via ZIP
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Template Designer</CardTitle>
                <CardDescription>
                  Drag-and-drop template builder with dynamic field mapping
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <IdCard className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Auto Generation</CardTitle>
                <CardDescription>
                  AI-powered background removal, QR codes, and print-ready export
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Mobile App</CardTitle>
                <CardDescription>
                  Collect data offline and sync automatically when online
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Order Tracking</CardTitle>
                <CardDescription>
                  Real-time status updates with WhatsApp notifications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-lg transition-smooth">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Fast Delivery</CardTitle>
                <CardDescription>
                  Professional printing on Epson F530 with quick turnaround
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple three-step process</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold">Upload Data</h3>
              <p className="text-muted-foreground">
                Add student details manually or upload Excel and photos in bulk
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold">Select Template</h3>
              <p className="text-muted-foreground">
                Choose from ready-made designs or request a custom template
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold">Get Cards</h3>
              <p className="text-muted-foreground">
                We print and deliver professional ID cards to your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 shadow-xl">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of schools and organizations using UniCard Solutions for their ID card needs
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/school/login">
                  <Button size="lg" variant="hero">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <img src={logo} alt="UniCard Solutions" className="h-8" />
              <p className="text-sm text-muted-foreground">
                Professional ID card management platform for educational institutions
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} UniCard Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

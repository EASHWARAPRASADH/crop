import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Award, 
  Shield, 
  Clock, 
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Star,
  Target,
  Heart
} from "lucide-react";

const About = () => {
  const whatsappNumber = "+919876543210"; // Replace with actual WhatsApp number
  const whatsappMessage = encodeURIComponent("Hi, I'm interested in learning more about UniCard Solutions. Please provide more information.");

  const handleWhatsAppContact = () => {
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 flex items-center justify-center gap-4">
              <Building2 className="w-12 h-12 text-primary" />
              UniCard Solutions
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Revolutionizing school ID card management with cutting-edge technology, 
              seamless workflows, and professional printing services.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To simplify and streamline the ID card creation process for educational institutions, 
                  providing them with professional, high-quality student identification cards while 
                  reducing administrative burden and ensuring data security.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To become the leading provider of digital ID card solutions in India, 
                  empowering schools and colleges with innovative technology that enhances 
                  campus security and student management.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">Why Choose UniCard Solutions?</CardTitle>
              <CardDescription className="text-center text-lg">
                We combine advanced technology with user-friendly design to deliver exceptional results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Bulk Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Handle hundreds of students efficiently with our bulk upload and management tools.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Secure & Reliable</h3>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security with data encryption and secure cloud storage.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Fast Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Quick turnaround times with automated processing and quality control.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Professional Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    High-resolution printing with premium materials and professional finishing.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Dedicated support team available via WhatsApp and email for assistance.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Custom Solutions</h3>
                  <p className="text-sm text-muted-foreground">
                    Tailored designs and features to meet your specific school requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">Powered by Modern Technology</CardTitle>
              <CardDescription className="text-center text-lg">
                Built with cutting-edge tools and frameworks for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">React</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Frontend Framework</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">TypeScript</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Type Safety</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">Node.js & MongoDB</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Backend & Database</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">AI/ML</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Background Removal</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">Canvas API</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Image Processing</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">PDF.js</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Document Generation</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">Cloud Storage</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Secure File Storage</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-lg px-4 py-2">Real-time</Badge>
                  <p className="text-xs text-muted-foreground mt-2">Live Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Flow */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">How It Works</CardTitle>
              <CardDescription className="text-center text-lg">
                Simple steps to get your professional ID cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Register</h4>
                  <p className="text-sm text-muted-foreground">Create your school account</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Add Data</h4>
                  <p className="text-sm text-muted-foreground">Upload student information</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Upload Photos</h4>
                  <p className="text-sm text-muted-foreground">Add student photographs</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Select Design</h4>
                  <p className="text-sm text-muted-foreground">Choose template or custom design</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <h4 className="font-semibold mb-2">Get Cards</h4>
                  <p className="text-sm text-muted-foreground">Receive printed ID cards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">Our Impact</CardTitle>
              <CardDescription className="text-center text-lg">
                Numbers that speak for our success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <p className="text-sm text-muted-foreground">Schools Served</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                  <p className="text-sm text-muted-foreground">ID Cards Printed</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">99%</div>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Support Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">Our Team</CardTitle>
              <CardDescription className="text-center text-lg">
                Dedicated professionals committed to your success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-12 h-12 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Development Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Expert developers building innovative solutions with modern technology.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-12 h-12 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Design Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Creative designers crafting beautiful and functional ID card templates.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-12 h-12 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">Support Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Friendly support specialists ready to help you succeed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-3xl mb-4">Ready to Get Started?</CardTitle>
              <CardDescription className="text-center text-lg">
                Join hundreds of schools already using UniCard Solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Contact us today to learn more about our services and get a personalized quote for your school.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleWhatsAppContact} size="lg">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Us on WhatsApp
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                  
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
                    Get Started Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
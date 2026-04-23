import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { advertisementService } from "@/services/dataService";
import { useRequireAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon } from "lucide-react";

interface Advertisement {
  _id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface AdvertisementFormData {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const AdvertisementManagement = () => {
  const { user, isLoading: isLoadingAuth } = useRequireAuth("/admin/login");
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdvertisementFormData>({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    displayOrder: 0,
    isActive: true,
  });

  const fetchAds = async () => {
    try {
      const data = await advertisementService.getAll();
      const list = Array.isArray(data) ? data : [];
      setAdvertisements(list);
      setFilteredAds(list);
    } catch {
      toast.error('Failed to load advertisements');
    }
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchAds().finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    let filtered = [...advertisements];
    if (searchTerm) {
      filtered = filtered.filter(ad =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredAds(filtered);
  }, [advertisements, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingAd) {
        await advertisementService.update(editingAd._id, formData);
        toast.success('Advertisement updated successfully');
      } else {
        await advertisementService.create(formData);
        toast.success('Advertisement created successfully');
      }

      await fetchAds();
      setFormData({ title: "", description: "", imageUrl: "", linkUrl: "", displayOrder: 0, isActive: true });
      setEditingAd(null);
      setIsDialogOpen(false);
    } catch {
      toast.error('Failed to save advertisement');
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || "",
      displayOrder: ad.displayOrder,
      isActive: ad.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (adId: string) => {
    try {
      await advertisementService.delete(adId);
      toast.success('Advertisement deleted successfully');
      await fetchAds();
    } catch {
      toast.error('Failed to delete advertisement');
    }
  };

  const handleToggleActive = async (adId: string) => {
    try {
      await advertisementService.toggle(adId);
      toast.success('Advertisement status updated');
      await fetchAds();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
              <p className="mt-4 text-muted-foreground">Loading advertisements...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Advertisement Management</CardTitle>
                <CardDescription>Manage advertisements displayed on school dashboards</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingAd(null);
                    setFormData({ title: "", description: "", imageUrl: "", linkUrl: "", displayOrder: 0, isActive: true });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Advertisement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}</DialogTitle>
                    <DialogDescription>
                      {editingAd ? 'Update the advertisement details below.' : 'Fill in the details for the new advertisement.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Advertisement title" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="displayOrder">Display Order</Label>
                        <Input id="displayOrder" type="number" value={formData.displayOrder} onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))} placeholder="0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Advertisement description" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL *</Label>
                      <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))} placeholder="https://example.com/image.jpg" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">Link URL</Label>
                      <Input id="linkUrl" value={formData.linkUrl} onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))} placeholder="https://example.com" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded" />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">{editingAd ? 'Update' : 'Create'} Advertisement</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search advertisements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {filteredAds.length} of {advertisements.length} advertisements
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad._id}>
                      <TableCell>
                        <div className="w-16 h-12 rounded overflow-hidden border">
                          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{ad.title}</div>
                        {ad.linkUrl && (
                          <div className="text-sm text-muted-foreground">
                            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{ad.linkUrl}</a>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><div className="text-sm max-w-xs truncate">{ad.description || "No description"}</div></TableCell>
                      <TableCell><div className="text-sm font-medium">{ad.displayOrder}</div></TableCell>
                      <TableCell><Badge variant={ad.isActive ? "default" : "secondary"}>{ad.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell><div className="text-sm">{formatDate(ad.createdAt)}</div></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(ad)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => handleToggleActive(ad._id)}>
                            {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to delete "{ad.title}"? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ad._id)}>Delete</AlertDialogAction>
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

        {filteredAds.length === 0 && (
          <Card className="mt-6">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No advertisements match your search." : "No advertisements have been created yet."}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdvertisementManagement;

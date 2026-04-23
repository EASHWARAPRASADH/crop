import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  Grid3X3,
  List,
  Star,
  StarOff,
  Lock,
  Unlock,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { templateService } from '@/services/dataService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Template {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  category: string;
  cardSize: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

const TemplateLibrary: React.FC = () => {
  const { user, isLoading } = useRequireAuth('/admin/login');
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or filter changes
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, filterType, sortBy, sortOrder]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const data = await templateService.getAll();
      const list = Array.isArray(data) ? data : (data?.templates || []);
      setTemplates(list);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(template => {
        switch (filterType) {
          case 'public':
            return template.isPublic;
          case 'private':
            return !template.isPublic;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = (a as any)[sortBy];
      let bValue: any = (b as any)[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleCreateTemplate = () => {
    navigate('/admin/template-builder');
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/admin/template-builder/${templateId}`);
  };

  const handleCloneTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t._id === templateId);
      if (!template) return;

      await templateService.create({
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        cardSize: template.cardSize,
        isPublic: false,
      });

      toast.success('Template cloned successfully');
      loadTemplates();
    } catch {
      toast.error('Failed to clone template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateService.delete(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleTogglePublic = async (templateId: string, isPublic: boolean) => {
    try {
      await templateService.update(templateId, { isPublic });
      toast.success(`Template ${isPublic ? 'published' : 'unpublished'} successfully`);
      loadTemplates();
    } catch {
      toast.error('Failed to update template visibility');
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t._id === templateId);
      if (!template) return;

      const exportData = {
        metadata: {
          name: template.name,
          description: template.description,
          category: template.category,
          cardSize: template.cardSize,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template exported successfully');
    } catch {
      toast.error('Failed to export template');
    }
  };

  if (isLoading || isLoadingTemplates) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Template Library</h1>
            <p className="text-muted-foreground mt-2">Manage and organize your ID card templates</p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="flex gap-2">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                  <option value="all">All Templates</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <select value={`${sortBy}-${sortOrder}`} onChange={(e) => { const [field, order] = e.target.value.split('-'); setSortBy(field as any); setSortOrder(order as any); }} className="px-3 py-2 border rounded-md bg-background">
                  <option value="updatedAt-desc">Last Updated</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
                <div className="flex border rounded-md">
                  <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="rounded-r-none">
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-l-none">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-sm mb-4">
                  {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filter criteria' : 'Get started by creating your first template'}
                </p>
                <Button onClick={handleCreateTemplate}><Plus className="w-4 h-4 mr-2" />Create Template</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredTemplates.map((template) => (
              <Card key={template._id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{template.description || 'No description'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTemplate(template._id)}>
                          <Edit className="w-4 h-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneTemplate(template._id)}>
                          <Copy className="w-4 h-4 mr-2" />Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportTemplate(template._id)}>
                          <Download className="w-4 h-4 mr-2" />Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleTogglePublic(template._id, !template.isPublic)}>
                          {template.isPublic ? (<><Lock className="w-4 h-4 mr-2" />Make Private</>) : (<><Unlock className="w-4 h-4 mr-2" />Make Public</>)}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTemplate(template._id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Template thumbnail */}
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-4 flex items-center justify-center">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        <Grid3X3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No preview</p>
                      </div>
                    )}
                  </div>

                  {/* Template info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Card Size</span>
                      <Badge variant="outline" className="text-xs">{template.cardSize}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-1">
                        {template.isPublic ? (
                          <><Unlock className="w-3 h-3 text-green-500" /><span className="text-green-600 text-xs">Public</span></>
                        ) : (
                          <><Lock className="w-3 h-3 text-gray-500" /><span className="text-gray-600 text-xs">Private</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{template.tags.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => handleEditTemplate(template._id)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCloneTemplate(template._id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateLibrary;

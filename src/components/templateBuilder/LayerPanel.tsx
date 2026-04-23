import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Move, 
  Trash2, 
  Copy, 
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface LayerElement {
  id: string;
  name: string;
  type: 'text' | 'rect' | 'circle' | 'image' | 'group' | 'background';
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  children?: LayerElement[];
  expanded?: boolean;
}

interface LayerPanelProps {
  elements: LayerElement[];
  selectedElementId?: string;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (elementId: string, updates: Partial<LayerElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
  onElementLock: (elementId: string, locked: boolean) => void;
  onElementVisibility: (elementId: string, visible: boolean) => void;
  onElementReorder: (elementId: string, newZIndex: number) => void;
  onElementRename: (elementId: string, newName: string) => void;
  onElementGroup: (elementIds: string[]) => void;
  onElementUngroup: (elementId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  onElementLock,
  onElementVisibility,
  onElementReorder,
  onElementRename,
  onElementGroup,
  onElementUngroup,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
}) => {
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverElement, setDragOverElement] = useState<string | null>(null);

  // Filter and sort elements
  const filteredElements = elements
    .filter(element => {
      const matchesSearch = element.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || element.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => b.zIndex - a.zIndex); // Sort by zIndex descending (top to bottom)

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, elementId: string) => {
    setDraggedElement(elementId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    setDragOverElement(elementId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverElement(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetElementId: string) => {
    e.preventDefault();
    
    if (draggedElement && draggedElement !== targetElementId) {
      const draggedElementData = elements.find(el => el.id === draggedElement);
      const targetElementData = elements.find(el => el.id === targetElementId);
      
      if (draggedElementData && targetElementData) {
        onElementReorder(draggedElement, targetElementData.zIndex);
      }
    }
    
    setDraggedElement(null);
    setDragOverElement(null);
  };

  // Handle element toggle visibility
  const handleToggleVisibility = (elementId: string, visible: boolean) => {
    onElementVisibility(elementId, visible);
  };

  // Handle element toggle lock
  const handleToggleLock = (elementId: string, locked: boolean) => {
    onElementLock(elementId, locked);
  };

  // Handle element rename
  const handleRename = (elementId: string, newName: string) => {
    if (newName.trim()) {
      onElementRename(elementId, newName.trim());
    }
  };

  // Get element icon
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return 'T';
      case 'rect':
        return '□';
      case 'circle':
        return '○';
      case 'image':
        return '🖼';
      case 'group':
        return '📁';
      case 'background':
        return '🎨';
      default:
        return '?';
    }
  };

  // Get element type color
  const getElementTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'rect':
        return 'bg-green-100 text-green-800';
      case 'circle':
        return 'bg-purple-100 text-purple-800';
      case 'image':
        return 'bg-orange-100 text-orange-800';
      case 'group':
        return 'bg-gray-100 text-gray-800';
      case 'background':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render layer item
  const renderLayerItem = (element: LayerElement, depth = 0) => {
    const isSelected = selectedElementId === element.id;
    const isDragged = draggedElement === element.id;
    const isDragOver = dragOverElement === element.id;
    const hasChildren = element.children && element.children.length > 0;

    return (
      <div
        key={element.id}
        className={`
          group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
          ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
          ${isDragged ? 'opacity-50' : ''}
          ${isDragOver ? 'border-t-2 border-primary' : ''}
        `}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, element.id)}
        onDragOver={(e) => handleDragOver(e, element.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, element.id)}
        onClick={() => onElementSelect(element.id)}
      >
        {/* Drag handle */}
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Expand/collapse button for groups */}
        {hasChildren && (
          <Button
            size="sm"
            variant="ghost"
            className="w-4 h-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onElementUpdate(element.id, { expanded: !element.expanded });
            }}
          >
            {element.expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}

        {/* Element icon */}
        <div className={`
          w-6 h-6 rounded flex items-center justify-center text-xs font-medium
          ${getElementTypeColor(element.type)}
        `}>
          {getElementIcon(element.type)}
        </div>

        {/* Element name */}
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-sm">
            {element.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {element.type} • {Math.round(element.opacity * 100)}%
          </div>
        </div>

        {/* Element controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Visibility toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleVisibility(element.id, !element.visible);
            }}
          >
            {element.visible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>

          {/* Lock toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(element.id, !element.locked);
            }}
          >
            {element.locked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Enter new name:', element.name);
                  if (newName) {
                    handleRename(element.id, newName);
                  }
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDuplicate(element.id);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDelete(element.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render children if expanded */}
        {hasChildren && element.expanded && (
          <div className="w-full">
            {element.children!.map(child => renderLayerItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Layers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search and filter */}
        <div className="p-4 border-b">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search layers..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => onFilterChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="image">Image</option>
                <option value="group">Group</option>
                <option value="background">Background</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layers list */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {filteredElements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No layers found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredElements.map(element => renderLayerItem(element))}
            </div>
          )}
        </div>

        {/* Layer actions */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Add new layer logic
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Layer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Group selected layers logic
                const selectedElements = elements.filter(el => selectedElementId === el.id);
                if (selectedElements.length > 1) {
                  onElementGroup(selectedElements.map(el => el.id));
                }
              }}
            >
              <Layers className="w-4 h-4 mr-1" />
              Group
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  MapPin, 
  Link, 
  Unlink, 
  Table, 
  User, 
  School, 
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PREDEFINED_FIELDS, getFieldsByCategory } from '@/utils/dynamicFields';

interface DataMappingPanelProps {
  selectedElement: any | null;
  onUpdateElement: (id: string, properties: any) => void;
  mappedFields: Record<string, string>; // elementId -> fieldId
  onMappingChange: (elementId: string, fieldId: string | null) => void;
}

export const DataMappingPanel: React.FC<DataMappingPanelProps> = ({
  selectedElement,
  onUpdateElement,
  mappedFields,
  onMappingChange,
}) => {
  const categories = ['student', 'school', 'system'] as const;
  
  const handleMapField = (fieldId: string) => {
    if (!selectedElement) return;
    
    const field = PREDEFINED_FIELDS.find(f => f.id === fieldId);
    if (!field) return;

    onMappingChange(selectedElement.id, fieldId);
    
    // Also update the element's text if it's a text element
    if (selectedElement.type === 'text') {
      onUpdateElement(selectedElement.id, { text: field.placeholder });
    } else if (selectedElement.type === 'image') {
      onUpdateElement(selectedElement.id, { name: `${selectedElement.name} (${field.name})` });
    }
  };

  const currentMappingId = selectedElement ? mappedFields[selectedElement.id] : null;
  const currentField = currentMappingId ? PREDEFINED_FIELDS.find(f => f.id === currentMappingId) : null;

  return (
    <Card className="h-full border-blue-100 shadow-sm">
      <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
          <Database className="w-5 h-5 text-blue-600" />
          Excel Data Mapping
        </CardTitle>
        <CardDescription>
          Map template elements to Excel data fields for bulk generation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {selectedElement ? (
          <div className="space-y-4">
            {/* Current Element Info */}
            <div className="p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {selectedElement.type} element
                </Badge>
                {currentField ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                    <Link className="w-3 h-3" /> Mapped
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Unlink className="w-3 h-3" /> Unmapped
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium truncate">{selectedElement.name || selectedElement.id}</p>
              {currentField && (
                <div className="mt-2 text-xs flex items-center gap-1 text-blue-600 font-semibold">
                  <Table className="w-3 h-3" />
                  Maps to: {currentField.name}
                </div>
              )}
            </div>

            {/* Field Selectors */}
            <div className="space-y-4">
              <Label className="text-sm">Available Fields</Label>
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {category === 'student' && <User className="w-3 h-3" />}
                    {category === 'school' && <School className="w-3 h-3" />}
                    {category === 'system' && <Settings className="w-3 h-3" />}
                    {category} Data
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {getFieldsByCategory(category).map(field => (
                      <Button
                        key={field.id}
                        variant={currentMappingId === field.id ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start h-8 px-3 text-xs"
                        onClick={() => handleMapField(field.id)}
                      >
                        {field.name}
                        {currentMappingId === field.id && <CheckCircle2 className="w-3 h-3 ml-auto text-white" />}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {currentField && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                onClick={() => onMappingChange(selectedElement.id, null)}
              >
                <Unlink className="w-4 h-4" />
                Remove Mapping
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">No Element Selected</h4>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">
                Select an element on the canvas to map it to an Excel data field.
              </p>
            </div>
          </div>
        )}

        {/* Global Bulk Status */}
        <div className="pt-4 border-t space-y-3">
          <Label className="text-sm">Bulk Generation Status</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mapped Elements:</span>
              <span className="font-medium">{Object.keys(mappedFields).length}</span>
            </div>
            {Object.keys(mappedFields).length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <p className="text-[10px] text-yellow-700">
                  No elements mapped yet. Bulk generation will use static content from the template.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

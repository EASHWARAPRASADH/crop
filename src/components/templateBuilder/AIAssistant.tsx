import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Palette, 
  Type, 
  Layout, 
  RefreshCw,
  Check,
  Zap,
  RotateCcw
} from 'lucide-react';

interface AIAssistantProps {
  selectedElement: any | null;
  onUpdateElement: (id: string, properties: any) => void;
  onApplyTheme: (theme: { primary: string; secondary: string; accent: string; text: string }) => void;
}

const THEMES = [
  {
    name: 'Corporate Blue',
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    accent: '#dbeafe',
    text: '#111827',
  },
  {
    name: 'Modern Dark',
    primary: '#111827',
    secondary: '#374151',
    accent: '#6366f1',
    text: '#f9fafb',
  },
  {
    name: 'Professional Green',
    primary: '#064e3b',
    secondary: '#10b981',
    accent: '#d1fae5',
    text: '#111827',
  },
  {
    name: 'Vibrant Orange',
    primary: '#7c2d12',
    secondary: '#f97316',
    accent: '#ffedd5',
    text: '#111827',
  },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
  selectedElement,
  onUpdateElement,
  onApplyTheme,
}) => {
  const [isStyleProcessing, setIsStyleProcessing] = useState(false);
  const [isTextProcessing, setIsTextProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleApplyTheme = (theme: typeof THEMES[0]) => {
    setIsStyleProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      onApplyTheme({
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        text: theme.text,
      });
      setIsStyleProcessing(false);
    }, 800);
  };

  const handleEnhanceText = () => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    setIsTextProcessing(true);
    // Simulate AI text enhancement
    setTimeout(() => {
      const currentText = selectedElement.text || '';
      let enhanced = currentText;
      
      if (currentText.toLowerCase().includes('name')) {
        enhanced = 'Student Full Name';
      } else if (currentText.toLowerCase().includes('school')) {
        enhanced = 'Official Educational Institution';
      } else {
        enhanced = `Professional ${currentText}`;
      }
      
      onUpdateElement(selectedElement.id, { text: enhanced });
      setIsTextProcessing(false);
      setSuggestion(`Enhanced "${currentText}" to "${enhanced}"`);
    }, 1000);
  };

  const handleAIStyleSuggest = () => {
    setIsStyleProcessing(true);
    // Simulate "Surprise me" AI style
    setTimeout(() => {
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      onApplyTheme(randomTheme);
      setIsStyleProcessing(false);
    }, 1200);
  };

  return (
    <Card className="h-full border-purple-100 shadow-sm">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Studio Assistant
        </CardTitle>
        <CardDescription>
          Use AI to instantly enhance your ID card design
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Style & Color Suggestions */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            AI Smart Styling
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => (
              <Button
                key={theme.name}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 justify-start gap-2 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => handleApplyTheme(theme)}
                disabled={isStyleProcessing}
              >
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                </div>
                <span className="text-xs truncate">{theme.name}</span>
              </Button>
            ))}
          </div>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
            onClick={handleAIStyleSuggest}
            disabled={isStyleProcessing}
          >
            {isStyleProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Surprise Me with AI Style
          </Button>
        </div>

        {/* Text Enhancement */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4 text-purple-600" />
            Detail Booster
          </Label>
          {selectedElement?.type === 'text' ? (
            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">"{selectedElement.text}"</span>
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full gap-2"
                onClick={handleEnhanceText}
                disabled={isTextProcessing}
              >
                {isTextProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Professional Text Polish
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-muted/20 border border-dashed rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                Select a text element to enable AI Polish
              </p>
            </div>
          )}
        </div>

        {/* AI Layout Suggestions */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-purple-600" />
            AI Layout Fixer
          </Label>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs">
              <Check className="w-3 h-3 text-green-500" /> Standard ID Alignment
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 text-xs">
              <Check className="w-3 h-3 text-green-500" /> Optimized Spacing
            </Button>
          </div>
        </div>

        {suggestion && (
          <div className="mt-4 p-2 bg-green-50 border border-green-100 rounded text-[10px] text-green-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
            <Check className="w-3 h-3" />
            {suggestion}
            <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => setSuggestion(null)}>
              <RotateCcw className="w-2 h-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

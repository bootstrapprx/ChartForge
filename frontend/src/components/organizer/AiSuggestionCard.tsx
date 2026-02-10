// frontend/src/components/organizer/AiSuggestionCard.tsx
import React from 'react';
import { OrganizerClassification } from '@/types/organizer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Check, X } from 'lucide-react';
import { Badge } from '../ui/badge';

interface AiSuggestionCardProps {
  suggestion: OrganizerClassification;
  onAccept: () => void;
  onReject: () => void;
  isLoading: boolean;
}

const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({ suggestion, onAccept, onReject, isLoading }) => {
  if (isLoading) {
    return <div className="h-48 bg-muted rounded-lg animate-pulse"></div>;
  }
  
  if (!suggestion) {
    return null;
  }

  const { 
    suggested_category, 
    suggested_parent, 
    confidence, 
    model_reasoning 
  } = suggestion;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>AI Suggestion</span>
          <Badge variant="outline">Confidence: {(confidence * 100).toFixed(0)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p className="text-lg font-semibold">{suggested_category || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Parent Account</p>
            <p className="text-lg font-semibold">{suggested_parent || 'N/A'}</p>
          </div>
        </div>
        {model_reasoning && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reasoning</p>
            <p className="text-sm italic">"{model_reasoning}"</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onReject}>
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
        <Button onClick={onAccept}>
          <Check className="h-4 w-4 mr-2" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AiSuggestionCard;

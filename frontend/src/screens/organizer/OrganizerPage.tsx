// frontend/src/pages/organizer/OrganizerPage.tsx
import React, { useState } from 'react';
import { useClassifyDescription, useConfirmClassification, useRejectClassification } from '@/hooks/api/useOrganizer';
import AiSuggestionCard from '@/components/organizer/AiSuggestionCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

const OrganizerPage = () => {
  const [text, setText] = useState('');
  const { toast } = useToast();
  
  const classifyMutation = useClassifyDescription();
  const confirmMutation = useConfirmClassification();
  const rejectMutation = useRejectClassification();

  const handleClassify = () => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter a description to classify.', variant: 'destructive' });
      return;
    }
    classifyMutation.mutate(text);
  };

  const handleAccept = () => {
    if (!classifyMutation.data) return;
    const { suggested_category, suggested_parent } = classifyMutation.data;
    confirmMutation.mutate(
      { text, chosen_category: suggested_category!, chosen_parent: suggested_parent! },
      {
        onSuccess: () => {
          toast({ title: 'Suggestion Accepted', description: 'The AI will learn from your feedback.' });
          classifyMutation.reset();
          setText('');
        },
      }
    );
  };

  const handleReject = () => {
    if (!classifyMutation.data) return;
     const { suggested_category, suggested_parent } = classifyMutation.data;
    rejectMutation.mutate(
        { text, chosen_category: suggested_category!, chosen_parent: suggested_parent! },
        {
            onSuccess: () => {
                toast({ title: 'Suggestion Rejected', description: 'Thank you for your feedback.', variant: 'default' });
                classifyMutation.reset();
            }
        }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organizer AI</h1>
      <Card>
        <CardHeader>
          <CardTitle>Classify Description</CardTitle>
          <CardDescription>Enter an accounting transaction description and let the AI suggest a category.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., 'Monthly rent payment for office space'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleClassify} disabled={classifyMutation.isPending}>
            <Wand2 className="h-4 w-4 mr-2" />
            {classifyMutation.isPending ? 'Classifying...' : 'Classify'}
          </Button>
        </CardFooter>
      </Card>

      {classifyMutation.data && (
        <AiSuggestionCard 
            suggestion={classifyMutation.data}
            onAccept={handleAccept}
            onReject={handleReject}
            isLoading={confirmMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
};

export default OrganizerPage;
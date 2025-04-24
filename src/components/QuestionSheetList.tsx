import { useState, useEffect } from 'react';
import { sheetService, QuestionSheet } from '@/services/sheetService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // For potential navigation

interface QuestionSheetListProps {
  onSheetSelect: (sheetId: string, sheetName: string) => void; // Callback when a sheet is selected
}

const QuestionSheetList = ({ onSheetSelect }: QuestionSheetListProps) => {
  const [sheets, setSheets] = useState<QuestionSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSheets = await sheetService.getQuestionSheets();
        setSheets(fetchedSheets);
      } catch (err: any) {
        setError(err.message || 'Failed to load question sheets.');
        console.error("Error fetching sheets:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSheets();
  }, []);

  return (
    <div className="question-sheet-list space-y-4">
      <h2 className="text-2xl font-semibold">Question Sheets</h2>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading sheets...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && sheets.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No question sheets available yet.</p>
      )}

      {!isLoading && !error && sheets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((sheet) => (
            <Card key={sheet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{sheet.name}</CardTitle> {/* Ensure using name */}
                {sheet.description && (
                  <CardDescription>{sheet.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {/* Add more details if needed, e.g., number of questions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSheetSelect(sheet.id, sheet.name)} // Pass name
                  className="w-full"
                >
                  View Sheet
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionSheetList;

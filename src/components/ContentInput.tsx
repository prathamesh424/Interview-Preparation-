
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, X, LoaderCircle } from "lucide-react"; // Add LoaderCircle
import { useToast } from "@/components/ui/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
// Attempt to import the worker script as a URL using the bundler
// Note: The exact path might still vary based on package structure.
// If this specific path fails, we might need to try 'pdfjs-dist/build/pdf.worker.min.js' or similar.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source using the imported URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;


interface ContentInputProps {
  onContentSet: (content: string) => void;
}

const ContentInput = ({ onContentSet }: ContentInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf" && file.type !== "text/plain") {
      toast({
        title: "Invalid file type",
        description: "Only PDF and TXT files are supported",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should not exceed 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setInputValue("");
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!inputValue && !selectedFile) {
      toast({
        title: "No content",
        description: "Please enter text or upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let content = "";

    try {
      if (inputValue) {
        content = inputValue;
      } else if (selectedFile) {
        if (selectedFile.type === "application/pdf") {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          if (pdf.numPages > 20) {
            toast({
              title: "PDF Too Long",
              description: "Please upload PDFs with 20 pages or less.",
              variant: "destructive",
            });
            setIsLoading(false);
            return; // Stop processing
          }

          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + "\n\n"; // Add space between pages
          }
          content = fullText.trim();

        } else if (selectedFile.type === "text/plain") {
          content = await selectedFile.text();
        }
      }

      if (!content.trim()) {
         toast({
           title: "Empty Content",
           description: "The processed file appears to be empty.",
           variant: "destructive",
         });
         setIsLoading(false);
         return;
      }

      onContentSet(content); // Pass extracted content up

      toast({
        title: "Content ready",
        description: "Your content has been processed and is ready for question generation",
      });
    } catch (error) {
      console.error("Error processing content:", error); // Log the actual error first
      toast({ // Then show the toast message
        title: "Error Processing File",
        description: error instanceof Error ? error.message : "Failed to read or process the file. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content-input">Enter Text or Topic</Label>
          <Textarea
            id="content-input"
            placeholder="Enter a topic, question, or paste longer text about the interview subject..."
            rows={5}
            value={inputValue}
            onChange={handleTextInputChange}
            disabled={!!selectedFile || isLoading}
          />
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border"></div>
          <span className="px-2">OR</span>
          <div className="h-px flex-1 bg-border"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload File (PDF or TXT)</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="flex-1"
              disabled={!!inputValue || isLoading}
            />
            
            {selectedFile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearSelectedFile}
                title="Clear selected file"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {selectedFile && (
            <div className="text-sm">
              <p className="font-medium">Selected file: {selectedFile.name}</p>
              <p className="text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={(!inputValue && !selectedFile) || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Process Content
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContentInput;


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiKeyService } from "@/services/apiKeyService";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyFormProps {
  onApiKeySet: () => void;
}

const ApiKeyForm = ({ onApiKeySet }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await apiKeyService.saveApiKey(apiKey);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save API key");
      }
      
      toast({
        title: "Success",
        description: "API key has been saved securely",
      });
      
      onApiKeySet();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>API Key Required</AlertTitle>
        <AlertDescription>
          To generate interview questions, you need to provide your own Gemini API key.
          Your key is stored securely in your user account.
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="flex items-center gap-1">
            <KeyRound className="h-4 w-4" />
            Gemini API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Your API key is encrypted and stored securely in the database.
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              Get a Gemini API key
            </a>
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save API Key"}
        </Button>
      </form>
    </div>
  );
};

export default ApiKeyForm;

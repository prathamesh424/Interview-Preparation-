
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import ApiKeyForm from "@/components/ApiKeyForm";
import { apiKeyService } from "@/services/apiKeyService";
import { useAuth } from "@/context/AuthContext";

const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState<string>("api");
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile");
  const [showHelp, setShowHelp] = useState<boolean>(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState<boolean>(true);
  const { user } = useAuth();

  // Function to check if API key is set
  const checkApiKey = async () => {
    if (user) {
      setIsLoadingApiKey(true);
      try {
        const hasKey = await apiKeyService.hasApiKey();
        setHasApiKey(hasKey);
      } catch (error) {
        console.error("Error checking API key:", error);
        setHasApiKey(false);
      } finally {
        setIsLoadingApiKey(false);
      }
    } else {
      setHasApiKey(false);
      setIsLoadingApiKey(false);
    }
  };

  useEffect(() => {
    // Load the saved model from localStorage
    const savedModel = localStorage.getItem('selectedGraqModel');
    if (savedModel) {
      setSelectedModel(savedModel);
    }

    // Check if API key exists
    checkApiKey();
  }, [user]);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    localStorage.setItem('selectedGraqModel', value);
  };

  const handleApiKeySet = () => {
    checkApiKey();
  };

  const handleResetApiKey = async () => {
    try {
      const result = await apiKeyService.clearApiKey();
      if (result.success) {
        setHasApiKey(false);
      }
    } catch (error) {
      console.error("Error resetting API key:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <p className="text-muted-foreground">
          Configure your interview preparation experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-6">
              {isLoadingApiKey ? (
                <div className="py-4 text-center text-muted-foreground">
                  Checking API key status...
                </div>
              ) : hasApiKey ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Gemini API Key</h3>
                      <p className="text-sm text-muted-foreground">
                        Your API key is securely stored in the database
                      </p>
                    </div>
                    <button
                      onClick={handleResetApiKey}
                      className="text-sm text-destructive hover:underline"
                    >
                      Reset API Key
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Model Selection</h3>
                    <RadioGroup
                      value={selectedModel}
                      onValueChange={handleModelChange}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gemma2-9b-it" id="gemma2-9b-it" />
                        <Label htmlFor="gemma2-9b-it">Gemma2 9B (Google)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="llama-3.3-70b-versatile" id="llama-3.3-70b-versatile" />
                        <Label htmlFor="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile (Meta)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="llama-3.1-8b-instant" id="llama-3.1-8b-instant" />
                        <Label htmlFor="llama-3.1-8b-instant">LLaMA 3.1 8B Instant (Meta)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="llama-guard-3-8b" id="llama-guard-3-8b" />
                        <Label htmlFor="llama-guard-3-8b">LLaMA Guard 3 8B (Meta)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="llama3-70b-8192" id="llama3-70b-8192" />
                        <Label htmlFor="llama3-70b-8192">LLaMA3 70B (8192 context)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="llama3-8b-8192" id="llama3-8b-8192" />
                        <Label htmlFor="llama3-8b-8192">LLaMA3 8B (8192 context)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whisper-large-v3" id="whisper-large-v3" />
                        <Label htmlFor="whisper-large-v3">Whisper Large V3 (OpenAI)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whisper-large-v3-turbo" id="whisper-large-v3-turbo" />
                        <Label htmlFor="whisper-large-v3-turbo">Whisper Large V3 Turbo (OpenAI)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="distil-whisper-large-v3-en" id="distil-whisper-large-v3-en" />
                        <Label htmlFor="distil-whisper-large-v3-en">Distil Whisper Large V3 EN (HuggingFace)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <ApiKeyForm onApiKeySet={handleApiKeySet} />
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-help">Show help information</Label>
                    <p className="text-sm text-muted-foreground">
                      Display helpful tips and guidance while using the application
                    </p>
                  </div>
                  <Switch
                    id="show-help"
                    checked={showHelp}
                    onCheckedChange={setShowHelp}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;

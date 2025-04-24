import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type CodeEditorProps = {
  codeValue: string;
  onCodeChange: (value: string) => void;
  interviewId: string;
  isInterviewer: boolean;
};

type CodeSnippet = {
  id: string;
  title: string;
  code: string;
  language: string;
  timestamp: number;
  userId: string;
  userName: string;
};

const CodeEditor = ({ codeValue, onCodeChange, interviewId , isInterviewer }: CodeEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [language, setLanguage] = useState<string>("javascript");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [snippetTitle, setSnippetTitle] = useState<string>("");
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localCodeRef = useRef<string>(codeValue);
  const isRemoteChangeRef = useRef<boolean>(false); 
  
  useEffect(() => {
    if (!interviewId) return;
    
    setIsLoading(true);
    
    const channel = supabase.channel(`code-editor-${interviewId}`, {
      config: {
        broadcast: { self: false }, 
      },
    });
    
    channel
      .on('broadcast', { event: 'code-change' }, ({ payload }) => {
        console.log('Received code change:', payload);
        
        if (payload.userId !== user?.id) {
          isRemoteChangeRef.current = true;
          onCodeChange(payload.code);
          localCodeRef.current = payload.code;
          isRemoteChangeRef.current = false;
          
          if (payload.language && payload.language !== language) {
            setLanguage(payload.language);
          }
        }
      })
      .on('broadcast', { event: 'user-joined' }, ({ payload }) => {
        console.log('User joined:', payload);
        
        setActiveUsers(prev => {
          if (!prev.includes(payload.userId)) {
            return [...prev, payload.userId];
          }
          return prev;
        });
        
        if (channelRef.current && user?.id) {
          setTimeout(() => {
            channelRef.current.send({
              type: 'broadcast',
              event: 'code-change',
              payload: { 
                code: codeValue,
                language: language,
                userId: user.id,
                userName: user.name,
                timestamp: Date.now()
              }
            });
          }, 1000); 
        }
      })
      .on('broadcast', { event: 'user-left' }, ({ payload }) => {
        console.log('User left:', payload);
        setActiveUsers(prev => prev.filter(id => id !== payload.userId));
      })
      .on('broadcast', { event: 'snippet-saved' }, ({ payload }) => {
        setSnippets(prev => {
           const exists = prev.some(s => s.id === payload.id);
          if (exists) {
            return prev.map(s => s.id === payload.id ? payload : s);
          }
          return [...prev, payload];
        });
      })
      .subscribe(async (status) => {
        console.log('Channel status:', status);
        const isNowConnected = status === 'SUBSCRIBED';
        setIsConnected(isNowConnected);
        setIsLoading(false);
        
        if (isNowConnected && user) {
          await channel.send({
            type: 'broadcast',
            event: 'user-joined',
            payload: { 
              userId: user.id,
              userName: user.name
            }
          });
          
          await channel.send({
            type: 'broadcast',
            event: 'code-change',
            payload: { 
              code: codeValue,
              language: language,
              userId: user.id,
              userName: user.name,
              timestamp: Date.now()
            }
          });
        }
      });
    
    channelRef.current = channel;
    
     loadSavedSnippets();
    
     return () => {
      if (channelRef.current && user) {
         channelRef.current.send({
          type: 'broadcast',
          event: 'user-left',
          payload: { 
            userId: user.id,
            userName: user.name
          }
        });
        
         supabase.removeChannel(channelRef.current);
      }
    };
  }, [interviewId, user]);
  
   useEffect(() => {
    localCodeRef.current = codeValue;
  }, [codeValue]);
  
   useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
   useEffect(() => {
    if (!channelRef.current || !user) return;
    
     channelRef.current.send({
      type: 'broadcast',
      event: 'code-change',
      payload: { 
        code: codeValue,
        language: language,
        userId: user.id,
        userName: user.name,
        timestamp: Date.now()
      }
    });
  }, [language]);  
  
  const loadSavedSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('interview_id', interviewId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      setSnippets(data || []);
    } catch (error) {
      console.error('Error loading snippets:', error);
    }
  };
  
 const handleSaveSnippet = async () => {
  if (!user || !snippetTitle.trim()) return;

  try {
    const newSnippet = {
      title: snippetTitle,
      code: codeValue,
      language,
      timestamp: Date.now(),
      user_id: user.id,
      user_name: user.name || 'Unknown User',
      interview_id: interviewId
    };

    const { data, error } = await supabase
      .from('code_snippets')
      .insert([newSnippet])
      .select();

    if (error) {
      console.error('Insert error:', error.message, error.details);
      throw error;
    }

    if (data && data.length > 0) {
      const savedSnippet = { ...data[0], id: data[0].id };

      setSnippets(prev => [savedSnippet, ...prev]);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'snippet-saved',
          payload: savedSnippet
        });
      }

      toast({
        title: "Code snippet saved",
        description: "Your code snippet has been saved successfully.",
      });

      setSnippetTitle("");
      setShowSaveDialog(false);
    }
  } catch (error) {
    console.error('Error saving snippet:', error);
    toast({
      title: "Error",
      description: "Failed to save the code snippet. Please try again.",
      variant: "destructive",
    });
  }
};

  
  const handleLoadSnippet = (snippet: CodeSnippet) => {
    onCodeChange(snippet.code);
    setLanguage(snippet.language);
    
     if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code-change',
        payload: { 
          code: snippet.code,
          language: snippet.language,
          userId: user.id,
          userName: user.name,
          timestamp: Date.now()
        }
      });
    }
    
    toast({
      title: "Code snippet loaded",
      description: `Loaded "${snippet.title}" by ${snippet.userName}`,
    });
  };
  
  const handleRunCode = () => {
    setIsRunning(true);
    
    try {
       const consoleOutput: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
       console.log = (...args) => {
        consoleOutput.push(args.map(arg => String(arg)).join(' '));
        originalConsoleLog(...args);
      };
      
      console.error = (...args) => {
        consoleOutput.push(`Error: ${args.map(arg => String(arg)).join(' ')}`);
        originalConsoleError(...args);
      };
      
      console.warn = (...args) => {
        consoleOutput.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`);
        originalConsoleWarn(...args);
      };
      
      setOutput("Running code...\n");
      
       setTimeout(() => {
        try {
          if (language === "javascript" || language === "typescript") {
   
            const result = eval(codeValue);
            if (result !== undefined) {
              consoleOutput.push(`Result: ${result}`);
            }
          } else if (language === "python") {
  
            consoleOutput.push("Python execution is simulated in this demo");
            consoleOutput.push("In a real implementation, this would be sent to a Python interpreter");
          } else if (language === "java") {
            consoleOutput.push("Java execution is simulated in this demo");
            consoleOutput.push("In a real implementation, this would be sent to a Java compiler and runtime");
          } else if (language === "csharp") {
            consoleOutput.push("C# execution is simulated in this demo");
            consoleOutput.push("In a real implementation, this would be sent to a C# compiler and runtime");
          } else {
            consoleOutput.push(`Language '${language}' is not supported in this demo`);
          }
        } catch (error) {
          if (error instanceof Error) {
            consoleOutput.push(`Error: ${error.message}`);
          } else {
            consoleOutput.push("An unknown error occurred during execution");
          }
        } finally {
          console.log = originalConsoleLog;
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          
          setOutput(consoleOutput.length > 0 
            ? consoleOutput.join('\n') 
            : "Code executed successfully with no output");
          
          setIsRunning(false);
        }
      }, 500);
    } catch (error) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput("An unknown error occurred");
      }
      setIsRunning(false);
    }
  };
  
  const handleCodeChange = (newCode: string) => {
    onCodeChange(newCode);
    
    if (isRemoteChangeRef.current) return;
    
    broadcastCodeChange(newCode);
  };
  
  // Add this helper function for broadcasting changes
  const broadcastCodeChange = (code: string) => {
    if (!channelRef.current || !user) return;
    
    // Clear any existing timeout to prevent multiple broadcasts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a very short debounce to batch rapid keystrokes
    debounceTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      lastUpdateRef.current = now;
      
      // Broadcast the code change to other users
      channelRef.current.send({
        type: 'broadcast',
        event: 'code-change',
        payload: { 
          code: code,
          language: language,
          userId: user.id,
          userName: user.name,
          timestamp: now
        }
      });
    }, 50); // Use a very short debounce time for more real-time feel
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Collaborative Code Editor</CardTitle>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                Disconnected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run Code
                </>
              )}
            </Button>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4 pt-2">
        <div className="">
          <Textarea 
            className="h-60 font-mono text-sm bg-muted p-4 resize-none"
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={`// Write your ${language} code here...\n\n// Example:\nconsole.log("Hello world");`}
            spellCheck={false}
          />
          <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted-foreground/10 px-2 py-1 rounded">
            {activeUsers.length > 1 
              ? `${activeUsers.length} participants editing` 
              : "Collaborative: both participants can edit"}
          </div>
        </div>
        
        <div>
          {isInterviewer &&
          <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Snippet
          </Button>
        </div>
        }
        { output && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">Output:</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setOutput("")}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="font-mono text-sm bg-black text-green-400 p-4 rounded-md h-32 overflow-auto whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
        
        {snippets.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Saved Snippets:</div>
            <div className="space-y-2 max-h-40 overflow-auto">
              {snippets.map(snippet => (
                <div 
                  key={snippet.id} 
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <div className="truncate flex-1">
                    <span className="font-medium">{snippet.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      by {snippet.userName}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLoadSnippet(snippet)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
        
      </CardContent>
      
      {showSaveDialog && (
        <CardFooter className="pt-0">
          <div className="w-full space-y-2">
            <Input
              placeholder="Snippet title"
              value={snippetTitle}
              onChange={(e) => setSnippetTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveSnippet}
                disabled={!snippetTitle.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CodeEditor;

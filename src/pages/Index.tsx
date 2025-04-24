
import { useEffect } from "react"; // Import useEffect
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Upload, 
  CheckCircle, 
  Glasses, 
  Bookmark, 
  Tag
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use useEffect for navigation side effect
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true }); // Use replace to avoid adding login page to history
    }
  }, [user, navigate]); // Depend on user and navigate

  // Render the component content even if user exists; 
  // the useEffect will handle navigation after render.
  // Avoid rendering the main content if redirecting immediately might cause a flash,
  // but for login pages, showing it briefly is usually acceptable.
  // If a loading state is preferred while checking user:
  // if (user) return <div>Redirecting...</div>; 

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b">
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InterviewAce
            </h1>
            <div className="hidden md:flex space-x-4"></div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-secondary/20 to-background"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="outline" className="px-3 py-1 bg-secondary text-foreground border-secondary">
                  AI-Powered Interview Prep
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Ace Your <span className="text-primary">Technical Interviews</span> with AI Assistance
                </h1>
                <p className="text-lg text-muted-foreground">
                  Generate  customized interview questions based on your content, practice with real-time AI feedback, and track your progress.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="gap-2" onClick={() => navigate("/register")}>
                    <CheckCircle className="h-5 w-5" /> Get Started
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/login")}>
                    <Glasses className="h-5 w-5" /> Try Demo
                  </Button>
                </div>
              </div>

              <div className="bg-card border rounded-lg shadow-lg p-8">
                <AuthForm />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-2">
                InterviewAce uses AI to help you prepare for technical interviews
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Input Your Content</CardTitle>
                  <CardDescription>
                    Enter a topic, paste a paragraph, or upload a PDF file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Provide the subject matter you want to practice, and our AI will generate relevant interview questions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Practice with AI Feedback</CardTitle>
                  <CardDescription>
                    Answer generated questions and receive immediate feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get detailed feedback on your answers, including what you got right, what you missed, and suggestions for improvement.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Bookmark className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Save and Organize</CardTitle>
                  <CardDescription>
                    Build your personal question bank for future reference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Save important questions, add notes, organize by subjects, and tag them for easy retrieval when you need them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Key Features</h2>
              <p className="text-muted-foreground mt-2">
                Everything you need to prepare for your technical interviews
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4 items-start">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Upload className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multiple Input Methods</h3>
                  <p className="text-muted-foreground mt-1">
                    Enter a topic name, paste a paragraph, or upload a PDF file to generate relevant questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI-Powered Feedback</h3>
                  <p className="text-muted-foreground mt-1">
                    Receive detailed feedback on your answers, including strengths, weaknesses, and suggestions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Diverse Question Types</h3>
                  <p className="text-muted-foreground mt-1">
                    Practice with various question types including theory, coding, debugging, and scenario-based questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Tag className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Custom Organization</h3>
                  <p className="text-muted-foreground mt-1">
                    Organize saved questions with custom tags, subjects, and personal notes for efficient review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to ace your next interview?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start preparing with InterviewAce today and gain the confidence you need for your technical interviews.
            </p>
            <Button size="lg" onClick={() => navigate("/register")}>
              Create Your Free Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-muted/30 py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} InterviewAce. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-muted-foreground text-sm">
                Powered by AI for better interview preparation
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

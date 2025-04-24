// import { useState, useEffect, useRef } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { StarIcon, Upload, Mic, StopCircle, Loader2, Video, Volume2 } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import { aiInterviewService } from "@/services/aiInterviewService"; // Assuming this exists
// import { useAudioRecording } from "@/hooks/useAudioRecording"; // Assuming this exists
// import { useToast } from "@/components/ui/use-toast";

// interface AIFeedback {
//   questionId: string;
//   question: string;
//   answer: string;
//   score: number;
//   feedback: string;
// }

// interface InterviewQuestion {
//   id: string;
//   question: string;
// }

// const AIInstantInterview = () => {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [step, setStep] = useState<'upload' | 'questions' | 'feedback'>('upload');
//   const [resume, setResume] = useState<File | null>(null);
//   const [resumeText, setResumeText] = useState<string>('');
//   const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [isRecording, setIsRecording] = useState(false);
//   const [feedback, setFeedback] = useState<AIFeedback[]>([]);
//   const [loading, setLoading] = useState(false); // General loading for resume/question gen
//   const [currentAnswer, setCurrentAnswer] = useState<string>('');
//   const { startRecording, stopRecording, audioBlob } = useAudioRecording();
//   const transcriptionTimeout = useRef<NodeJS.Timeout | null>(null);
//   const [mediaPermissions, setMediaPermissions] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
//   const userVideoRef = useRef<HTMLVideoElement>(null);
//   const aiVideoRef = useRef<HTMLVideoElement>(null);
//   const userStreamRef = useRef<MediaStream | null>(null);
//   const [aiSpeaking, setAiSpeaking] = useState(false); // State for AI video control
//   const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); // Lock for audio processing
//   const [showTranscription, setShowTranscription] = useState(true); // Toggle transcription visibility

//   // --- State Logging Effect ---
//   useEffect(() => {
//     console.log(
//       `State Update: step=${step}, mediaPermissions=${mediaPermissions}, aiSpeaking=${aiSpeaking}, isRecording=${isRecording}, isProcessingAnswer=${isProcessingAnswer}, currentQuestionIndex=${currentQuestionIndex}, showTranscription=${showTranscription}`
//     );
//   }, [step, mediaPermissions, aiSpeaking, isRecording, isProcessingAnswer, currentQuestionIndex, showTranscription]);


//   // --- Audio Blob Processing Effect ---
//   useEffect(() => {
//     console.log(`AudioBlob Effect: audioBlob=${!!audioBlob}, isRecording=${isRecording}, isProcessingAnswer=${isProcessingAnswer}`);
//     // Process audio only if a blob exists AND we are in the processing state
//     if (audioBlob && isProcessingAnswer) { // Changed condition: process only when processing flag is true
//       console.log("Audio blob detected while processing flag is set, calling processAudio...");
//       processAudio();
//     } else if (audioBlob && !isProcessingAnswer) {
//         console.warn("Audio blob detected, but isProcessingAnswer is false. Ignoring.");
//     }
//   }, [audioBlob, isProcessingAnswer]); // Depend only on blob and processing flag

//    // --- Step Change / Permissions / Cleanup Effect ---
//   useEffect(() => {
//     console.log(`Step/Permissions Effect: step=${step}, mediaPermissions=${mediaPermissions}`);
//     if (step === 'questions' && mediaPermissions === 'idle') {
//       requestMediaPermissions();
//     }

//     // Cleanup function runs when step changes OR component unmounts
//     return () => {
//         console.log(`Running cleanup for step: ${step}`);
//         if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
//             console.log("Cancelling speech synthesis in cleanup.");
//             window.speechSynthesis.cancel();
//         }
//         if (userStreamRef.current) {
//             console.log("Stopping media stream tracks in cleanup.");
//             userStreamRef.current.getTracks().forEach(track => track.stop());
//             userStreamRef.current = null;
//         }
//         if (userVideoRef.current) {
//             console.log("Clearing user video srcObject in cleanup.");
//             userVideoRef.current.srcObject = null;
//         }
//         if (aiVideoRef.current) {
//             console.log("Pausing AI video in cleanup.");
//             aiVideoRef.current.pause();
//         }
//         // Reset states relevant to the interview process if leaving 'questions' step
//         // This cleanup runs *after* the component potentially re-renders due to step change,
//         // so resetting here is mainly for unmounting or navigating away.
//         if (step !== 'questions') {
//              console.log("Resetting states as we are leaving 'questions' step.");
//              setMediaPermissions('idle');
//              setIsRecording(false);
//              setIsProcessingAnswer(false);
//              setAiSpeaking(false);
//              setCurrentAnswer('');
//         }
//     };
//   }, [step]); // Dependency ONLY on step

//   // --- User Video Stream Assignment Effect ---
//   useEffect(() => {
//     console.log(`Stream assignment effect: Permissions=${mediaPermissions}, Stream exists=${!!userStreamRef.current}, VideoRef exists=${!!userVideoRef.current}`);
//     if (mediaPermissions === 'granted' && userStreamRef.current && userVideoRef.current) {
//       if (userVideoRef.current.srcObject !== userStreamRef.current) {
//         console.log("Assigning stream to user video element.");
//         userVideoRef.current.srcObject = userStreamRef.current;
//       }
//       // Use a timeout to delay the play attempt slightly, allowing the element to potentially mount fully
//       const playTimeout = setTimeout(() => {
//           if (userVideoRef.current && userVideoRef.current.paused) {
//             console.log("User video is paused, attempting to play.");
//             userVideoRef.current.play().catch(e => console.error("User video play error:", e));
//           }
//       }, 100);
//       return () => clearTimeout(playTimeout);

//     } else if (userVideoRef.current?.srcObject) {
//       console.log("Clearing user video srcObject (no permission or stream).");
//       userVideoRef.current.srcObject = null;
//     }
//   }, [mediaPermissions, userStreamRef.current]);

//   // --- AI Video Playback Control Effect ---
//   useEffect(() => {
//     if (!aiVideoRef.current || step !== 'questions') return;

//     if (aiSpeaking) {
//         console.log("AI is speaking, ensuring video plays.");
//         aiVideoRef.current.currentTime = 0;
//         aiVideoRef.current.play().catch(e => console.error("AI video play error:", e));
//     } else {
//         console.log("AI is not speaking, ensuring video pauses.");
//         aiVideoRef.current.pause();
//     }
//   }, [aiSpeaking, step]);

//   // --- Speak Question on Index Change Effect ---
//   useEffect(() => {
//     console.log(`Question index changed: ${currentQuestionIndex}, Step: ${step}`);
//     if (step === 'questions' && questions.length > 0 && currentQuestionIndex > 0) {
//       const questionToSpeak = questions[currentQuestionIndex]?.question;
//       if (questionToSpeak) {
//           console.log(`Speaking question index ${currentQuestionIndex}: ${questionToSpeak}`);
//           speakText(questionToSpeak);
//           setCurrentAnswer('');
//       } else {
//           console.warn(`Could not find question text for index ${currentQuestionIndex}`);
//       }
//     } else if (step === 'questions' && currentQuestionIndex === 0) {
//         console.log("Initial question (index 0) speech handled by permission grant flow.");
//     }
//   }, [currentQuestionIndex, questions, step]);

//   // --- Text-to-Speech Function ---
//   const speakText = (text: string) => {
//     if (!('speechSynthesis' in window)) {
//       console.warn("Speech synthesis not supported."); return;
//     }
//     if (window.speechSynthesis.speaking) {
//         console.log("Cancelling previous speech synthesis.");
//         window.speechSynthesis.cancel();
//     }

//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 0.9;
//     utterance.pitch = 1;
//     let startRecordingTimeout: NodeJS.Timeout | null = null;

//     utterance.onstart = () => {
//         console.log("TTS started");
//         setAiSpeaking(true);
//         setIsRecording(false);
//         if (startRecordingTimeout) clearTimeout(startRecordingTimeout);
//     };
//     utterance.onend = () => {
//         console.log("TTS ended");
//         setAiSpeaking(false);
//         startRecordingTimeout = setTimeout(() => {
//             handleStartRecording();
//         }, 50);
//     };
//     utterance.onerror = (event) => {
//         console.error("Speech synthesis error", event);
//         setAiSpeaking(false);
//         if (startRecordingTimeout) clearTimeout(startRecordingTimeout);
//         handleStartRecording();
//     };
//     setTimeout(() => {
//         window.speechSynthesis.speak(utterance);
//     }, 100);
//   };

//   // --- Media Permissions Request ---
//   const requestMediaPermissions = async () => {
//     console.log("Attempting to request media permissions...");
//     setMediaPermissions('pending');
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//       console.log("getUserMedia successful, stream obtained:", stream);
//       userStreamRef.current = stream;
//       console.log("Permissions granted, setting state.");
//       setMediaPermissions('granted');

//       if (aiVideoRef.current) {
//           aiVideoRef.current.src = '/ai_talking.mp4';
//           aiVideoRef.current.load();
//           aiVideoRef.current.pause();
//       }
//       if (questions.length > 0) {
//          console.log("Speaking first question (after permissions granted)...");
//          speakText(questions[0].question);
//       }
//     } catch (err: any) {
//       console.error("Error accessing media devices:", err.name, err.message, err);
//       setMediaPermissions('denied');
//       toast({
//         title: `Permissions Error (${err.name || 'Unknown'})`,
//         description: "Camera/mic access required. Check browser/OS settings.",
//         variant: "destructive",
//       });
//       setStep('upload');
//     }
//   };

//   // --- Start Recording ---
//   const handleStartRecording = async () => {
//     if (isRecording || isProcessingAnswer || aiSpeaking) {
//         console.log(`Start recording prevented: isRecording=${isRecording}, isProcessingAnswer=${isProcessingAnswer}, aiSpeaking=${aiSpeaking}`);
//         return;
//     }
//     console.log("Starting recording...");
//     setCurrentAnswer('');
//     setIsRecording(true);
//     try {
//         await startRecording();
//     } catch (error) {
//         console.error("Failed to start recording:", error);
//         setIsRecording(false);
//         toast({ title: "Recording Error", description: "Could not start microphone.", variant: "destructive" });
//     }
//   };

//   // --- Next Question / Finish ---
//   const handleNextQuestion = async () => {
//     console.log(`handleNextQuestion: Start. isRecording=${isRecording}, isProcessingAnswer=${isProcessingAnswer}`);
//     if (!isRecording || isProcessingAnswer) {
//         console.log("handleNextQuestion aborted: Not recording or already processing.");
//         return;
//     }
//     console.log("handleNextQuestion: Setting isProcessingAnswer=true, isRecording=false, calling stopRecording...");
//     setIsProcessingAnswer(true); // Lock processing FIRST
//     setIsRecording(false); // Update recording state
//     setAiSpeaking(false); // Ensure AI video is paused
//     // setLoading(true); // Rely on isProcessingAnswer for loading state
//     stopRecording(); // Stop the actual recording process -> triggers useEffect watching audioBlob
//   };

//   // --- Process Recorded Audio ---
//   const processAudio = async () => {
//     if (!audioBlob) {
//         console.error("processAudio called without audioBlob.");
//         setIsProcessingAnswer(false); setLoading(false); return;
//     }
//     console.log("Processing audio...");
//     // Lock should be set, ensure loading is on
//     setLoading(true); // Use general loading state during processing

//     try {
//       const transcription = await simulateTranscription(audioBlob);
//       console.log("Transcription received (simulated):", transcription);
//       setCurrentAnswer(transcription);

//       const currentQuestion = questions[currentQuestionIndex];
//       if (!currentQuestion) {
//             console.error(`Invalid current question index: ${currentQuestionIndex}`);
//             toast({ title: "Internal Error", description: "Could not find current question.", variant: "destructive" });
//             setStep('feedback');
//             setIsProcessingAnswer(false); setLoading(false); return;
//        }
//       console.log(`Evaluating answer for question: ${currentQuestion.question}`);
//       const evaluation = await aiInterviewService.evaluateAnswer(currentQuestion.question, transcription);
//       console.log("Evaluation received:", evaluation);

//       const newFeedback: AIFeedback = {
//         questionId: currentQuestion.id || `q-${currentQuestionIndex}`,
//         question: currentQuestion.question,
//         answer: transcription,
//         score: typeof evaluation.score === 'number' ? evaluation.score : 0,
//         feedback: typeof evaluation.feedback === 'string' ? evaluation.feedback : "No feedback provided.",
//       };
//       setFeedback(prev => [...prev, newFeedback]);

//       if (currentQuestionIndex < questions.length - 1) {
//         console.log("Moving to next question.");
//         // Release lock *before* changing index
//         setIsProcessingAnswer(false);
//         setLoading(false);
//         setCurrentQuestionIndex(prev => prev + 1); // Triggers useEffect to speak next question
//       } else {
//         console.log("Interview finished, moving to feedback step.");
//         // Release lock before setting step
//         setIsProcessingAnswer(false);
//         setLoading(false);
//         setStep('feedback'); // Cleanup is handled by the useEffect watching 'step'
//         toast({
//           title: "Interview Complete",
//           description: "Your AI interview has been completed. Check your feedback.",
//         });
//       }
//     } catch (error) {
//       console.error('Error processing audio/evaluation:', error);
//       toast({
//         title: "Error",
//         description: "Failed to process your answer. Please try again.",
//         variant: "destructive",
//       });
//       setIsProcessingAnswer(false); // Release lock on error
//       setLoading(false);
//     }
//   };

//   // --- Resume Upload and Processing ---
//   const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
//     console.log(`Resume file selected: ${file.name}, type: ${file.type}`);
//     setResume(file);
//     setLoading(true);
//     try {
//       let textToProcess = '';
//       if (file.type === 'text/plain') {
//         textToProcess = await readFileAsText(file);
//       } else {
//         console.warn(`File type ${file.type} not directly supported for text extraction. Using fallback.`);
//         const filename = file.name.replace(/\.[^/.]+$/, "");
//         textToProcess = `Resume for ${filename}\n\nSkills: JavaScript, React, TypeScript, Node.js\n\nExperience: 3 years of frontend development`;
//       }
//       setResumeText(textToProcess);
//       await processResume(textToProcess);
//     } catch (error) {
//       console.error('Error handling resume upload:', error);
//       toast({
//         title: "Resume Error",
//         description: "Failed to process your resume. Please try again.",
//         variant: "destructive",
//       });
//       setResume(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processResume = async (text: string) => {
//     console.log("Processing resume text to generate questions...");
//     setLoading(true);
//     try {
//       const generatedQuestionsResult = await aiInterviewService.generateQuestionsFromResume(text);
//       console.log("Questions received from service:", generatedQuestionsResult);

//       // Validate structure: Check if it's an array and if items look like questions
//       const validQuestions = Array.isArray(generatedQuestionsResult)
//         ? generatedQuestionsResult.filter(q => (typeof q === 'string' && q.trim() !== '') || (typeof q === 'object' && q !== null && typeof q.question === 'string' && q.question.trim() !== ''))
//         : [];

//       if (validQuestions.length > 0) {
//         const formattedQuestions: InterviewQuestion[] = validQuestions.map((q, index) => {
//             if (typeof q === 'string') {
//                 return { id: `gen-q-${index}-${Date.now()}`, question: q };
//             }
//             return { id: q.id || `gen-q-${index}-${Date.now()}`, question: q.question };
//         });

//         console.log("Formatted questions:", formattedQuestions);
//         setQuestions(formattedQuestions);
//         setStep('questions');
//         toast({
//           title: "Interview Ready",
//           description: `${formattedQuestions.length} questions generated.`,
//         });
//       } else {
//         console.error("No valid questions generated from resume or service returned invalid format.");
//         throw new Error("Failed to generate valid interview questions from the resume.");
//       }
//     } catch (error) {
//       console.error('Error generating questions:', error);
//       toast({
//         title: "Question Generation Error",
//         description: "Could not generate questions from the resume. Please try again.",
//         variant: "destructive",
//       });
//       setStep('upload');
//     } finally {
//         setLoading(false);
//     }
//   };

//   const readFileAsText = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = (e) => resolve(e.target?.result as string);
//       reader.onerror = (e) => reject(e);
//       reader.readAsText(file);
//     });
//   };

//   // --- Simulate Transcription ---
//   const simulateTranscription = (audio: Blob): Promise<string> => {
//     console.log("Simulating transcription for audio blob:", audio);
//     return new Promise((resolve) => {
//       const answers = [
//         "My primary experience lies in building dynamic user interfaces with React and managing state effectively.",
//         "I've utilized Node.js with Express for creating backend APIs and integrating with databases like PostgreSQL.",
//         "I approach problem-solving by first understanding the requirements thoroughly, then breaking the problem down, and finally iterating on solutions.",
//         "Code quality is maintained through consistent linting, TypeScript for type safety, unit tests with Jest/React Testing Library, and peer code reviews.",
//         "I have experience setting up basic CI/CD pipelines using GitHub Actions to automate testing and deployment."
//       ];
//       const delay = Math.floor(Math.random() * 1000) + 500;
//       transcriptionTimeout.current = setTimeout(() => {
//         const answer = answers[currentQuestionIndex % answers.length];
//         console.log(`Simulated transcription result: "${answer}"`);
//         resolve(answer);
//       }, delay);
//     });
//   };

//   // --- Cleanup Timeout ---
//   useEffect(() => {
//     return () => {
//       if (transcriptionTimeout.current) {
//         clearTimeout(transcriptionTimeout.current);
//       }
//     };
//   }, []);

//   // --- Calculate Score ---
//   const calculateOverallScore = (): number => {
//     if (feedback.length === 0) return 0;
//     const total = feedback.reduce((sum, item) => sum + (item?.score || 0), 0);
//     return Math.round((total / feedback.length) * 10) / 10;
//   };

//   // --- Render Logic ---
//   return (
//     <div className="space-y-6 p-4 md:p-6">
//         {step === 'upload' && (
//           <div className="space-y-4 max-w-lg mx-auto">
//             <h2 className="text-2xl font-semibold text-center mb-6">AI Instant Interview</h2>
//             <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
//               <Upload className="w-12 h-12 mb-4 text-gray-400" />
//               <div className="flex flex-col items-center w-full">
//                 <Input
//                   type="file"
//                   accept=".pdf,.doc,.docx,.txt"
//                   onChange={handleResumeUpload}
//                   className="hidden"
//                   id="resume-upload"
//                   disabled={loading}
//                 />
//                 <Button
//                   onClick={() => document.getElementById('resume-upload')?.click()}
//                   disabled={loading}
//                   className="mb-2"
//                 >
//                   {loading ? (
//                     <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
//                   ) : (
//                     "Upload Resume to Start"
//                   )}
//                 </Button>
//                 {resume && (
//                   <p className="mt-1 text-sm font-medium text-green-600">
//                     Selected: {resume.name}
//                   </p>
//                 )}
//                 <p className="mt-2 text-xs text-gray-500 text-center">
//                   Upload your resume (.txt, .pdf, .doc, .docx). Questions will be generated based on its content.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* --- Interview Step --- */}
//         {step === 'questions' && mediaPermissions === 'granted' && questions.length > 0 && (
//           <div key={`interview-${questions[0]?.id}`} className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-150px)]">
//             {/* Video Panels */}
//             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 min-h-[200px] md:min-h-[300px]">
//               {/* AI Video Panel */}
//               <div className="bg-gray-900 rounded-lg overflow-hidden relative shadow-lg">
//                  <video
//                     ref={aiVideoRef}
//                     src="/ai_talking.mp4"
//                     className="w-full h-full object-cover"
//                     muted
//                     playsInline
//                     onError={(e) => {
//                       console.error('AI Video failed to load:', e);
//                       (e.target as HTMLVideoElement).style.display = 'none';
//                     }}
//                  />
//                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
//                     AI Interviewer
//                  </div>
//               </div>
//               {/* User Video Panel */}
//               <div className="bg-gray-200 rounded-lg overflow-hidden relative shadow-lg">
//                  <video
//                     ref={userVideoRef}
//                     className="w-full h-full object-cover transform scale-x-[-1]"
//                     autoPlay
//                     muted
//                     playsInline
//                  />
//                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
//                     You
//                  </div>
//               </div>
//             </div>

//             {/* Question and Controls */}
//             <div className="p-4 border rounded-lg bg-white shadow-md space-y-3">
//               <div className="flex justify-between items-center">
//                 <h3 className="text-md font-semibold">
//                   Question {currentQuestionIndex + 1} / {questions.length}
//                 </h3>
//                  <div className="flex items-center gap-2">
//                     <Button variant="outline" size="sm" onClick={() => {
//                         console.log(`Toggling transcription visibility. Current: ${showTranscription}`);
//                         setShowTranscription(prev => !prev);
//                       }} title={showTranscription ? "Hide Transcription" : "Show Transcription"}>
//                         {showTranscription ? "Hide" : "Show"} Text
//                     </Button>
//                     <Button variant="ghost" size="icon" onClick={() => speakText(questions[currentQuestionIndex]?.question)} title="Repeat question" disabled={aiSpeaking}>
//                         <Volume2 className="h-5 w-5" />
//                     </Button>
//                  </div>
//               </div>

//               <p className="text-gray-800 text-lg min-h-[3em] font-medium py-2">
//                 {questions[currentQuestionIndex]?.question}
//               </p>

//               {/* Transcription Display - Simplify condition */}
//               {showTranscription && currentAnswer && (
//                 <div className="p-3 bg-gray-100 rounded-lg text-sm border max-h-24 overflow-y-auto">
//                   <p className="font-medium text-gray-600 mb-1">Your transcribed answer:</p>
//                   <p className="text-gray-800">{currentAnswer}</p>
//                 </div>
//               )}
//               {/* Placeholder when transcription is hidden or not available yet */}
//               {(!showTranscription || !currentAnswer) && !isRecording && !isProcessingAnswer && (
//                  <div className="h-[76px]"></div> // Keep placeholder to prevent layout shift
//               )}


//               {/* Button Area */}
//               <div className="flex justify-center items-center space-x-4 pt-2">
//                  {/* Status Indicator */}
//                  <div className="flex items-center justify-center text-sm font-medium text-gray-700 w-40 h-10 border rounded-md bg-gray-100">
//                     {isProcessingAnswer || loading ? (
//                         <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
//                     ) : isRecording ? (
//                         <><Mic className="mr-2 h-5 w-5 text-red-500 animate-pulse" /> Recording...</>
//                     ) : aiSpeaking ? (
//                         "AI is Speaking..."
//                     ) : (
//                          currentAnswer ? "Answer Processed" : "Ready to Record"
//                     )}
//                  </div>
//                  {/* Next/Finish Button - Disabled only when processing or AI speaking */}
//                  <Button
//                     onClick={handleNextQuestion}
//                     className="w-40"
//                     disabled={isProcessingAnswer || aiSpeaking || !isRecording} // Only disabled if processing, AI speaking, or not recording
//                  >
//                     {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
//                  </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* --- Permission States --- */}
//          {step === 'questions' && mediaPermissions === 'pending' && (
//             <div className="flex flex-col items-center justify-center p-6 text-center">
//                 <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
//                 <p className="text-gray-600 font-medium">Requesting camera and microphone access...</p>
//                 <p className="text-sm text-gray-500 mt-1">Please allow access in the browser prompt.</p>
//             </div>
//          )}
//          {step === 'questions' && mediaPermissions === 'denied' && (
//              <div className="flex flex-col items-center justify-center p-6 border border-destructive rounded-lg bg-destructive/10 text-center max-w-md mx-auto">
//                 <Video className="h-8 w-8 text-destructive mb-4" />
//                 <p className="text-destructive font-semibold mb-2">Permissions Denied</p>
//                 <p className="text-sm text-destructive/90 mb-4">
//                     Camera and microphone access are required. Please grant permissions in your browser/OS settings and refresh, or go back.
//                 </p>
//                  <Button onClick={() => setStep('upload')} variant="secondary">Go Back to Upload</Button>
//             </div>
//          )}

//         {/* --- Feedback Step --- */}
//         {step === 'feedback' && (
//           <div className="space-y-6 max-w-3xl mx-auto">
//              <h2 className="text-2xl font-semibold text-center mb-6">Interview Feedback</h2>
//             <div className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
//               <h3 className="text-lg font-semibold">Overall Performance</h3>
//               <div className="flex items-center gap-2">
//                 <span className="font-bold text-lg">{calculateOverallScore()}/5</span>
//                 <div className="flex">
//                   {[1, 2, 3, 4, 5].map(star => (
//                     <StarIcon
//                       key={star}
//                       className={`h-6 w-6 ${
//                         star <= calculateOverallScore() ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
//                       }`}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//             {feedback.map((item, index) => {
//                if (!item) {
//                    console.warn(`Feedback item at index ${index} is null/undefined.`);
//                    return null;
//                }
//                return ( // Ensure this return is directly returning the Card JSX
//                  <Card key={item.questionId || index} className="mb-4 overflow-hidden">
//                    <CardHeader className="bg-gray-50 p-4">
//                   <CardTitle className="text-md font-semibold">Question {index + 1}: Score {item?.score ?? 0}/5</CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-4 space-y-3">
//                   <p className="font-medium text-gray-800">{item?.question || "Question not available"}</p>
//                   <div className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-md border">
//                     <p className="font-semibold text-gray-500 mb-1">Your Answer:</p>
//                     <p>{item?.answer || "Answer not available"}</p>
//                   </div>
//                   <div className="mt-3 p-3 border rounded-md bg-blue-50 border-blue-200">
//                     <p className="font-semibold text-blue-800 mb-1">Feedback:</p>
//                     <p className="text-sm text-blue-900">{item?.feedback || "Feedback not available"}</p>
//                   </div>
//                 </CardContent>
//               </Card>
//             );})}

//             <div className="flex justify-center pt-4">
//               <Button size="lg" onClick={() => {
//                 setStep('upload');
//                 setResume(null);
//                 setResumeText('');
//                 setQuestions([]);
//                 setCurrentQuestionIndex(0);
//                 setFeedback([]);
//                 setCurrentAnswer('');
//                 setMediaPermissions('idle');
//                 setIsProcessingAnswer(false);
//                 setLoading(false);
//                 setAiSpeaking(false);
//                 userStreamRef.current = null;
//                 if(userVideoRef.current) userVideoRef.current.srcObject = null;
//                 if(aiVideoRef.current) aiVideoRef.current.pause();
//               }}>
//                 Start New Interview
//               </Button>
//             </div>
//           </div>
//         )}
//     </div>
//   );
// };

// export default AIInstantInterview;


import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StarIcon, Upload, Mic, StopCircle, Loader2, Video, Volume2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { aiInterviewService } from "@/services/aiInterviewService";  
  import { useToast } from "@/components/ui/use-toast";
 
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true; // Keep listening even after pauses
  recognition.interimResults = true; // Get results as they come
  recognition.lang = 'en-US'; // Set language
  console.log("SpeechRecognition initialized.");
} else {
  console.warn("Speech Recognition API not supported in this browser.");
}
// --- Interfaces ---
interface AIFeedback {
  questionId: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

interface InterviewQuestion {
  id: string;
  question: string;
}

const AIInstantInterview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'questions' | 'feedback'>('upload');
  const [resume, setResume] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Replaced isRecording with isListening for clarity with SpeechRecognition
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [loading, setLoading] = useState(false); // General loading for resume/question gen
  const [currentAnswer, setCurrentAnswer] = useState<string>(''); // Shows live transcription
  const finalTranscriptRef = useRef<string>(''); // Stores the finalized transcript chunk by chunk
  // Removed audioBlob state
  const [mediaPermissions, setMediaPermissions] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLVideoElement>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false); // State for AI video control
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false); // Lock for evaluation
  const [showTranscription, setShowTranscription] = useState(true); // Toggle transcription visibility
  const [speechApiError, setSpeechApiError] = useState<string | null>(null); // Store speech API errors

  // --- State Logging Effect ---
  useEffect(() => {
    console.log(
      `State Update: step=${step}, mediaPermissions=${mediaPermissions}, aiSpeaking=${aiSpeaking}, isListening=${isListening}, isProcessingAnswer=${isProcessingAnswer}, currentQuestionIndex=${currentQuestionIndex}, showTranscription=${showTranscription}`
    );
  }, [step, mediaPermissions, aiSpeaking, isListening, isProcessingAnswer, currentQuestionIndex, showTranscription]);

  // --- Step Change / Permissions / Cleanup Effect ---
  useEffect(() => {
    console.log(`Step/Permissions Effect: step=${step}, mediaPermissions=${mediaPermissions}`);
    if (step === 'questions' && mediaPermissions === 'idle') {
      requestMediaPermissions();
    }

    // Cleanup function runs when step changes OR component unmounts
    return () => {
      console.log(`Running cleanup for step: ${step}`);
      // Stop speech synthesis if active
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        console.log("Cancelling speech synthesis in cleanup.");
        window.speechSynthesis.cancel();
      }
      // Stop speech recognition if active
      if (recognition && isListening) {
        console.log("Stopping speech recognition in cleanup.");
        recognition.stop();
        setIsListening(false);
      }
      // Stop media stream tracks
      if (userStreamRef.current) {
        console.log("Stopping media stream tracks in cleanup.");
        userStreamRef.current.getTracks().forEach(track => track.stop());
        userStreamRef.current = null;
      }
      // Clear video elements
      if (userVideoRef.current) {
        console.log("Clearing user video srcObject in cleanup.");
        userVideoRef.current.srcObject = null;
      }
      if (aiVideoRef.current) {
        console.log("Pausing AI video in cleanup.");
        aiVideoRef.current.pause();
      }
      // Reset states relevant to the interview process if leaving 'questions' step
      if (step !== 'questions') {
        console.log("Resetting states as we are leaving 'questions' step.");
        setMediaPermissions('idle');
        setIsListening(false); // Reset listening state
        setIsProcessingAnswer(false);
        setAiSpeaking(false);
        setCurrentAnswer('');
        finalTranscriptRef.current = '';
        setSpeechApiError(null);
      }
    };
  }, [step, isListening]);  
  useEffect(() => {
    console.log(`Stream assignment effect: Permissions=${mediaPermissions}, Stream exists=${!!userStreamRef.current}, VideoRef exists=${!!userVideoRef.current}`);
    if (mediaPermissions === 'granted' && userStreamRef.current && userVideoRef.current) {
      if (userVideoRef.current.srcObject !== userStreamRef.current) {
        console.log("Assigning stream to user video element.");
        userVideoRef.current.srcObject = userStreamRef.current;
      }
      // Use a timeout to delay the play attempt slightly
      const playTimeout = setTimeout(() => {
        if (userVideoRef.current && userVideoRef.current.paused) {
          console.log("User video is paused, attempting to play.");
          userVideoRef.current.play().catch(e => console.error("User video play error:", e));
        }
      }, 100);
      return () => clearTimeout(playTimeout);

    } else if (userVideoRef.current?.srcObject) {
      console.log("Clearing user video srcObject (no permission or stream).");
      userVideoRef.current.srcObject = null;
    }
  }, [mediaPermissions, userStreamRef.current]);  
  useEffect(() => {
    if (!aiVideoRef.current || step !== 'questions') return;

    if (aiSpeaking) {
      console.log("AI is speaking, ensuring video plays.");
      aiVideoRef.current.currentTime = 0;
      aiVideoRef.current.play().catch(e => console.error("AI video play error:", e));
    } else {
      console.log("AI is not speaking, ensuring video pauses.");
      aiVideoRef.current.pause();
    }
  }, [aiSpeaking, step]);

  // --- Speak Question on Index Change Effect ---
  useEffect(() => {
    console.log(`Question index changed: ${currentQuestionIndex}, Step: ${step}, Permissions: ${mediaPermissions}`); 
    if (step === 'questions' && mediaPermissions === 'granted' && questions.length > 0 && currentQuestionIndex >= 0) {
        const questionToSpeak = questions[currentQuestionIndex]?.question;
        if (questionToSpeak) {
            console.log(`Speaking question index ${currentQuestionIndex}: ${questionToSpeak}`);
            // Don't speak if processing or already speaking
            if (!isProcessingAnswer && !aiSpeaking) {
                 speakText(questionToSpeak);
            }
        } else {
            console.warn(`Could not find question text for index ${currentQuestionIndex}`);
        }
    }
  }, [currentQuestionIndex, questions, step, mediaPermissions]); 

  // --- Text-to-Speech Function ---
 const speakText = useCallback((text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported.");
    setTimeout(handleStartListening, 500);
    return;
  }

  if (window.speechSynthesis.speaking) {
    console.log("Cancelling previous speech synthesis.");
    window.speechSynthesis.cancel();
  }

  if (recognition && isListening) {
    console.log("Stopping active speech recognition before AI speaks.");
    recognition.stop();
    setIsListening(false);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;

  // 👩 Select a female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(voice =>
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("woman") ||
    voice.name.toLowerCase().includes("susan") || // Example: common female names
    voice.name.toLowerCase().includes("zira") ||  // Microsoft's female voice
    voice.name.toLowerCase().includes("google us english")
  );

  if (femaleVoice) {
    utterance.voice = femaleVoice;
    console.log("Using voice:", femaleVoice.name);
  } else {
    console.warn("No female voice found. Using default.");
  }

  let startListeningTimeout: NodeJS.Timeout | null = null;

  utterance.onstart = () => {
    console.log("TTS started");
    setAiSpeaking(true);
    setIsListening(false);
    setSpeechApiError(null);
    if (startListeningTimeout) clearTimeout(startListeningTimeout);
  };

  utterance.onend = () => {
    console.log("TTS ended");
    setAiSpeaking(false);
    startListeningTimeout = setTimeout(() => {
      handleStartListening();
    }, 300);
  };

  utterance.onerror = (event) => {
    console.error("Speech synthesis error", event);
    toast({
      title: "Audio Error",
      description: "Could not play AI voice.",
      variant: "destructive",
    });
    setAiSpeaking(false);
    if (startListeningTimeout) clearTimeout(startListeningTimeout);
    handleStartListening();
  };

  // Ensure voices are loaded
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.speak(utterance);
    };
  } else {
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

}, [isListening]);

  const requestMediaPermissions = async () => {
    console.log("Attempting to request media permissions...");
    setMediaPermissions('pending');
    try {
      // Check SpeechRecognition support first
      if (!recognition) {
          throw new Error("Speech Recognition API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("getUserMedia successful, stream obtained:", stream);
      userStreamRef.current = stream;
      console.log("Permissions granted, setting state.");
      setMediaPermissions('granted');

      if (aiVideoRef.current) {
          aiVideoRef.current.src = '/ai_talking.mp4';
          aiVideoRef.current.load();
          aiVideoRef.current.pause();
      }
      // Speak the *first* question only after permissions are granted successfully
      if (questions.length > 0 && currentQuestionIndex === 0) {
        console.log("Speaking first question (after permissions granted)...");
        // Use a slight delay to ensure everything is ready
        setTimeout(() => speakText(questions[0].question), 500);
      } else {
        console.log("Permissions granted, but no questions ready or not on first question.");
      }
    } catch (err: any) {
      console.error("Error accessing media devices or speech API:", err.name, err.message, err);
      let description = "Camera/mic access required. Check browser/OS settings.";
       if (err.message.includes("Speech Recognition")) {
            description = "Speech Recognition API not supported or blocked. Please use a compatible browser (like Chrome, Edge, Safari).";
            setSpeechApiError("Speech Recognition unavailable.");
       } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            description = "Camera/Mic access denied. Please grant permission in browser settings and refresh.";
       } else if (err.name === 'NotFoundError') {
            description = "No camera/mic found. Please ensure they are connected and enabled.";
       }
      setMediaPermissions('denied');
      toast({
        title: `Permissions Error (${err.name || 'Error'})`,
        description: description,
        variant: "destructive",
      }); 
    }
  };

   useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      console.log('Speech recognition started.');
      setIsListening(true);
      setSpeechApiError(null); // Clear errors on successful start
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Update live transcript display
      setCurrentAnswer(finalTranscriptRef.current + interimTranscript);

      // Append finalized chunks to the ref
      if (finalChunk) {
          console.log("Final chunk received:", finalChunk);
          finalTranscriptRef.current += finalChunk + ' '; // Add space between chunks
          // Update the display to show the latest finalized version immediately
          setCurrentAnswer(finalTranscriptRef.current);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        let errorMsg = `Speech recognition error: ${event.error}.`;
        if (event.error === 'no-speech') {
            errorMsg = "No speech detected. Please try speaking clearly.";
        } else if (event.error === 'audio-capture') {
            errorMsg = "Microphone error. Please check your microphone.";
        } else if (event.error === 'not-allowed') {
            errorMsg = "Mic access denied. Please allow in browser settings.";
             setMediaPermissions('denied'); // Update permission state
        } else if (event.error === 'network') {
            errorMsg = "Network error during speech recognition.";
        }
        toast({ title: "Speech Error", description: errorMsg, variant: "destructive" });
        setSpeechApiError(errorMsg);
        setIsListening(false); // Stop listening state on error
        // Don't automatically stop the whole process, user might retry
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      // This is called when stop() is called, or on errors, or sometimes on silence.
      // Only set listening to false, processing is triggered by button click.
      setIsListening(false);
    };

    // Cleanup function for the effect
    return () => {
        if (recognition) {
            console.log("Removing speech recognition event listeners.");
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            // Ensure recognition is stopped if it was listening
            if (isListening) {
                 recognition.stop();
            }
        }
    };
  }, [isListening]); // Rerun setup if isListening changes (though unlikely needed)

  // --- Start Listening ---
  const handleStartListening = useCallback(() => {
    if (!recognition || isListening || isProcessingAnswer || aiSpeaking || mediaPermissions !== 'granted') {
      console.log(`Start listening prevented: recognition=${!!recognition}, isListening=${isListening}, isProcessingAnswer=${isProcessingAnswer}, aiSpeaking=${aiSpeaking}, permissions=${mediaPermissions}`);
      return;
    }
    console.log("Attempting to start listening...");
    // Clear previous answer data for the new recording
    setCurrentAnswer('');
    finalTranscriptRef.current = '';
    setSpeechApiError(null); // Clear previous errors
    try {
      recognition.start();
      // State update (isListening = true) will happen in recognition.onstart
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
      setSpeechApiError("Could not start microphone listening.");
      toast({ title: "Recording Error", description: "Could not start microphone listening.", variant: "destructive" });
    }
  }, [isListening, isProcessingAnswer, aiSpeaking, mediaPermissions]); // Dependencies

  // --- Stop Listening and Process Answer ---
  const handleStopListeningAndProcess = useCallback(async () => {
    console.log(`handleStopListeningAndProcess: Start. isListening=${isListening}, isProcessingAnswer=${isProcessingAnswer}`);
    if (!isListening || isProcessingAnswer) {
      console.log("handleStopListeningAndProcess aborted: Not listening or already processing.");
      // If not listening but an error occurred, maybe allow processing what was captured? No, requires explicit listening state.
      return;
    }
    console.log("handleStopListeningAndProcess: Setting isProcessingAnswer=true, stopping recognition...");
    setIsProcessingAnswer(true); // Lock processing FIRST
    setIsListening(false); // Update listening state (though recognition.onend might also do this)
    setAiSpeaking(false); // Ensure AI video is paused (should already be)
    setLoading(true); // Use general loading state during processing

    // Stop the actual recognition process
    if (recognition) {
        recognition.stop();
    }

    // Give a very brief moment for any final results to potentially process via onresult triggered by stop()
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalAnswer = finalTranscriptRef.current.trim();
    console.log("Final transcript captured for processing:", finalAnswer);

    // Update the display one last time with the final version
    setCurrentAnswer(finalAnswer);

    if (!finalAnswer) {
        console.warn("No final transcript captured.");
        toast({ title: "No Answer Detected", description: "It seems no answer was recorded.", variant: "warning" });
        // Allow user to potentially retry the same question?
        // For now, just move on or finish. Let's proceed as if an empty answer was given.
        // Consider adding a retry mechanism later if needed.
    }

    // Call the processing function with the final transcript
    processAnswer(finalAnswer);

  }, [isListening, isProcessingAnswer, questions, currentQuestionIndex]); // Dependencies

  // --- Process Transcribed Answer ---
  const processAnswer = async (transcription: string) => {
    console.log("Processing answer:", transcription);
    // Lock should be set, ensure loading is on (set in handleStopListeningAndProcess)

    try {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) {
        console.error(`Invalid current question index: ${currentQuestionIndex}`);
        toast({ title: "Internal Error", description: "Could not find current question.", variant: "destructive" });
        setStep('feedback'); // Go to feedback even on error? Or stay? Let's go to feedback.
        setIsProcessingAnswer(false); setLoading(false); return;
      }

      console.log(`Evaluating answer for question: ${currentQuestion.question}`);
      // Use the actual AI service call
      const evaluation = await aiInterviewService.evaluateAnswer(currentQuestion.question, transcription);
      console.log("Evaluation received:", evaluation);

      const newFeedback: AIFeedback = {
        questionId: currentQuestion.id || `q-${currentQuestionIndex}`,
        question: currentQuestion.question,
        answer: transcription || "(No answer recorded)", // Handle empty transcription
        score: typeof evaluation.score === 'number' ? evaluation.score : 0,
        feedback: typeof evaluation.feedback === 'string' ? evaluation.feedback : "No feedback provided.",
      };
      setFeedback(prev => [...prev, newFeedback]);

      if (currentQuestionIndex < questions.length - 1) {
        console.log("Moving to next question.");
        // Release lock *before* changing index
        setIsProcessingAnswer(false);
        setLoading(false);
        finalTranscriptRef.current = ''; // Clear transcript ref for next question
        setCurrentAnswer(''); // Clear display
        setCurrentQuestionIndex(prev => prev + 1); // Triggers useEffect to speak next question
      } else {
        console.log("Interview finished, moving to feedback step.");
        // Release lock before setting step
        setIsProcessingAnswer(false);
        setLoading(false);
        setStep('feedback'); // Cleanup is handled by the useEffect watching 'step'
        toast({
          title: "Interview Complete",
          description: "Your AI interview has been completed. Check your feedback.",
        });
      }
    } catch (error) {
      console.error('Error processing/evaluating answer:', error);
      toast({
        title: "Evaluation Error",
        description: "Failed to evaluate your answer. Please check the console.",
        variant: "destructive",
      });
      // Decide how to handle evaluation errors. Retry? Skip? For now, stop processing and let user see error.
      setIsProcessingAnswer(false); // Release lock on error
      setLoading(false);
      // Maybe don't automatically move to next question on error? Stay on current?
      // Let's keep the current index for now, user might need to restart.
    }
  };


  // --- Resume Upload and Processing ---
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log(`Resume file selected: ${file.name}, type: ${file.type}`);
    setResume(file);
    setLoading(true);
    try {
      let textToProcess = '';
      // Basic text extraction (consider a more robust library for PDF/DOCX in production)
      if (file.type === 'text/plain') {
        textToProcess = await readFileAsText(file);
      } else if (file.type === 'application/pdf' || file.type.includes('document')) {
         console.warn(`File type ${file.type} requires server-side or library parsing. Using fallback text.`);
         // In a real app, you'd upload the file and parse it server-side or use a client-side library.
         const filename = file.name.replace(/\.[^/.]+$/, "");
         textToProcess = `Resume: ${filename}\nSkills: Adaptable, Quick Learner\nExperience: Relevant experience mentioned in the resume.`;
         toast({ title: "Note", description: "Resume content parsing is simplified for this demo.", variant: "default" });
      } else {
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      setResumeText(textToProcess);
      await processResume(textToProcess);
    } catch (error: any) {
      console.error('Error handling resume upload:', error);
      toast({
        title: "Resume Error",
        description: `Failed to process resume: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      setResume(null);
      setResumeText('');
    } finally {
      setLoading(false);
    }
  };

  const processResume = async (text: string) => {
    if (!text) {
        toast({ title: "Resume Error", description: "Could not extract text from resume.", variant: "destructive" });
        setLoading(false);
        return;
    }
    console.log("Processing resume text to generate questions...");
    setLoading(true);
    try {
      // Limit to 5 questions as requested
      const generatedQuestionsResult = await aiInterviewService.generateQuestionsFromResume(text, 5); // Assuming service accepts limit
      console.log("Questions received from service:", generatedQuestionsResult);

      // Validate structure
      const validQuestions = Array.isArray(generatedQuestionsResult)
        ? generatedQuestionsResult.filter(q => (typeof q === 'string' && q.trim() !== '') || (typeof q === 'object' && q !== null && typeof q.question === 'string' && q.question.trim() !== ''))
        : [];

      // Ensure we don't exceed 5, even if the service returns more
      const limitedQuestions = validQuestions.slice(0, 5);

      if (limitedQuestions.length > 0) {
        const formattedQuestions: InterviewQuestion[] = limitedQuestions.map((q, index) => {
          if (typeof q === 'string') {
            return { id: `gen-q-${index}-${Date.now()}`, question: q };
          }
          return { id: q.id || `gen-q-${index}-${Date.now()}`, question: q.question };
        });

        console.log("Formatted questions (max 5):", formattedQuestions);
        setQuestions(formattedQuestions);
        setStep('questions'); // Move to questions step triggers permission request via useEffect
         // Reset index for the new set of questions
        setCurrentQuestionIndex(0);
        setFeedback([]); // Clear previous feedback
        setCurrentAnswer(''); // Clear any lingering answer display
        finalTranscriptRef.current = ''; // Clear final transcript ref

        toast({
          title: "Interview Ready",
          description: `${formattedQuestions.length} questions generated.`,
        });
      } else {
        console.error("No valid questions generated from resume or service returned invalid format.");
        throw new Error("Failed to generate valid interview questions from the resume.");
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Question Generation Error",
        description: "Could not generate questions. Please check the resume content or try again.",
        variant: "destructive",
      });
      setStep('upload'); // Stay on upload step on error
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // --- Calculate Score ---
  const calculateOverallScore = (): number => {
    if (feedback.length === 0) return 0;
    const total = feedback.reduce((sum, item) => sum + (item?.score || 0), 0);
    // Round to one decimal place
    return Math.round((total / feedback.length) * 10) / 10;
  };

  // --- Reset Interview ---
  const resetInterview = () => {
     console.log("Resetting interview state...");
     setStep('upload');
     setResume(null);
     setResumeText('');
     setQuestions([]);
     setCurrentQuestionIndex(0);
     setFeedback([]);
     setCurrentAnswer('');
     finalTranscriptRef.current = '';
     setMediaPermissions('idle');
     setIsProcessingAnswer(false);
     setLoading(false);
     setAiSpeaking(false);
     setIsListening(false); // Ensure listening is reset
     setSpeechApiError(null);
 
     if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
        userStreamRef.current = null;
     }
     if (userVideoRef.current) userVideoRef.current.srcObject = null;
     if (aiVideoRef.current) aiVideoRef.current.pause();
     if (recognition && isListening) recognition.stop(); 
     if ('speechSynthesis' in window && window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  }

  // --- Render Logic ---
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* --- Upload Step --- */}
      {step === 'upload' && (
        <div className="space-y-4 max-w-lg mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-6">AI Instant Interview</h2>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <Upload className="w-12 h-12 mb-4 text-gray-400" />
            <div className="flex flex-col items-center w-full">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt" // Keep accepted types, handle parsing limitations
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
                disabled={loading}
              />
              <Button
                onClick={() => document.getElementById('resume-upload')?.click()}
                disabled={loading}
                className="mb-2"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "Upload Resume to Start"
                )}
              </Button>
              {resume && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  Selected: {resume.name}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 text-center">
                Upload your resume (.txt, .pdf, .doc, .docx). 5 questions will be generated based on its content.
              </p>
              {!recognition && (
                 <p className="mt-4 text-sm text-destructive text-center font-medium">
                    <AlertTriangle className="inline-block w-4 h-4 mr-1" /> Speech Recognition not supported by your browser. Please use Chrome, Edge, or Safari.
                 </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Interview Step --- */}
      {step === 'questions' && mediaPermissions === 'granted' && questions.length > 0 && (
        // Key forces remount if questions change fundamentally (e.g., new interview)
        <div key={`interview-${questions[0]?.id}`} className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-150px)]">
          {/* Video Panels */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 min-h-[200px] md:min-h-[300px]">
            {/* AI Video Panel */}

            
            <div className="bg-gray-900 rounded-lg overflow-hidden relative shadow-lg">
              <video
                ref={aiVideoRef}
                src="/ai_talking.mp4"
                className="w-full h-full object-cover"
                loop // Loop the talking animation
                muted // AI audio comes from TTS, not video
                playsInline
                onError={(e) => {
                  console.error('AI Video failed to load:', e);
                  // Optionally display a fallback UI
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                AI Interviewer {aiSpeaking && "(Speaking...)"}
              </div>
            </div>
            {/* User Video Panel */}
            <div className="bg-gray-200 rounded-lg overflow-hidden relative shadow-lg">
              <video
                ref={userVideoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                autoPlay
                muted
                playsInline
                onError={(e) => {
                  console.error('User Video failed to load:', e);
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                Your Video
              </div>
            </div>
          </div>

          {/* Question and Controls */}
          <div className="p-4 border rounded-lg bg-white shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold">
                Question {currentQuestionIndex + 1} / {questions.length}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTranscription(prev => !prev)} title={showTranscription ? "Hide Transcription" : "Show Transcription"}>
                  {showTranscription ? "Hide" : "Show"} Text
                </Button>
                <Button variant="ghost" size="icon" onClick={() => speakText(questions[currentQuestionIndex]?.question)} title="Repeat question" disabled={aiSpeaking || isListening || isProcessingAnswer}>
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <p className="text-gray-800 text-lg min-h-[3em] font-medium py-2">
              {questions[currentQuestionIndex]?.question}
            </p>

             {/* Transcription Display */}
             {showTranscription && ( // Always render container, show content conditionally
                 <div className="p-3 bg-gray-100 rounded-lg text-sm border min-h-[76px] max-h-24 overflow-y-auto">
                     <p className="font-medium text-gray-600 mb-1">
                        {isListening ? "Listening..." : (currentAnswer ? "Your transcribed answer:" : "Your answer will appear here...")}
                    </p>
                    {currentAnswer && <p className="text-gray-800">{currentAnswer}</p>}
                 </div>
             )}
             {/* Add placeholder if transcription hidden to maintain layout */}
             {!showTranscription && <div className="min-h-[76px]"></div>}

            {/* Speech API Error Display */}
            {speechApiError && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded-md text-xs text-center">
                     <AlertTriangle className="inline-block w-4 h-4 mr-1" /> {speechApiError}
                </div>
            )}

            {/* Button Area */}
            <div className="flex justify-center items-center space-x-4 pt-2">
              {/* Status Indicator */}
              <div className={`flex items-center justify-center text-sm font-medium w-40 h-10 border rounded-md px-2 text-center ${
                  isProcessingAnswer || loading ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  isListening ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' :
                  aiSpeaking ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  'bg-gray-100 text-gray-700 border-gray-300'
              }`}>
                {isProcessingAnswer || loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : isListening ? (
                  <><Mic className="mr-2 h-5 w-5" /> Listening...</>
                ) : aiSpeaking ? (
                  "AI Speaking..."
                ) : (
                  // Check if ready to start listening vs already processed
                  finalTranscriptRef.current ? "Answer Recorded" : "Ready to Record"
                )}
              </div>

              {/* Record/Stop Button */}
              <Button
                onClick={isListening ? handleStopListeningAndProcess : handleStartListening}
                className="w-48" // Wider button
                // Disable if: processing, AI speaking, permissions not granted, or if speech API error occurred (unless it was 'no-speech')
                disabled={isProcessingAnswer || aiSpeaking || mediaPermissions !== 'granted' || (speechApiError && speechApiError !== "No speech detected. Please try speaking clearly.")}
                variant={isListening ? "destructive" : "default"} // Red when listening/stoppable
              >
                {isListening ? (
                   <> <StopCircle className="mr-2 h-5 w-5" /> Stop & Process Answer </>
                ) : (
                   <> <Mic className="mr-2 h-5 w-5" /> Start Recording Answer </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Permission States --- */}
      {step === 'questions' && mediaPermissions === 'pending' && (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-600 font-medium">Requesting camera and microphone access...</p>
          <p className="text-sm text-gray-500 mt-1">Please allow access in the browser prompt.</p>
        </div>
      )}
      {step === 'questions' && mediaPermissions === 'denied' && (
        <div className="flex flex-col items-center justify-center p-6 border border-destructive rounded-lg bg-destructive/10 text-center max-w-md mx-auto">
          <Video className="h-8 w-8 text-destructive mb-4" />
          <p className="text-destructive font-semibold mb-2">Permissions Required</p>
          <p className="text-sm text-destructive/90 mb-4">
            {speechApiError ? speechApiError : "Camera and microphone access are required for the interview."} Please grant permissions in your browser/OS settings and refresh, or go back.
          </p>
          <div className="flex gap-4">
             <Button onClick={requestMediaPermissions} variant="secondary" disabled={mediaPermissions === 'pending'}>Retry Permissions</Button>
             <Button onClick={resetInterview} variant="outline">Go Back to Upload</Button>
          </div>
        </div>
      )}

       {step === 'feedback' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-6">Interview Feedback</h2>
          {feedback.length > 0 ? (
            <>
              <div className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold">Overall Performance</h3>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl">{calculateOverallScore()}/5</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon
                        key={star}
                        className={`h-6 w-6 ${
                          star <= calculateOverallScore() ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {feedback.map((item, index) => {
                if (!item) {
                  console.warn(`Feedback item at index ${index} is null/undefined.`);
                  return null;
                }
                return (
                  <Card key={item.questionId || index} className="mb-4 overflow-hidden">
                    <CardHeader className="bg-gray-50 p-4 border-b">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-md font-semibold">Question {index + 1}</CardTitle>
                        <div className="flex items-center">
                           <span className="text-sm font-bold mr-1">{item?.score ?? 0}/5</span>
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon key={star} className={`h-4 w-4 ${ star <= (item?.score || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300' }`} />
                            ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <p className="font-medium text-gray-800">{item?.question || "Question not available"}</p>
                      <div className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-md border max-h-40 overflow-y-auto">
                        <p className="font-semibold text-gray-500 mb-1">Your Answer:</p>
                        <p className="whitespace-pre-wrap">{item?.answer || "(No answer recorded)"}</p>
                      </div>
                      <div className="mt-3 p-3 border rounded-md bg-blue-50 border-blue-200">
                        <p className="font-semibold text-blue-800 mb-1">Feedback:</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{item?.feedback || "Feedback not available"}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <p className="text-center text-gray-500">No feedback available yet.</p>
          )}
          <div className="flex justify-center pt-4">
            {/* Use the reset function */}
            <Button size="lg" onClick={resetInterview}>
              Start New Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInstantInterview;
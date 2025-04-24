import AIInstantInterview from "@/components/MockInterviews/AIInstantInterview";



export default function AIInstantInterviewPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">AI Instant Interview</h1>
      <p className="text-gray-600 mb-8">
        Upload your resume and get immediate interview practice with our AI interviewer.
        Receive instant feedback on your responses and improve your interview skills.
      </p>
      <AIInstantInterview />
    </div>
  );
}
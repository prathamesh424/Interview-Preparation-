![github-submission-banner](https://github.com/user-attachments/assets/a1493b84-e4e2-456e-a791-ce35ee2bcf2f)

 # 🚀 IntelliPrep

 > AI-Powered Prep for Interview Success.

 ---

 ## 📌 Problem Statement

 **[PS 8: Reimagine Peer-to-Peer Learning & Mentorship]**
 
 ---

 ## 🎯 Objective

 Our project, IntelliPrep, solves the critical problem of unstructured, inefficient, and often isolating technical interview preparation. It serves aspiring developers, engineers, and tech professionals aiming to land their dream jobs.

 We provide a real-world simulated environment and intelligent guidance to make interview preparation effective, realistic, and accessible. Users gain confidence by practicing challenging questions, collaborating with peers or experienced interviewers in a live coding environment, and receiving actionable feedback, including personalized insights from AI-driven mock interviews. This eliminates the guesswork and anxiety often associated with traditional preparation methods.

 ---

 ## 🧠 Team & Approach

 ### Team Name:
 `[Crypto Whales]`

 ### Your Approach:
 Our approach was to build a comprehensive, all-in-one platform that integrates the essential components of effective interview preparation. We chose this problem because we experienced firsthand the challenges of preparing using scattered resources and the difficulty of finding realistic practice opportunities.

 Key challenges we addressed included:
 - **Real-time Synchronization:** Ensuring seamless live collaborative coding and video/chat across multiple users using WebRTC and potentially Supabase Realtime.
 - **AI Integration:** Effectively querying and integrating AI models (via GraphQL) for generating relevant content and providing meaningful feedback, especially under the low-latency requirements of a conversational AI interviewer.
 - **Speech Recognition Accuracy:** Implementing reliable speech recognition for the AI interviewer that works well with technical language and provides a smooth user experience.

 Breakthroughs included leveraging specialized libraries for collaborative editing and developing a robust signaling strategy for WebRTC to handle diverse network environments. We also focused on structuring AI prompts and responses to maximize the relevance and helpfulness of study plans, questions, and feedback.

 ---

 ## 🛠️ Tech Stack

 ### Core Technologies Used:
 - Frontend: React, TypeScript
 - Backend: Node.js (for specific logic/APIs not handled by Supabase, or Supabase Edge Functions), TypeScript
 - Database: Supabase
 - APIs: GraphQL (for AI interaction), Supabase (REST & Realtime)
 - Hosting: [Specify your hosting provider - e.g., Vercel, Netlify, AWS, etc.]

 ### Sponsor Technologies Used (if any):
 - ✅ **Groq:** We used Groq for powering the AI inference for features like AI-assisted study plan generation, generating interview questions, and most critically, for the AI-powered mock interviewer. Groq's low-latency LPU was essential for providing fast, natural, and responsive interactions during the AI interview experience.
 - [ ] **Monad:** _Your blockchain implementation_
 - [ ] **Fluvio:** _Real-time data handling_
 - [ ] **Base:** _AgentKit / OnchainKit / Smart Wallet usage_
 - [ ] **Screenpipe:** _Screen-based analytics or workflows_
 - [ ] **Stellar:** _Payments, identity, or token usage_
 *(Mark with ✅ if completed)*
 ---

 ## ✨ Key Features

 Highlight the most important features of your project:

 - ✅ **AI-Assisted Study Plans:** Generate personalized study roadmaps based on topics and goals.
 - ✅ **Topic-Specific Interview Questions:** Access or generate relevant interview questions based on chosen technical areas.
 - ✅ **Collaborative Mock Interviews:** Schedule and conduct live practice interviews with peers or interviewers, featuring integrated video calls, chat, and a real-time collaborative code editor.
 - ✅ **AI Mock Interviewer:** Practice anytime with an AI that uses speech recognition, can tailor questions based on your resume, and provides instant feedback.
 - ✅ **Custom Content:** Ability for users to add their own questions and study plan items.
 - ✅ **Performance Feedback:** Receive structured feedback after both collaborative and AI-driven interviews.


 ---

 ## 📽️ Demo & Deliverables

 - **Demo Video Link:** [https://youtu.be/-TjQGPMVqac]
 
 ---

 ## ✅ Tasks & Bonus Checklist

 - ✅ **All members of the team completed the mandatory task - Followed at least 2 of our social channels and filled the form** (Details in Participant Manual)
 - ✅ **All members of the team completed Bonus Task 1 - Sharing of Badges and filled the form (2 points)** (Details in Participant Manual)
 - ✅ **All members of the team completed Bonus Task 2 - Signing up for Sprint.dev and filled the form (3 points)** (Details in Participant Manual)


 ---

 ## 🧪 How to Run the Project

 ### Requirements:
 - Node.js (>= [13])
 - npm or yarn package manager
 - Supabase project set up and configured (`.env` file)
 - API Keys for AI integration (Groq, potentially others) configured (`.env` file)
 - [List any other specific dependencies or services needed]

 ### Local Setup:
 ```bash
 # Clone the repo
 git clone [https://github.com/your-team/IntelliPrep.git](https://github.com/your-team/IntelliPrep.git)  

 # Install dependencies
 cd IntelliPrep
 npm install # or yarn install

 # Set up environment variables
 # Create a .env.local file in the root directory based on a provided .env.example (if you have one)
 # or add your Supabase and AI API keys directly.
 # Example .env.local content:
 # NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
 # NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
 # GROQ_API_KEY=YOUR_GROQ_API_KEY
 # [Any other necessary keys]


 # Start development server
 npm run dev # or yarn dev

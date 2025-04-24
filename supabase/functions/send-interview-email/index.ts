// Follow this setup guide to integrate the Deno runtime:
// https://docs.supabase.com/guides/functions/runtimes/deno

// This Supabase Edge Function sends an email invitation for mock interviews
// Uses Resend (https://resend.com) for email delivery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define CORS headers globally
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'interviews@interviewace.app'

interface InterviewDetails {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  interviewerName?: string
}

interface EmailRequestBody {
  to: string
  subject: string
  interviewDetails: InterviewDetails
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Resend API Key inside the try block
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') 
    if (!RESEND_API_KEY) {
      // Throw error immediately if key is missing
      throw new Error('Missing RESEND_API_KEY environment variable') 
async function sendEmail(to: string, subject: string, interviewDetails: InterviewDetails) {
  if (!RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Mock Interview Invitation</h1>
          <p>You have been invited to a mock interview!</p>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">${interviewDetails.title}</h2>
            ${interviewDetails.description ? `<p>${interviewDetails.description}</p>` : ''}
            
            <div style="margin-top: 16px;">
              <p><strong>Date:</strong> ${new Date(interviewDetails.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${interviewDetails.startTime} - ${interviewDetails.endTime}</p>
              ${interviewDetails.interviewerName ? 
                `<p><strong>Interviewer:</strong> ${interviewDetails.interviewerName}</p>` : ''}
            </div>
          </div>
          
          <p>Please <a href="https://interviewace.app/login" style="color: #4f46e5; text-decoration: none;">login to your account</a> to view the details and join the interview.</p>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
            This is an automated message from InterviewAce. Please do not reply to this email.
          </p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  return data
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Get request body
    const body: EmailRequestBody = await req.json()
    const { to, subject, interviewDetails } = body

    // Validate required fields
    if (!to || !subject || !interviewDetails) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, or interviewDetails' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // --- Email Sending Logic (Moved from sendEmail function) ---
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Mock Interview Invitation</h1>
        <p>You have been invited to a mock interview!</p>
        
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${interviewDetails.title}</h2>
          ${interviewDetails.description ? `<p>${interviewDetails.description}</p>` : ''}
          
          <div style="margin-top: 16px;">
            <p><strong>Date:</strong> ${new Date(interviewDetails.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${interviewDetails.startTime} - ${interviewDetails.endTime}</p>
            ${interviewDetails.interviewerName ? 
              `<p><strong>Interviewer:</strong> ${interviewDetails.interviewerName}</p>` : ''}
          </div>
        </div>
        
        <p>Please <a href="https://interviewace.app/login" style="color: #4f46e5; text-decoration: none;">login to your account</a> to view the details and join the interview.</p>
        
        <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
          This is an automated message from InterviewAce. Please do not reply to this email.
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`, // Use the fetched API key
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html: emailHtml,
      }),
    })

    const responseData = await res.json()

    if (!res.ok) {
      // Throw an error if Resend API returned an error
      throw new Error(`Resend API Error: ${res.status} ${res.statusText} - ${JSON.stringify(responseData)}`)
    }
    // --- End Email Sending Logic ---

    // Return success response from Resend
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, // Or use res.status if appropriate
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    // Log the detailed error
    console.error('Error in send-interview-email function:', error) 
    
    // Return a generic 500 error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        // Optionally include specific error message in development, but be cautious in production
        // message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 

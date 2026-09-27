import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    const isJobSearch = /(job|career|hiring|role|developer|engineer|manager|remote|salary)/i.test(lastMessage);
    
    let context = "";
    
    // RAG: Fetch relevant data from Supabase if it looks like a job or company search
    if (isJobSearch) {
      const supabase = await createSupabaseServerClient();
      
      // Improved keyword extraction (filter out common filler words)
      const stopWords = new Set(["suggest", "find", "show", "give", "me", "some", "any", "the", "in", "at", "for", "with", "job", "jobs", "role", "roles", "career"]);
      const searchTerms = lastMessage
        .replace(/[^\w\s.#+]/g, " ") // keep letters, numbers, dot (for .net), sharp (for c#), plus (for c++)
        .split(/\s+/)
        .filter((w: string) => w.length > 1 && !stopWords.has(w.toLowerCase()))
        .slice(0, 4);
      
      let query = supabase
        .from("company_jobs")
        .select("title, department, location_name, workplace_type, apply_url, listing_id")
        .eq("is_active", true);

      if (searchTerms.length > 0) {
        // For each term, it must appear in EITHER the title OR the location
        // Calling .or() multiple times creates an AND between them!
        searchTerms.forEach((term: string) => {
          query = query.or(`title.ilike.%${term}%,location_name.ilike.%${term}%`);
        });
      }
      
      const { data: jobs } = await query.limit(30);
        
      if (jobs && jobs.length > 0) {
        // Fetch company names for these jobs
        const listingIds = [...new Set(jobs.map(j => j.listing_id))];
        const { data: companies } = await supabase
          .from("listings")
          .select("id, title, website, city")
          .in("id", listingIds);
          
        const companyMap = new Map(companies?.map(c => [c.id, c]) || []);
        
        context = "Here are some relevant live jobs currently active in our database:\n";
        jobs.forEach(job => {
          const comp = companyMap.get(job.listing_id);
          context += `- **${job.title}** at **${comp?.title || "Unknown"}** (${job.location_name} - ${job.workplace_type}). Apply here: ${job.apply_url}\n`;
        });
      } else {
        context = "I couldn't find specific jobs matching those exact keywords in the database right now, but I can provide general career advice or you can try broader terms (like 'React', 'Python', or 'San Francisco').";
      }
    }

    const systemPrompt = `You are LocaToGo Copilot, an expert AI career assistant. 
Your goal is to help users find tech companies and job openings.
Be extremely concise, helpful, and format your responses using Markdown.
Always use bullet points and bold text for emphasis.
If you provide links, use Markdown format like [Apply Here](url).
If context is provided below about jobs, use ONLY that context to recommend actual live jobs.

CONTEXT:
${context}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    
    // Format messages for Gemini API and filter out the initial static greeting 
    // to prevent two consecutive "model" roles which crashes the Gemini API.
    const formattedMessages = messages
      .slice(0, -1)
      .filter((msg: any) => msg.id !== "0")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am LocaToGo Copilot." }] },
        ...formattedMessages
      ]
    });

    const result = await chat.sendMessageStream(lastMessage);

    // We stream the response manually using a TransformStream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}

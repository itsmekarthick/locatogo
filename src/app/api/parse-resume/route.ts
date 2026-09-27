import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const location = formData.get("location") as string | null;

    if (!file || !location) {
      return NextResponse.json({ error: "Resume file and location are required." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported at this time." }, { status: 400 });
    }

    // 1. Upload the resume to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume to secure storage." }, { status: 500 });
    }

    // 2. Parse the PDF text
    let parsedText = "";
    try {
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(fileBuffer);
      parsedText = pdfData.text;
    } catch (e) {
      console.error("PDF Parsing error:", e);
      return NextResponse.json({ error: "Could not read the text inside this PDF. Please ensure it is not a scanned image." }, { status: 400 });
    }

    if (parsedText.length < 50) {
      return NextResponse.json({ error: "The uploaded PDF appears to be empty or unreadable." }, { status: 400 });
    }

    // 3. Extract skills using Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `
      You are an expert technical recruiter and resume parser.
      Read the following resume text and extract the top 10 to 15 most prominent technical skills, tools, and programming languages.
      Only return a raw JSON array of strings. Do not use markdown blocks, do not include explanation text. Just the JSON array.
      Example: ["React", "TypeScript", "Node.js", "Python", "AWS"]

      Resume Text:
      ${parsedText.substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let skills: string[] = [];
    try {
      // Clean up potential markdown formatting from Gemini
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      skills = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini output as JSON:", responseText);
      // Fallback: split by comma if it failed to return valid JSON array
      skills = responseText.replace(/[\[\]"]/g, "").split(",").map(s => s.trim()).filter(s => s.length > 0);
    }

    // Ensure we only have up to 15 skills to avoid huge payloads
    skills = skills.slice(0, 15);

    const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(filePath);

    // 4. Update the user_profiles table
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        email: user.email,
        preferred_location: location,
        resume_url: publicUrlData.publicUrl || filePath,
        skills: skills,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return NextResponse.json({ error: "Failed to save profile data." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skills,
      location,
      message: "Resume parsed successfully!"
    });

  } catch (error: any) {
    console.error("Resume Parse Route Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}

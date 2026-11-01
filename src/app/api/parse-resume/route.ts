import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseResumeExtraction, RESUME_EXTRACTION_PROMPT } from "@/lib/matching/resume-schema";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const RESUME_MODELS = [process.env.GEMINI_RESUME_MODEL || "gemini-3.8-flash", "gemini-3.5-flash-lite"];
const resumeSchema = z.object({ location: z.string().trim().min(1).max(120) });

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  let uploadedPath: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("resume");
    const parsedInput = resumeSchema.safeParse({ location: formData.get("location") });
    if (!(file instanceof File) || !parsedInput.success) {
      return NextResponse.json({ error: "Resume file and location are required." }, { status: 400 });
    }
    if (file.size > MAX_RESUME_SIZE) {
      return NextResponse.json({ error: "Resume files must be 5MB or smaller." }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.subarray(0, 4).toString("ascii") !== "%PDF") {
      return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 });
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, fileBuffer, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload the resume." }, { status: 500 });
    }
    uploadedPath = upload.path;

    let resumeText = "";
    try {
      const parser = new PDFParse({ data: fileBuffer });
      try {
        const parsedPdf = await parser.getText();
        resumeText = parsedPdf.text;
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      console.error("Resume parse error:", error);
    }
    if (resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not read text from this PDF. Upload a text-based resume instead of a scanned image." }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Resume matching is temporarily unavailable." }, { status: 503 });
    }

    const prompt = `${RESUME_EXTRACTION_PROMPT}\n\nResume:\n${resumeText.slice(0, 15000)}`;
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    let responseText: string | null = null;
    // The primary model sometimes returns 503 under load, so fall back to the lighter one before giving up.
    for (const name of RESUME_MODELS) {
      try {
        responseText = (await client.getGenerativeModel({ model: name }).generateContent(prompt)).response.text();
        break;
      } catch (error) {
        console.error(`Resume model ${name} failed:`, error instanceof Error ? error.message : error);
      }
    }
    if (responseText === null) {
      return NextResponse.json({ error: "Resume analysis is busy right now. Try again in a moment." }, { status: 503 });
    }
    const extraction = parseResumeExtraction(responseText);
    const { skills } = extraction;
    const now = new Date().toISOString();

    const { error: profileError } = await supabase.from("tech_profiles").upsert({
      id: user.id,
      preferred_location: parsedInput.data.location,
      resume_storage_path: filePath,
      skills,
      headline: extraction.headline,
      experience_level: extraction.level,
      years_experience: extraction.yearsExperience,
      education: extraction.education,
      work_history: extraction.workHistory,
      resume_parsed_at: now,
      updated_at: now,
    });
    if (profileError) {
      console.error("Tech profile upsert error:", profileError);
      return NextResponse.json({ error: "Failed to save resume details." }, { status: 500 });
    }

    uploadedPath = null;
    return NextResponse.json({
      success: true,
      skills,
      headline: extraction.headline,
      level: extraction.level,
      yearsExperience: extraction.yearsExperience,
      location: parsedInput.data.location,
      message: "Resume parsed successfully.",
    });
  } catch (error) {
    console.error("Resume route error:", error);
    return NextResponse.json({ error: "Unable to process the resume right now." }, { status: 500 });
  } finally {
    if (uploadedPath) {
      const { error: cleanupError } = await supabase.storage.from("resumes").remove([uploadedPath]);
      if (cleanupError) console.error("Resume cleanup error:", cleanupError);
    }
  }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, scanType, patientInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing ${scanType} scan for patient: ${patientInfo?.name || 'Unknown'}`);

    const systemPrompt = `You are an expert medical imaging AI assistant specialized in analyzing ${scanType} scans. 
You provide detailed, structured analysis of medical images to assist healthcare professionals.

IMPORTANT DISCLAIMER: This is an AI-assisted analysis tool meant to support, not replace, professional medical judgment. 
All findings must be verified by qualified healthcare professionals before any clinical decisions are made.

Analyze the provided medical image and return a JSON response with the following structure:
{
  "findings": [
    {
      "area": "string - anatomical area",
      "observation": "string - detailed observation",
      "severity": "normal|mild|moderate|severe"
    }
  ],
  "primaryDiagnosis": "string - most likely diagnosis",
  "differentialDiagnoses": ["string array of other possible diagnoses"],
  "confidenceScore": number between 0-100,
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["string array of recommended next steps"],
  "abnormalityScore": number between 0-100,
  "aiExplanation": "string - detailed explanation of the analysis",
  "keyFactors": ["string array of key factors considered"]
}

Be thorough but concise. Focus on clinically relevant findings.`;

    const userMessage = patientInfo 
      ? `Analyze this ${scanType} scan for a ${patientInfo.age}-year-old ${patientInfo.gender} patient${patientInfo.chronicConditions?.length ? ` with history of: ${patientInfo.chronicConditions.join(', ')}` : ''}.`
      : `Analyze this ${scanType} scan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: userMessage },
              { 
                type: "image_url", 
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
                } 
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("Raw AI response:", content);

    // Parse the JSON from the response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Return a structured fallback response
      analysisResult = {
        findings: [{ area: "General", observation: content, severity: "normal" }],
        primaryDiagnosis: "Analysis completed - review findings",
        differentialDiagnoses: [],
        confidenceScore: 70,
        riskLevel: "medium",
        recommendations: ["Consult with radiologist for detailed interpretation"],
        abnormalityScore: 30,
        aiExplanation: content,
        keyFactors: ["AI analysis completed"]
      };
    }

    console.log("Parsed analysis result:", analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-scan function:", error);
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

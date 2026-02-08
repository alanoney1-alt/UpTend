import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds
});

export interface ReceiptValidationInput {
  receiptImageUrl: string;
  facilityName: string;
  facilityAddress?: string;
  claimedWeight: number;
  estimatedWeight: number;
  receiptDate: string;
  jobCompletedAt: string;
  serviceRequestId: string;
  haulerId: string;
}

export interface AIValidationResult {
  status: "passed" | "failed" | "needs_review";
  confidenceScore: number;
  notes: string;
  details: {
    receiptReadable: boolean;
    facilityMatches: boolean;
    weightValid: boolean;
    dateValid: boolean;
    isDuplicate: boolean;
    extractedData: {
      facilityName?: string;
      weight?: number;
      date?: string;
      receiptNumber?: string;
      totalCharge?: number;
    };
    issues: string[];
    recommendations: string[];
  };
}

export async function validateReceiptWithAI(
  input: ReceiptValidationInput
): Promise<AIValidationResult> {
  const prompt = `You are an expert receipt validator for a hauling/junk removal platform called UpTend.
  
Analyze this disposal receipt image and validate the following claims:

CLAIMED INFORMATION:
- Facility Name: ${input.facilityName}
- Facility Address: ${input.facilityAddress || "Not provided"}
- Weight on Receipt: ${input.claimedWeight} lbs
- Receipt Date: ${input.receiptDate}
- Job Completed: ${input.jobCompletedAt}
- Estimated Weight from Job: ${input.estimatedWeight} lbs (±20% tolerance allowed)

VALIDATION RULES:
1. Receipt must be readable and authentic-looking
2. Facility name on receipt should match or be similar to claimed facility
3. Weight must be within ±20% of estimated weight (${(input.estimatedWeight * 0.8).toFixed(0)} - ${(input.estimatedWeight * 1.2).toFixed(0)} lbs)
4. Receipt date must be within 48 hours of job completion
5. Check for signs of tampering or editing

Please analyze the image and provide:
1. Whether the receipt is readable
2. The facility name shown on receipt
3. The weight shown on receipt
4. The date shown on receipt  
5. Any receipt number visible
6. Any charges/fees shown
7. List any issues or concerns
8. Your recommendation (APPROVE, DENY, or NEEDS HUMAN REVIEW)

Respond in JSON format:
{
  "receiptReadable": true/false,
  "extractedFacilityName": "string or null",
  "extractedWeight": number or null,
  "extractedDate": "string or null",
  "extractedReceiptNumber": "string or null",
  "extractedTotalCharge": number or null,
  "facilityMatches": true/false,
  "weightWithinTolerance": true/false,
  "dateWithin48Hours": true/false,
  "signsOfTampering": true/false,
  "issues": ["list of issues found"],
  "recommendation": "APPROVE" | "DENY" | "NEEDS_REVIEW",
  "confidenceScore": 0-100,
  "summary": "Brief explanation of your assessment"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: input.receiptImageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const aiResponse = JSON.parse(content);

    const issues: string[] = aiResponse.issues || [];
    const recommendations: string[] = [];

    if (!aiResponse.receiptReadable) {
      issues.push("Receipt image is not clearly readable");
      recommendations.push("Request clearer image from Pro");
    }

    if (!aiResponse.facilityMatches) {
      issues.push("Facility name does not match claimed facility");
      recommendations.push("Verify facility with Pro");
    }

    if (!aiResponse.weightWithinTolerance) {
      const diff = aiResponse.extractedWeight 
        ? Math.abs((aiResponse.extractedWeight - input.estimatedWeight) / input.estimatedWeight * 100)
        : null;
      issues.push(`Weight variance exceeds 20% tolerance${diff ? ` (${diff.toFixed(1)}% difference)` : ""}`);
      recommendations.push("Review job details and confirm actual load size");
    }

    if (!aiResponse.dateWithin48Hours) {
      issues.push("Receipt date is outside the 48-hour submission window");
      recommendations.push("Confirm receipt date and job completion time");
    }

    if (aiResponse.signsOfTampering) {
      issues.push("Potential signs of tampering detected");
      recommendations.push("Request original receipt or alternative proof");
    }

    let status: "passed" | "failed" | "needs_review";
    if (aiResponse.recommendation === "APPROVE") {
      status = "passed";
    } else if (aiResponse.recommendation === "DENY") {
      status = "failed";
    } else {
      status = "needs_review";
    }

    const notes = `AI Assessment: ${aiResponse.summary}${issues.length > 0 ? ` Issues: ${issues.join("; ")}` : ""}`;

    return {
      status,
      confidenceScore: aiResponse.confidenceScore || 50,
      notes,
      details: {
        receiptReadable: aiResponse.receiptReadable,
        facilityMatches: aiResponse.facilityMatches,
        weightValid: aiResponse.weightWithinTolerance,
        dateValid: aiResponse.dateWithin48Hours,
        isDuplicate: false,
        extractedData: {
          facilityName: aiResponse.extractedFacilityName,
          weight: aiResponse.extractedWeight,
          date: aiResponse.extractedDate,
          receiptNumber: aiResponse.extractedReceiptNumber,
          totalCharge: aiResponse.extractedTotalCharge,
        },
        issues,
        recommendations,
      },
    };
  } catch (error) {
    console.error("AI validation error:", error);
    return {
      status: "needs_review",
      confidenceScore: 0,
      notes: "AI validation failed - manual review required",
      details: {
        receiptReadable: false,
        facilityMatches: false,
        weightValid: false,
        dateValid: false,
        isDuplicate: false,
        extractedData: {},
        issues: ["AI validation service error"],
        recommendations: ["Perform manual review of receipt"],
      },
    };
  }
}

export async function checkDuplicateReceipt(
  receiptNumber: string | undefined,
  facilityName: string,
  receiptDate: string,
  serviceRequestId: string,
  db: any
): Promise<{ isDuplicate: boolean; matchingClaimId?: string }> {
  if (!receiptNumber) {
    return { isDuplicate: false };
  }

  const existingClaims = await db
    .select()
    .from(db.rebateClaims)
    .where(
      db.and(
        db.eq(db.rebateClaims.receiptNumber, receiptNumber),
        db.ne(db.rebateClaims.serviceRequestId, serviceRequestId)
      )
    );

  if (existingClaims.length > 0) {
    return {
      isDuplicate: true,
      matchingClaimId: existingClaims[0].id,
    };
  }

  return { isDuplicate: false };
}

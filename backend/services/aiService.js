const extractJobRoleFromJd = (jdText) => {
    if (!jdText) return null;
    const lines = jdText.split('\n');
    for (let line of lines) {
      if (line.toLowerCase().includes('role:') || line.toLowerCase().includes('title:')) {
        return line.split(':')[1].trim();
      }
    }
    const firstLine = lines.find(l => l.trim().length > 0);
    if (firstLine && firstLine.length < 50) return firstLine.trim();
    return null;
  };
  
const extractSeniorityFromJd = (jdText) => {
    if (!jdText) return null;
    const text = jdText.toLowerCase();
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('manager')) return 'Senior-Level';
    if (text.includes('mid') || text.includes('intermediate') || text.includes('2+ years') || text.includes('3+ years')) return 'Mid-Level';
    if (text.includes('junior') || text.includes('entry') || text.includes('intern') || text.includes('fresh')) return 'Entry-Level';
    return null;
};

async function analyzeCvVsJd(cvText, jobDescription) {
    let predictedTitle = "Software Engineer";
    let predictedExperienceLevel = "Mid-Level";

    if (jobDescription && jobDescription.trim() !== '') {
        const hTitle = extractJobRoleFromJd(jobDescription);
        const hExp = extractSeniorityFromJd(jobDescription);
        if (hTitle) predictedTitle = hTitle;
        if (hExp) predictedExperienceLevel = hExp;
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
        throw new Error("XAI_API_KEY is not defined in environment variables");
    }

    const modelName = process.env.XAI_MODEL || 'grok-beta';
    
    const systemPrompt = `You are an expert recruiter and ATS (Applicant Tracking System) optimizer specializing in the field of "${predictedTitle}" (seniority level: "${predictedExperienceLevel}").
Analyze the candidate's Resume against the target Job Description to identify technical alignment, skill gaps, and ATS compliance issues.

Your response must be a JSON object matching this schema:
{
  "predictedTitle": "<string: the exact job title of the target Job Description>",
  "predictedExperienceLevel": "<string: the target seniority level>",
  "matchScore": <integer between 0 and 100 representing the fit percentage>,
  "matchedSkills": [<array of skills found in both the resume and the job description>],
  "missingSkills": [<array of skills required in the job description but missing from the resume>],
  "otherSkills": [<array of other skills found in the resume but not explicitly requested>],
  "suggestions": [
    {
      "id": 1,
      "text": "Skills Section: Append the missing skill...",
      "type": "warning",
      "actionTitle": "Add Missing Skills",
      "actionDetails": "Specific advice on where and how to integrate it in the CV",
      "keyword": "<lowercase single-word skill tag to match>"
    }
  ]
}
Return ONLY valid raw JSON. Do not include markdown formatting or extra text outside the JSON object.`;

    const userPrompt = `Candidate Resume Text:\n${cvText}\n\nTarget Job Description:\n${jobDescription}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`xAI Grok API HTTP error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Empty message content returned from Grok');
    }

    let parsedAnalysis;
    try {
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('\`\`\`')) {
            cleanedContent = cleanedContent.replace(/^\`\`\`(?:json)?/, '');
        }
        if (cleanedContent.endsWith('\`\`\`')) {
            cleanedContent = cleanedContent.replace(/\`\`\`$/, '');
        }
        parsedAnalysis = JSON.parse(cleanedContent.trim());
    } catch (parseError) {
        console.error("Grok JSON Parse error:", parseError, "Raw output:", content);
        throw new Error("Failed to parse ATS analysis response");
    }

    return parsedAnalysis;
}

module.exports = {
    analyzeCvVsJd,
    extractJobRoleFromJd,
    extractSeniorityFromJd
};

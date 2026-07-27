const bcrypt = require('bcryptjs');
const { execFile, execFileSync } = require('child_process');
const path = require('path');
const User = require('../models/userModel');
const History = require('../models/historyModel');
const Cv = require('../models/cvModel');
const parserService = require('../services/parserService');
const generatorService = require('../services/generatorService');
const pdfGeneratorService = require('../services/pdfGeneratorService');
const { validateSignup, validateLogin } = require('../utils/validation');

/**
 * Cross-platform Python interpreter resolver.
 * Windows commonly only has 'py' (the launcher), while Linux/macOS have
 * 'python3' (and sometimes 'python'). We detect the right one once and cache it.
 */
let cachedPythonCommand = null;
function getPythonCommand() {
  if (cachedPythonCommand) return cachedPythonCommand;

  const candidates = process.platform === 'win32'
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      cachedPythonCommand = candidate;
      return cachedPythonCommand;
    } catch (err) {
      // Try next candidate
    }
  }

  // Fall back to python3; the resulting error will surface a clear message.
  cachedPythonCommand = 'python3';
  return cachedPythonCommand;
}

/**
 * Smart heuristic to extract target job role from JD description text
 */
function extractJobRoleFromJd(jdText) {
  if (!jdText || jdText.trim() === '') return null;
  const lines = jdText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  // 1. Scan the first 5 lines for explicit title labels (e.g. "Title: ...", "Position: ...", "Job Role: ...")
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    const match = line.match(/^(?:job\s+)?(?:title|role|position)(?:\s+title)?\s*:\s*([A-Za-z0-9\s\-&]+)/i);
    if (match && match[1]) {
      let clean = match[1].replace(/^(?:a|an|the)\b\s*/i, '').replace(/[\*#_:]/g, '').trim();
      if (clean.length > 2 && clean.length < 50 && !clean.toLowerCase().includes('description')) {
        return clean;
      }
    }
  }

  // 2. Scan the first 3 lines for a short title line, skipping metadata and introductory templates
  const skipKeywords = ['company', 'location', 'salary', 'posted', 'apply', 'reports to', 'status', 'hours', 'job description', 'about', 'we are', 'hiring', 'overview', 'seeking', 'seek', 'description'];
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    if (line.length > 2 && line.length < 55) {
      const containsSkip = skipKeywords.some(k => lowerLine.includes(k));
      if (!containsSkip) {
        let cleanTitle = line.replace(/^(?:a|an|the)\b\s*/i, '').replace(/[\*#_:]/g, '').replace(/^(role|position|title)\s+/i, '').trim();
        if (cleanTitle.length > 2 && !cleanTitle.toLowerCase().includes('description')) {
          return cleanTitle;
        }
      }
    }
  }

  // 3. Try regex patterns to detect role in text
  const patterns = [
    /we are looking for (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
    /seeking (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
    /hiring (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\.|\n|,)/i,
    /searching for (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\s+to|\s+who|\.|\n|,)/i,
    /to join our team as (?:\b(?:an|a)\b\s*)?([A-Za-z0-9\s\-&]+?)(?:\.|\n|,|\s+to)/i,
    /^(?:an?|the)?\s*([A-Za-z0-9\s\-&]+?)\s+\b(?:design|designs|deliver|delivers|develop|develops|build|builds|create|creates|lead|leads|manage|manages|perform|performs|coordinate|coordinates|oversee|oversees|collaborate|collaborates|maintain|maintains|implement|implements|provide|provides|conduct|conducts|analyze|analyzes|support|supports|assist|assists|ensure|ensures|work|works|help|helps|focus|focuses|serve|serves|is|are)\b/i
  ];

  for (const pattern of patterns) {
    const match = jdText.match(pattern);
    if (match && match[1]) {
      let cleanTitle = match[1].replace(/^(?:a|an|the)\b\s*/i, '').trim();
      if (cleanTitle.length > 3 && cleanTitle.length < 50 && !cleanTitle.toLowerCase().includes('candidate') && !cleanTitle.toLowerCase().includes('person')) {
        return cleanTitle;
      }
    }
  }

  return null;
}

/**
 * Smart heuristic to extract target seniority/experience level from JD description text
 */
function extractSeniorityFromJd(jdText) {
  if (!jdText || jdText.trim() === '') return null;
  const lower = jdText.toLowerCase();
  if (lower.includes('intern') || lower.includes('co-op')) {
    return 'Internship';
  }
  if (lower.includes('junior') || lower.includes('entry') || lower.includes('associate') || lower.includes('fresher')) {
    return 'Entry-Level';
  }
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead') || lower.includes('principal') || lower.includes('director')) {
    return 'Senior-Level';
  }
  return 'Mid-Level';
}


/**
 * Handle user signup request.
 * POST /api/auth/signup
 */
async function signup(req, res) {
  try {
    // 1. Validate data
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check duplicate email in MongoDB
    const duplicateUser = await User.findOne({ email: normalizedEmail });
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.'
      });
    }

    // 3. Hash password (salt round = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Store user in MongoDB
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // 5. Return success
    return res.status(201).json({
      success: true,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
}

/**
 * Handle user login request.
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    // 1. Validate data
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user in MongoDB
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Email or Password'
      });
    }

    // 3. Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Email or Password'
      });
    }

    // 4. Store session state in express-session
    req.session.userId = user._id;

    // 5. Return success
    return res.status(200).json({
      success: true,
      message: 'Login Successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college || '',
        company: user.company || '',
        role: user.role || '',
        bio: user.bio || '',
        profilePic: user.profilePic || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
}

/**
 * Update user profile details.
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
  try {
    const { id, name, college, company, role, bio, profilePic } = req.body;
    
    // Find user in MongoDB
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Update user properties
    user.name = name.trim();
    user.college = college ? college.trim() : '';
    user.company = company ? company.trim() : '';
    user.role = role ? role.trim() : '';
    user.bio = bio ? bio.trim() : '';
    if (profilePic !== undefined) {
      user.profilePic = profilePic;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        company: user.company,
        role: user.role,
        bio: user.bio,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during profile update.'
    });
  }
}

/**
 * Predict Job Title and Experience Level from CV keywords
 * POST /api/auth/predict
 */
async function predictRole(req, res) {
  try {
    const { text, jobDescription } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Input text is required for prediction'
      });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'predict.py');
    const textToPredict = (jobDescription && jobDescription.trim() !== '') ? jobDescription : text;
    
    // Use 'py' (Python Launcher for Windows) to run the script, avoiding Windows Store python.exe stub hangs
    execFile(getPythonCommand(), [scriptPath, textToPredict], (error, stdout, stderr) => {
      if (error) {
        console.error('Python execution error:', error);
        console.error('stderr:', stderr);
        return res.status(500).json({
          success: false,
          message: 'Error executing prediction model'
        });
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          return res.status(400).json({
            success: false,
            message: result.error
          });
        }
        
        let predictedTitle = result.predictedTitle;
        let predictedExperienceLevel = result.predictedExperienceLevel;

        // Apply heuristic override if jobDescription is provided
        if (jobDescription && jobDescription.trim() !== '') {
          const hTitle = extractJobRoleFromJd(jobDescription);
          const hExp = extractSeniorityFromJd(jobDescription);
          if (hTitle) predictedTitle = hTitle;
          if (hExp) predictedExperienceLevel = hExp;
        }

        const apiKey = process.env.XAI_API_KEY;
        if (jobDescription && apiKey && apiKey.trim() !== '') {
          const modelName = process.env.XAI_MODEL || 'grok-beta';
          
          const systemPrompt = `You are an expert recruiter and ATS (Applicant Tracking System) optimizer specializing in the field of "${predictedTitle}" (seniority level: "${predictedExperienceLevel}").
Analyze the candidate's Resume against the target Job Description to identify technical alignment, skill gaps, and ATS compliance issues.
Also, parse the candidate's resume text thoroughly into structured sections.

Your response must be a JSON object matching this schema:
{
  "predictedTitle": "<string: the exact job title of the target Job Description, e.g., 'English Teacher'>",
  "predictedExperienceLevel": "<string: the target seniority level of the target Job Description, e.g., 'Entry-Level', 'Mid-Level', 'Senior-Level', 'Internship'>",
  "matchScore": <integer between 0 and 100 representing the fit percentage>,
  "matchedSkills": [<array of skills found in both the resume and the job description, up to 8 items>],
  "missingSkills": [<array of skills required in the job description but missing from the resume, up to 8 items>],
  "otherSkills": [<array of other skills found in the resume but not explicitly requested, up to 8 items>],
  "suggestions": [
    {
      "id": 1,
      "text": "Skills Section: Append the missing skill...",
      "type": "warning" or "info",
      "actionTitle": "Add Missing Skills",
      "actionDetails": "Specific advice on where and how to integrate it in the CV",
      "keyword": "<lowercase single-word skill tag to match, e.g., 'classroom'>"
    }
  ],
  "parsedCv": {
    "name": "<string: candidate's full name, if not found, use 'Candidate'>",
    "contact": {
      "email": "<string: candidate's email address>",
      "phone": "<string: candidate's phone number>",
      "location": "<string: city and country/state, e.g. San Francisco, CA>",
      "linkedin": "<string: linkedin profile url or handle>",
      "github": "<string: github profile url or handle>",
      "portfolio": "<string: portfolio url>"
    },
    "summary": "<string: brief professional summary paragraph summarizing background>",
    "skills": [
      {
        "category": "<string: skill category name, e.g., Technical Skills>",
        "items": [<array of strings: skills in this category>]
      }
    ],
    "experience": [
      {
        "role": "<string: job role/title>",
        "company": "<string: company name>",
        "duration": "<string: e.g. June 2022 - Present or 2020 - 2022>",
        "highlights": [<array of strings: bullet points describing achievements and responsibilities>]
      }
    ],
    "education": [
      {
        "degree": "<string: e.g. B.S. in Computer Science>",
        "school": "<string: school/college name>",
        "duration": "<string: e.g. 2018 - 2022>"
      }
    ],
    "projects": [
      {
        "name": "<string: project title>",
        "description": "<string: short paragraph describing what was built and its impact>",
        "technologies": [<array of strings: tools used in the project>]
      }
    ]
  }
}
Return ONLY valid raw JSON. Do not include markdown formatting or extra text outside the JSON object.`;

          const userPrompt = `Candidate Resume Text:
${text}

Target Job Description:
${jobDescription}`;

          fetch('https://api.x.ai/v1/chat/completions', {
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
          })
          .then(async (response) => {
            if (!response.ok) {
              const errBody = await response.text();
              throw new Error(`xAI Grok API HTTP error ${response.status}: ${errBody}`);
            }
            return response.json();
          })
          .then((data) => {
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
              throw new Error('Empty message content returned from Grok');
            }

            let parsedAnalysis;
            try {
              let cleanedContent = content.trim();
              if (cleanedContent.startsWith('```')) {
                cleanedContent = cleanedContent.replace(/^```(?:json)?/, '');
              }
              if (cleanedContent.endsWith('```')) {
                cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
              }
              parsedAnalysis = JSON.parse(cleanedContent.trim());
            } catch (jsonErr) {
              console.error('Error parsing Grok JSON content:', jsonErr, content);
              throw jsonErr;
            }

            return res.status(200).json({
              success: true,
              predictedTitle: parsedAnalysis.predictedTitle || predictedTitle,
              predictedExperienceLevel: parsedAnalysis.predictedExperienceLevel || predictedExperienceLevel,
              matchScore: parsedAnalysis.matchScore,
              matchedSkills: parsedAnalysis.matchedSkills,
              missingSkills: parsedAnalysis.missingSkills,
              otherSkills: parsedAnalysis.otherSkills,
              suggestions: parsedAnalysis.suggestions,
              parsedCv: parsedAnalysis.parsedCv
            });
          })
          .catch((grokError) => {
            console.error('Grok integration failed, falling back:', grokError);
            return res.status(200).json({
              success: true,
              predictedTitle,
              predictedExperienceLevel
            });
          });
        } else {
          return res.status(200).json({
            success: true,
            predictedTitle,
            predictedExperienceLevel
          });
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError, stdout);
        return res.status(500).json({
          success: false,
          message: 'Error parsing model output'
        });
      }
    });
  } catch (error) {
    console.error('Predict error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during prediction.'
    });
  }
}

async function uploadCvFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { jobDescription } = req.body;
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

    let extractedText = '';
    
    // Parse PDF or DOCX file
    if (extension === '.pdf') {
      extractedText = await parserService.parsePdf(fileBuffer);
    } else if (extension === '.docx') {
      extractedText = await parserService.parseDocx(fileBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload .pdf or .docx'
      });
    }

    // Now call predict logic (same as predictRole but directly in the code to get structured LLM results)
    const scriptPath = path.join(__dirname, '..', 'scripts', 'predict.py');
    const textToPredict = (jobDescription && jobDescription.trim() !== '') ? jobDescription : extractedText;
    
    execFile(getPythonCommand(), [scriptPath, textToPredict], (error, stdout, stderr) => {
      if (error) {
        console.error('Python execution error during file upload parsing:', error);
        return res.status(500).json({
          success: false,
          message: 'Error executing prediction model'
        });
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          return res.status(400).json({
            success: false,
            message: result.error
          });
        }
        
        let predictedTitle = result.predictedTitle;
        let predictedExperienceLevel = result.predictedExperienceLevel;

        // Apply heuristic override if jobDescription is provided
        if (jobDescription && jobDescription.trim() !== '') {
          const hTitle = extractJobRoleFromJd(jobDescription);
          const hExp = extractSeniorityFromJd(jobDescription);
          if (hTitle) predictedTitle = hTitle;
          if (hExp) predictedExperienceLevel = hExp;
        }

        const apiKey = process.env.XAI_API_KEY;
        if (jobDescription && apiKey && apiKey.trim() !== '') {
          const modelName = process.env.XAI_MODEL || 'grok-beta';
          
          const systemPrompt = `You are an expert recruiter and ATS (Applicant Tracking System) optimizer specializing in the field of "${predictedTitle}" (seniority level: "${predictedExperienceLevel}").
Analyze the candidate's Resume against the target Job Description to identify alignment, skill gaps, and ATS compliance issues.
Also, parse the candidate's resume text thoroughly into structured sections.

Your response must be a JSON object matching this schema:
{
  "predictedTitle": "<string: the exact job title of the target Job Description, e.g., 'English Teacher'>",
  "predictedExperienceLevel": "<string: the target seniority level of the target Job Description, e.g., 'Entry-Level', 'Mid-Level', 'Senior-Level', 'Internship'>",
  "matchScore": <integer between 0 and 100>,
  "matchedSkills": [<array of skills found in both, up to 8>],
  "missingSkills": [<array of skills required in JD but missing, up to 8>],
  "otherSkills": [<array of other skills found in resume but not requested, up to 8>],
  "suggestions": [
    {
      "id": 1,
      "text": "Skills Section: Append the missing skill...",
      "type": "warning" or "info",
      "actionTitle": "Add Missing Skills",
      "actionDetails": "Specific advice on where and how to integrate it in the CV",
      "keyword": "<lowercase single-word skill tag to match, e.g., 'classroom'>"
    }
  ],
  "parsedCv": {
    "name": "<string: candidate's name>",
    "contact": {
      "email": "<string: email>",
      "phone": "<string: phone>",
      "location": "<string: city, state>",
      "linkedin": "<string: linkedin>",
      "github": "<string: github>",
      "portfolio": "<string: portfolio>"
    },
    "summary": "<string: professional summary>",
    "skills": [
      {
        "category": "<string: skill category name, e.g., Domain Expertise>",
        "items": [<array of strings: skills in this category>]
      }
    ],
    "experience": [
      {
        "role": "<string: role>",
        "company": "<string: company>",
        "location": "<string: location, e.g., San Francisco, CA>",
        "duration": "<string: duration>",
        "highlights": [<array of strings: highlights>]
      }
    ],
    "education": [
      {
        "degree": "<string: degree>",
        "school": "<string: school>",
        "location": "<string: location, e.g., Boston, MA>",
        "duration": "<string: duration>",
        "gpa": "<string: GPA, e.g., 3.8/4.0>"
      }
    ],
    "projects": [
      {
        "name": "<string: name>",
        "description": "<string: description>",
        "technologies": [<array of strings: tools>],
        "link": "<string: project URL or GitHub link>"
      }
    ],
    "certifications": [
      {
        "name": "<string: certification name>",
        "issuer": "<string: issuing organization>",
        "date": "<string: date issued, e.g., Jan 2025>"
      }
    ]
  }
}
Return ONLY valid raw JSON. Do not include markdown formatting.`;

          const userPrompt = `Candidate Resume Text:
${extractedText}

Target Job Description:
${jobDescription}`;

          fetch('https://api.x.ai/v1/chat/completions', {
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
          })
          .then(async (response) => {
            if (!response.ok) {
              const errBody = await response.text();
              throw new Error(`Grok API HTTP error ${response.status}: ${errBody}`);
            }
            return response.json();
          })
          .then((data) => {
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
              throw new Error('Empty message content returned from Grok');
            }

            let parsedAnalysis = JSON.parse(content.trim());
            return res.status(200).json({
              success: true,
              extractedText,
              predictedTitle: parsedAnalysis.predictedTitle || predictedTitle,
              predictedExperienceLevel: parsedAnalysis.predictedExperienceLevel || predictedExperienceLevel,
              matchScore: parsedAnalysis.matchScore,
              matchedSkills: parsedAnalysis.matchedSkills,
              missingSkills: parsedAnalysis.missingSkills,
              otherSkills: parsedAnalysis.otherSkills,
              suggestions: parsedAnalysis.suggestions,
              parsedCv: parsedAnalysis.parsedCv
            });
          })
          .catch((grokError) => {
            console.error('Grok failed during file parsing, falling back:', grokError);
            return res.status(200).json({
              success: true,
              extractedText,
              predictedTitle,
              predictedExperienceLevel
            });
          });
        } else {
          return res.status(200).json({
            success: true,
            extractedText,
            predictedTitle,
            predictedExperienceLevel
          });
        }
      } catch (parseError) {
        console.error('JSON parse error during file upload:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Error parsing model output'
        });
      }
    });
  } catch (err) {
    console.error('File upload controller error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload and parse CV file'
    });
  }
}

async function downloadDocxCv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No DOCX file uploaded'
      });
    }

    const docxBuffer = req.file.buffer;
    let replacements = {};
    
    // Parse replacements array/object from body
    if (req.body.replacements) {
      try {
        replacements = JSON.parse(req.body.replacements);
      } catch (err) {
        replacements = req.body.replacements;
      }
    }

    // Call generator service to replace raw text in the DOCX XML document
    const modifiedDocxBuffer = generatorService.replaceRawTextInDocx(docxBuffer, replacements);

    // Set headers to trigger file download in browser
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=optimized_cv.docx`);
    res.send(modifiedDocxBuffer);
  } catch (err) {
    console.error('Error modifying and downloading DOCX CV:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate modified DOCX CV'
    });
  }
}

async function generateCvPdf(req, res) {
  try {
    const cvData = req.body;
    if (!cvData || !cvData.contact || !cvData.contact.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV data payload'
      });
    }

    // Call Puppeteer template compiler
    const pdfBuffer = await pdfGeneratorService.generatePdfFromTemplate(cvData);

    // Send PDF file buffer to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${cvData.contact.fullName.replace(/\s+/g, '_')}_CV.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF from CVData:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compile and render styled PDF CV.'
    });
  }
}

async function saveHistory(req, res) {
  try {
    const {
      userId,
      jobDescription,
      matchScore,
      predictedTitle,
      predictedExperienceLevel,
      matchedSkills,
      missingSkills,
      otherSkills,
      suggestions,
      parsedCv
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required to save history.'
      });
    }

    const historyData = {
      userId,
      jobDescription: jobDescription || '',
      matchScore: Number(matchScore) || 0,
      predictedTitle: predictedTitle || 'General Developer',
      predictedExperienceLevel: predictedExperienceLevel || 'Mid-Level',
      matchedSkills: matchedSkills ? JSON.parse(matchedSkills) : [],
      missingSkills: missingSkills ? JSON.parse(missingSkills) : [],
      otherSkills: otherSkills ? JSON.parse(otherSkills) : [],
      suggestions: suggestions ? JSON.parse(suggestions) : [],
      parsedCv: parsedCv ? JSON.parse(parsedCv) : null
    };

    if (req.file) {
      historyData.originalFile = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer
      };
    }

    const savedRecord = await History.create(historyData);

    return res.status(201).json({
      success: true,
      message: 'History saved successfully.',
      id: savedRecord._id
    });
  } catch (error) {
    console.error('Error saving scan history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save scan history.'
    });
  }
}

async function getHistory(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId parameter is required.'
      });
    }

    // Exclude originalFile.data for list performance
    const historyList = await History.find({ userId })
      .select('-originalFile.data')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      history: historyList
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve scan history.'
    });
  }
}

async function deleteHistoryItem(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'History item ID is required.'
      });
    }

    const deletedItem = await History.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'History item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'History item deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting history item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete history item.'
    });
  }
}

async function downloadHistoryFile(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'History item ID is required.'
      });
    }

    const record = await History.findById(id);
    if (!record || !record.originalFile || !record.originalFile.data) {
      return res.status(404).json({
        success: false,
        message: 'Original file not found for this history record.'
      });
    }

    res.setHeader('Content-Type', record.originalFile.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${record.originalFile.filename}"`);
    return res.send(record.originalFile.data);
  } catch (error) {
    console.error('Error downloading history file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download original file.'
    });
  }
}

async function saveCv(req, res) {
  try {
    const { userId, cvData } = req.body;
    if (!userId || !cvData) {
      return res.status(400).json({
        success: false,
        message: 'userId and cvData are required.'
      });
    }

    const updatedCv = await Cv.findOneAndUpdate(
      { userId },
      { cvData },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Active CV saved to MongoDB successfully.',
      cv: updatedCv
    });
  } catch (error) {
    console.error('Error saving active CV:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save active CV.'
    });
  }
}

async function getCv(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId parameter is required.'
      });
    }

    const cvRecord = await Cv.findOne({ userId });
    if (!cvRecord) {
      return res.status(404).json({
        success: false,
        message: 'No saved active CV found for this user.'
      });
    }

    return res.status(200).json({
      success: true,
      cvData: cvRecord.cvData
    });
  } catch (error) {
    console.error('Error retrieving active CV:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active CV.'
    });
  }
}

module.exports = {
  signup,
  login,
  updateProfile,
  predictRole,
  uploadCvFile,
  downloadDocxCv,
  generateCvPdf,
  saveHistory,
  getHistory,
  deleteHistoryItem,
  downloadHistoryFile,
  saveCv,
  getCv
};

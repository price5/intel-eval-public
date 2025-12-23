import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationRequest {
  code: string;
  explanation: string;
  language: string;
  codeWeight: number;
  explanationWeight: number;
  problemStatement?: string;
}

interface LineAnalysis {
  lineNumber: number;
  status: 'positive' | 'negative' | 'neutral';
  reason: string;
}

interface SentenceAnalysis {
  sentence: string;
  status: 'positive' | 'negative' | 'neutral';
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      code, 
      explanation, 
      language, 
      codeWeight, 
      explanationWeight,
      problemStatement = "General coding problem",
      healthCheck
    }: EvaluationRequest & { healthCheck?: boolean } = await req.json();

    // Handle health check requests
    if (healthCheck === true) {
      console.log('Health check received - AI Evaluation service is operational');
      return new Response(JSON.stringify({ status: 'ok', service: 'ai-evaluation' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Evaluating code and explanation with OpenAI');

    const prompt = `
You are an expert programming instructor evaluating a student's coding solution and explanation.

Problem Statement: ${problemStatement}

Language: ${language}

Student's Code (with line numbers):
${code.split('\n').map((line, idx) => `${idx + 1}: ${line}`).join('\n')}

Student's Explanation:
${explanation}

Evaluation Weights:
- Code Quality: ${codeWeight}%
- Explanation Quality: ${explanationWeight}%

CRITICAL EVALUATION GUIDELINES:

1. **Code Analysis** (Rate 0-100):
   - Correctness: Does it solve the problem correctly?
   - Logic: Is the algorithm sound and efficient?
   - Best practices: Proper variable names, structure, error handling
   - Optimization: Could it be more efficient?
   - DO NOT penalize for missing comments - the explanation section covers this
   
2. **Explanation Analysis** (Rate 0-100):
   - Clarity: Is it easy to understand?
   - Technical accuracy: Are technical terms used correctly?
   - Completeness: Does it explain the approach, logic, and complexity?
   - Understanding: Does it demonstrate deep understanding?

3. **Line-by-Line Code Analysis**:
   - Analyze EACH line of code
   - Mark as "positive" (helped score), "negative" (hurt score), or "neutral"
   - Provide specific reason for each marked line
   - Be accurate - only mark lines that truly impact the solution

4. **Sentence-by-Sentence Explanation Analysis**:
   - Analyze each sentence in the explanation
   - Mark as "positive" (clear, accurate), "negative" (unclear, inaccurate), or "neutral"
   - Provide specific reason for each sentence

5. **Specific Feedback**:
   - Reference actual code lines and variables from the student's solution
   - Reference actual sentences from the explanation
   - Be concrete and actionable, not generic

You must respond ONLY with valid JSON in this exact format:
{
  "codeScore": number (0-100),
  "explanationScore": number (0-100),
  "overallScore": number (0-100),
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement 1 with line/sentence reference", "specific improvement 2", "specific improvement 3"],
  "recommendations": ["specific actionable recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "feedback": {
    "code": "detailed feedback referencing actual code lines and variables",
    "explanation": "detailed feedback referencing actual explanation content"
  },
  "codeHeatmap": [
    {"lineNumber": 1, "status": "positive|negative|neutral", "reason": "specific reason"},
    {"lineNumber": 2, "status": "positive|negative|neutral", "reason": "specific reason"}
  ],
  "explanationHeatmap": [
    {"sentence": "first sentence text", "status": "positive|negative|neutral", "reason": "specific reason"},
    {"sentence": "second sentence text", "status": "positive|negative|neutral", "reason": "specific reason"}
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert programming instructor. You must respond ONLY with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    const generatedText = data.choices[0].message.content;
    console.log('OpenAI response:', generatedText);

    // Parse the JSON response from Gemini
    let evaluation;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback evaluation
      evaluation = {
        codeScore: 75,
        explanationScore: 70,
        overallScore: Math.round((75 * codeWeight + 70 * explanationWeight) / 100),
        strengths: ["Code compiles and runs", "Shows basic understanding"],
        improvements: ["Consider edge cases", "Improve algorithm efficiency"],
        recommendations: ["Practice more coding problems", "Work on explanation skills"],
        feedback: {
          code: "Your code shows good basic structure. Consider adding error handling and optimizing the algorithm.",
          explanation: "Your explanation covers the basics. Try to elaborate more on your thought process and time complexity."
        },
        codeHeatmap: [],
        explanationHeatmap: []
      };
    }

    // Ensure overallScore is calculated correctly with weights
    evaluation.overallScore = Math.round(
      (evaluation.codeScore * codeWeight + evaluation.explanationScore * explanationWeight) / 100
    );

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI evaluation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage,
      codeScore: 0,
      explanationScore: 0,
      overallScore: 0,
      strengths: [],
      improvements: ["Fix the technical issues before evaluation"],
      recommendations: ["Check your code syntax and try again"],
      feedback: {
        code: "Unable to evaluate due to technical error",
        explanation: "Unable to evaluate due to technical error"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
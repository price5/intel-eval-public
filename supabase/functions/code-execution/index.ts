/**
 * CODE EXECUTION SERVICE - JUDGE0 INTEGRATION
 * 
 * Real code execution powered by Judge0 CE via RapidAPI
 * Supports: Python, JavaScript, Java, C++, C
 * Features: Real compilation, stdin support, test case validation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Judge0 Configuration
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_BASE_URL = `https://${RAPIDAPI_HOST}`;

// Judge0 Language IDs
const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  'c': 50,           // C (GCC 9.2.0)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'python': 71       // Python (3.8.1)
};

interface CodeExecutionRequest {
  language: string;
  code: string;
  input?: string;
  testCases?: Array<{ input: string; expected_output: string; description?: string; hidden?: boolean }>;
  hiddenTestCases?: Array<{ input: string; expected_output: string; description?: string; hidden?: boolean }>;
  timeout_ms?: number;
  memory_limit_mb?: number;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr?: string;
  exit_code?: number;
  output?: string;
  time_ms?: number;
  memory_mb?: number;
  compile_output?: string;
  error?: string;
  testResults?: TestResults;
  executionTime?: number;
}

interface TestCase {
  input: string;
  expected_output?: string;
  expectedOutput?: string;
  description?: string;
  hidden?: boolean;
}

interface TestResults {
  tests_passed: number;
  tests_total: number;
  publicPassed: number;
  publicTotal: number;
  hiddenPassed: number;
  hiddenTotal: number;
  allPassed?: boolean;
  test_results: Array<{
    name?: string;
    passed: boolean;
    input: string;
    expected?: string;
    expected_output: string;
    output?: string;
    actual_output: string;
    hidden?: boolean;
    test_type: 'public' | 'hidden';
  }>;
  failures?: Array<{ input: string; expected: string; actual: string; testType?: 'public' | 'hidden' }>;
}

interface Judge0Submission {
  token: string;
}

interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

/**
 * Sleep utility for polling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute code using Judge0 API
 */
async function executeCodeWithJudge0(
  language: string,
  code: string,
  stdin: string = ''
): Promise<{
  stdout: string;
  stderr: string;
  compile_output: string;
  time_ms: number;
  memory_kb: number;
  exit_code: number;
  status: { id: number; description: string };
}> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY not configured');
  }

  const languageId = JUDGE0_LANGUAGE_MAP[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  console.log(`[Judge0] Submitting ${language} code (language_id: ${languageId})`);

  // Step 1: Create submission with wait=true for faster results
  const submissionResponse = await fetch(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: stdin || '',
      }),
    }
  );

  if (!submissionResponse.ok) {
    const errorText = await submissionResponse.text();
    console.error('[Judge0] Submission failed:', errorText);
    throw new Error(`Judge0 submission failed: ${submissionResponse.status} ${errorText}`);
  }

  const submissionData: Judge0Submission = await submissionResponse.json();
  const token = submissionData.token;
  console.log(`[Judge0] Submission created with token: ${token}`);

  // Step 2: Poll for result (max 10 attempts with 300ms delay)
  let result: Judge0Result | null = null;
  for (let i = 0; i < 10; i++) {
    await sleep(300);

    const resultResponse = await fetch(
      `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      }
    );

    if (!resultResponse.ok) {
      console.error(`[Judge0] Failed to fetch result (attempt ${i + 1}/10)`);
      continue;
    }

    result = await resultResponse.json();
    
    // Status 1 = In Queue, 2 = Processing
    // Status 3+ = Completed (3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compilation Error, etc.)
    if (result.status.id >= 3) {
      console.log(`[Judge0] Execution completed with status: ${result.status.description}`);
      break;
    }

    console.log(`[Judge0] Polling... Status: ${result.status.description} (attempt ${i + 1}/10)`);
  }

  if (!result || result.status.id < 3) {
    throw new Error('Judge0 execution timeout - took too long to complete');
  }

  // Step 3: Process and return result
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const compile_output = result.compile_output || '';
  const time_ms = result.time ? parseFloat(result.time) * 1000 : 0;
  const memory_kb = result.memory || 0;
  
  // Determine exit code based on status
  // Status 3 (Accepted) = 0, all others = 1
  const exit_code = result.status.id === 3 ? 0 : 1;

  return {
    stdout,
    stderr,
    compile_output,
    time_ms,
    memory_kb,
    exit_code,
    status: result.status,
  };
}

/**
 * Normalize output for comparison (trim and normalize whitespace)
 */
function normalizeOutput(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Run test cases against code using Judge0
 */
async function runTestCases(
  language: string,
  code: string,
  publicTests: TestCase[],
  hiddenTests: TestCase[]
): Promise<TestResults> {
  const allTests = [
    ...publicTests.map(t => ({ ...t, type: 'public' as const })),
    ...hiddenTests.map(t => ({ ...t, type: 'hidden' as const })),
  ];

  console.log(`[Judge0] Running ${allTests.length} test cases (${publicTests.length} public, ${hiddenTests.length} hidden)`);

  // Execute all tests in parallel for faster results
  const results = await Promise.all(
    allTests.map(async (test, index) => {
      const testName = test.description || `${test.type === 'public' ? 'Public' : 'Hidden'} Test ${index + 1}`;
      
      try {
        console.log(`[Judge0] Running test case ${index + 1}/${allTests.length}: ${testName}`);
        
        const result = await executeCodeWithJudge0(language, code, test.input);
        
        const actual = result.stdout.trim();
        const expected = (test.expected_output || test.expectedOutput || '').trim();
        
        // Check for compilation or runtime errors
        let passed = false;
        if (result.compile_output) {
          console.log(`[Judge0] Test ${index + 1} failed: Compilation error`);
          passed = false;
        } else if (result.stderr && result.exit_code !== 0) {
          console.log(`[Judge0] Test ${index + 1} failed: Runtime error`);
          passed = false;
        } else {
          // Compare outputs with flexible whitespace matching
          passed = normalizeOutput(actual) === normalizeOutput(expected);
          console.log(`[Judge0] Test ${index + 1} ${passed ? 'PASSED' : 'FAILED'}`);
        }

        return {
          name: testName,
          input: test.input,
          expected_output: expected,
          expected: expected,
          actual_output: result.compile_output || result.stderr || actual,
          output: result.compile_output || result.stderr || actual,
          passed,
          test_type: test.type,
          hidden: test.type === 'hidden',
        };
      } catch (error) {
        console.error(`[Judge0] Test ${index + 1} error:`, error.message);
        
        // If execution fails, mark test as failed
        return {
          name: testName,
          input: test.input,
          expected_output: (test.expected_output || test.expectedOutput || '').trim(),
          expected: (test.expected_output || test.expectedOutput || '').trim(),
          actual_output: `Execution error: ${error.message}`,
          output: `Execution error: ${error.message}`,
          passed: false,
          test_type: test.type,
          hidden: test.type === 'hidden',
        };
      }
    })
  );

  const publicResults = results.filter(r => r.test_type === 'public');
  const hiddenResults = results.filter(r => r.test_type === 'hidden');

  const publicPassed = publicResults.filter(r => r.passed).length;
  const hiddenPassed = hiddenResults.filter(r => r.passed).length;
  const totalPassed = publicPassed + hiddenPassed;
  const totalTests = results.length;

  const failures = results
    .filter(r => !r.passed)
    .map(r => ({
      input: r.input,
      expected: r.expected_output,
      actual: r.actual_output,
      testType: r.test_type,
    }));

  console.log(`[Judge0] Test results: ${totalPassed}/${totalTests} passed (Public: ${publicPassed}/${publicResults.length}, Hidden: ${hiddenPassed}/${hiddenResults.length})`);

  return {
    tests_passed: totalPassed,
    tests_total: totalTests,
    publicPassed,
    publicTotal: publicResults.length,
    hiddenPassed,
    hiddenTotal: hiddenResults.length,
    allPassed: totalPassed === totalTests,
    failures,
    test_results: results,
  };
}

// ============================================================================
// MAIN SERVER HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: CodeExecutionRequest = await req.json();
    const { language, code, input = '', testCases = [], hiddenTestCases = [], healthCheck } = request as any;

    // Handle health check requests
    if (healthCheck === true) {
      console.log('[Judge0] Health check received - Code Execution service is operational');
      return new Response(JSON.stringify({ status: 'ok', service: 'code-execution' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Judge0] Request received for ${language}`);

    // Validate API key
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured. Please set the secret in Supabase.');
    }

    // Validate language
    const supportedLanguages = ['python', 'javascript', 'java', 'cpp', 'c'];
    if (!supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`);
    }

    // If test cases are provided, run them
    if (testCases.length > 0 || hiddenTestCases.length > 0) {
      console.log(`[Judge0] Running test cases mode`);
      const testResults = await runTestCases(language, code, testCases, hiddenTestCases);
      
      // Get first test execution time for display
      const firstTestResult = testResults.test_results[0];
      const hasErrors = testResults.test_results.some(r => 
        r.actual_output.includes('Compilation error') || 
        r.actual_output.includes('Runtime error') ||
        r.actual_output.includes('Execution error')
      );

      const response: ExecutionResult = {
        success: !hasErrors && testResults.allPassed,
        stdout: testResults.test_results[0]?.actual_output || '',
        stderr: hasErrors ? testResults.test_results[0]?.actual_output : '',
        output: testResults.test_results[0]?.actual_output || '',
        executionTime: 0, // Will be set by first execution
        time_ms: 0,
        testResults: testResults,
        exit_code: testResults.allPassed ? 0 : 1,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single execution mode (no test cases)
    console.log(`[Judge0] Running single execution mode`);
    const executionResult = await executeCodeWithJudge0(language, code, input);

    const response: ExecutionResult = {
      success: executionResult.exit_code === 0 && !executionResult.compile_output && !executionResult.stderr,
      stdout: executionResult.stdout,
      stderr: executionResult.compile_output || executionResult.stderr || '',
      compile_output: executionResult.compile_output,
      output: executionResult.compile_output || executionResult.stderr || executionResult.stdout,
      executionTime: executionResult.time_ms,
      time_ms: executionResult.time_ms,
      exit_code: executionResult.exit_code,
    };

    console.log(`[Judge0] Execution completed successfully`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Judge0] Execution error:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (errorMessage.includes('RAPIDAPI_KEY')) {
      errorMessage = 'RapidAPI key not configured. Please add the RAPIDAPI_KEY secret in Supabase.';
    } else if (errorMessage.includes('rate limit')) {
      errorMessage = 'Judge0 rate limit reached. Please try again later or upgrade your RapidAPI plan.';
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        stderr: errorMessage,
        stdout: '',
        output: errorMessage,
        exit_code: 1,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

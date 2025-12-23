import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code, Home } from "lucide-react";

const Terms = () => {
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IntelEval
            </h1>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: January 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p>
                By accessing or using IntelEval, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these
                terms, you are prohibited from using this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Use License</h2>
              <p>
                Permission is granted to use IntelEval for educational purposes only. This license
                shall automatically terminate if you violate any of these restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
              <p>To use certain features of IntelEval, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the platform for any unlawful purpose</li>
                <li>Attempt to bypass security measures or access restrictions</li>
                <li>Submit malicious code or harmful content</li>
                <li>Interfere with other users' access to the platform</li>
                <li>Share assessment content without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p>
                The platform and its original content, features, and functionality are owned by
                IntelEval and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Code Submissions</h2>
              <p>
                By submitting code to IntelEval, you grant us a license to use, reproduce, and
                analyze your submissions for the purpose of evaluation and providing feedback.
                Your submissions remain your property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Termination</h2>
              <p>
                We may terminate or suspend your account and access to the platform immediately,
                without prior notice, for conduct that we believe violates these Terms of Service
                or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
              <p>
                IntelEval is provided "as is" without any warranties, expressed or implied. We do
                not guarantee that the platform will be error-free or uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of
                any material changes via email or through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  our contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;

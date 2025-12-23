import { Link } from "react-router-dom";
import { Code } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mx-4 mb-4 border border-border/50 bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg">
      <div className="container mx-auto max-w-7xl py-12 px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <Code className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">IntelEval</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Intelligent code assessment platform for modern education.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/api" className="hover:text-foreground transition-colors">API</Link></li>
              <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-sm">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/help-center" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/community" className="hover:text-foreground transition-colors">Community</Link></li>
              <li><Link to="/status" className="hover:text-foreground transition-colors">Status</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 IntelEval. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

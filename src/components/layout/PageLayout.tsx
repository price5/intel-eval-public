import { useLocation } from "react-router-dom";
import Footer from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const location = useLocation();
  
  // Hide footer on dashboard, admin, and assessment routes
  const hideFooter = location.pathname.startsWith('/dashboard') || 
                     location.pathname.startsWith('/admin') ||
                     location.pathname.startsWith('/assessment');

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default PageLayout;

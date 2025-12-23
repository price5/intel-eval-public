import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { VersionProvider } from "@/contexts/VersionContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { DirectMessageProvider } from "@/contexts/DirectMessageContext";
import { UpdateNotificationDialog } from "@/components/ui/UpdateNotificationDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ForceDarkMode } from "@/components/layout/ForceDarkMode";
import PageLayout from "@/components/layout/PageLayout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import HelpCenter from "./pages/HelpCenter";
import HelpCategoryPage from "./pages/HelpCategoryPage";
import HelpArticle from "./pages/HelpArticle";
import AssessmentSession from "./pages/AssessmentSession";
import AssessmentResult from "./pages/AssessmentResult";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import API from "./pages/API";
import Community from "./pages/Community";
import Status from "./pages/Status";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";

// Create QueryClient outside component to prevent recreation on every render
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AssessmentProvider>
            <VersionProvider>
              <SessionProvider>
                <ChatProvider>
                  <DirectMessageProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Analytics />
                    <SpeedInsights />
                    <UpdateNotificationDialog />
                    <BrowserRouter>
                    <PageLayout>
                      <Routes>
                        <Route path="/" element={<ForceDarkMode><Home /></ForceDarkMode>} />
                        <Route path="/auth" element={<ForceDarkMode><Auth /></ForceDarkMode>} />
                        <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
                        <Route path="/admin" element={<DashboardLayout><Admin /></DashboardLayout>} />
                        <Route path="/assessment/session/:id" element={<DashboardLayout><AssessmentSession /></DashboardLayout>} />
                        <Route path="/assessment/result/:id" element={<DashboardLayout><AssessmentResult /></DashboardLayout>} />
                        <Route path="/help-center" element={<ForceDarkMode><HelpCenter /></ForceDarkMode>} />
                        <Route path="/help-center/:category" element={<ForceDarkMode><HelpCategoryPage /></ForceDarkMode>} />
                        <Route path="/help-center/article/:articleId" element={<ForceDarkMode><HelpArticle /></ForceDarkMode>} />
                        <Route path="/docs" element={<ForceDarkMode><Docs /></ForceDarkMode>} />
                        <Route path="/contact" element={<ForceDarkMode><Contact /></ForceDarkMode>} />
                        <Route path="/pricing" element={<ForceDarkMode><Pricing /></ForceDarkMode>} />
                        <Route path="/about" element={<ForceDarkMode><About /></ForceDarkMode>} />
                        <Route path="/blog" element={<ForceDarkMode><Blog /></ForceDarkMode>} />
                        <Route path="/careers" element={<ForceDarkMode><Careers /></ForceDarkMode>} />
                        <Route path="/api" element={<ForceDarkMode><API /></ForceDarkMode>} />
                        <Route path="/community" element={<ForceDarkMode><Community /></ForceDarkMode>} />
                        <Route path="/status" element={<ForceDarkMode><Status /></ForceDarkMode>} />
                        <Route path="/privacy" element={<ForceDarkMode><Privacy /></ForceDarkMode>} />
                        <Route path="/terms" element={<ForceDarkMode><Terms /></ForceDarkMode>} />
                        <Route path="/500" element={<ForceDarkMode><ServerError /></ForceDarkMode>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<ForceDarkMode><NotFound /></ForceDarkMode>} />
                      </Routes>
                    </PageLayout>
                  </BrowserRouter>
                </TooltipProvider>
              </DirectMessageProvider>
            </ChatProvider>
          </SessionProvider>
          </VersionProvider>
        </AssessmentProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

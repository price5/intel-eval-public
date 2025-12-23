import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Home, CheckCircle2, Activity, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  responseTime: number;
}

interface HealthChecks {
  database: ServiceHealth;
  authentication: ServiceHealth;
  aiEvaluation: ServiceHealth;
  codeExecution: ServiceHealth;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affected_services: string[];
  started_at: string;
  resolved_at: string | null;
}

const Status = () => {
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded' | 'outage'>('operational');

  const { data: healthChecks, isLoading: healthLoading } = useQuery({
    queryKey: ['health-checks'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data as HealthChecks;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['status-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_incidents')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Incident[];
    },
  });

  useEffect(() => {
    if (healthChecks) {
      const statuses = Object.values(healthChecks).map(s => s.status);
      if (statuses.includes('outage')) {
        setOverallStatus('outage');
      } else if (statuses.includes('degraded')) {
        setOverallStatus('degraded');
      } else {
        setOverallStatus('operational');
      }
    }
  }, [healthChecks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Operational
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Degraded
          </Badge>
        );
      case 'outage':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-2" />
            Outage
          </Badge>
        );
      default:
        return null;
    }
  };

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 dark:text-green-400';
      case 'monitoring': return 'text-blue-600 dark:text-blue-400';
      case 'identified': return 'text-yellow-600 dark:text-yellow-400';
      case 'investigating': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  const services = [
    { name: "Database", key: "database" as const },
    { name: "Authentication", key: "authentication" as const },
    { name: "AI Evaluation Engine", key: "aiEvaluation" as const },
    { name: "Code Execution", key: "codeExecution" as const },
  ];

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
          <div className="flex items-center gap-4 mb-6">
            <Activity className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">System Status</h1>
              <p className="text-muted-foreground mt-2">
                Current status of IntelEval services
              </p>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {overallStatus === 'operational' && 'All Systems Operational'}
                    {overallStatus === 'degraded' && 'Some Systems Degraded'}
                    {overallStatus === 'outage' && 'Service Outage'}
                  </CardTitle>
                  <CardDescription>
                    {overallStatus === 'operational' && 'Everything is running smoothly'}
                    {overallStatus === 'degraded' && 'Some services are experiencing issues'}
                    {overallStatus === 'outage' && 'Some services are currently unavailable'}
                  </CardDescription>
                </div>
                {getStatusBadge(overallStatus)}
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4 mb-8">
            {healthLoading ? (
              <Card>
                <CardContent className="py-4 text-center text-muted-foreground">
                  Checking service status...
                </CardContent>
              </Card>
            ) : (
              services.map((service) => {
                const health = healthChecks?.[service.key];
                return (
                  <Card key={service.name}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(health?.status || 'operational')}`}></div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm text-muted-foreground">
                          {health?.uptime || '99.9%'} uptime
                        </span>
                        {health?.responseTime !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            {health.responseTime}ms
                          </span>
                        )}
                        {getStatusBadge(health?.status || 'operational')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {incidents.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Incidents
                </CardTitle>
                <CardDescription>Past outages, maintenance windows, and service disruptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border-l-2 border-primary/20 pl-4 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{incident.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                      </div>
                      <Badge variant="outline" className={getIncidentStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className={`font-medium ${getIncidentSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span>Started: {new Date(incident.started_at).toLocaleString()}</span>
                      {incident.resolved_at && (
                        <span className="text-green-600 dark:text-green-400">
                          Resolved: {new Date(incident.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {incident.affected_services.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {incident.affected_services.map((service) => (
                          <Badge key={service} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you're experiencing issues that aren't reflected here, please reach out
                to our support team.
              </p>
              <Link to="/contact">
                <Button>Contact Support</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Status;

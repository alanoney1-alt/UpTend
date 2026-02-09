/**
 * Customer Multi-Pro Tracking View
 *
 * Shows customers:
 * - Team assembly status ("2 of 3 Pros confirmed")
 * - Live ETA for each Pro
 * - Current phase progress
 * - Lead Pro contact information
 * - Phase sequencing timeline
 * - Completion status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle,
  Users,
  Star,
  Shield,
  AlertCircle,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: 'lead' | 'crew';
  avatar?: string;
  rating: number;
  jobsCompleted: number;
  status: 'confirming' | 'confirmed' | 'en_route' | 'arrived' | 'working' | 'complete';
  eta?: string;
  distance?: string;
}

interface Phase {
  id: string;
  name: string;
  services: string[];
  status: 'pending' | 'in_progress' | 'complete';
  teamSize: number;
  estimatedDuration: string;
  startTime?: Date;
  completedAt?: Date;
}

interface CustomerTrackingProps {
  jobId: string;
  team: TeamMember[];
  phases: Phase[];
  currentPhase?: Phase;
  customerName: string;
  address: string;
  scheduledTime: Date;
  onContactLead: () => void;
  onMessageLead: () => void;
}

export function CustomerTracking({
  jobId,
  team,
  phases,
  currentPhase,
  customerName,
  address,
  scheduledTime,
  onContactLead,
  onMessageLead,
}: CustomerTrackingProps) {
  const leadPro = team.find((m) => m.role === 'lead');
  const confirmedCount = team.filter((m) => m.status !== 'confirming').length;
  const arrivedCount = team.filter((m) => m.status === 'arrived' || m.status === 'working').length;
  const completedPhases = phases.filter((p) => p.status === 'complete');
  const progressPercent = (completedPhases.length / phases.length) * 100;

  // Determine overall status message
  const getStatusMessage = () => {
    if (team.some((m) => m.status === 'confirming')) {
      return `Your team is assembling... ${confirmedCount} of ${team.length} Pros confirmed`;
    }
    if (team.every((m) => m.status === 'complete')) {
      return 'Job complete! Thank you for using UpTend.';
    }
    if (arrivedCount === team.length) {
      return `Your team of ${team.length} Pros is on-site and working`;
    }
    if (arrivedCount > 0) {
      return `${arrivedCount} of ${team.length} Pros have arrived`;
    }
    if (team.some((m) => m.status === 'en_route')) {
      const enRouteCount = team.filter((m) => m.status === 'en_route').length;
      return `${enRouteCount} Pro${enRouteCount > 1 ? 's are' : ' is'} on the way`;
    }
    return 'Your team is getting ready';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Track Your Multi-Pro Team</h1>
        <p className="text-muted-foreground">
          {customerName} • {address}
        </p>
      </div>

      {/* Status Banner */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{getStatusMessage()}</h2>
            {currentPhase && (
              <Badge variant="default" className="text-sm">
                Current Phase: {currentPhase.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedPhases.length} of {phases.length} phases complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">{team.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Verified Pros</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {phases.reduce((sum, p) => sum + parseInt(p.estimatedDuration), 0)}h
              </p>
              <p className="text-sm text-muted-foreground mt-1">Est. Total Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Team
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All Pros are background-checked and covered by UpTend's $1M insurance
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lead Pro */}
          {leadPro && (
            <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 border-2 border-primary">
                    <AvatarImage src={leadPro.avatar} />
                    <AvatarFallback>{leadPro.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{leadPro.name}</p>
                      <Badge className="bg-primary text-white">Lead Pro</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{leadPro.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {leadPro.jobsCompleted} jobs completed
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    leadPro.status === 'arrived' || leadPro.status === 'working'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {leadPro.status.replace('_', ' ')}
                </Badge>
              </div>

              {leadPro.status === 'en_route' && leadPro.eta && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{leadPro.distance} away • ETA: {leadPro.eta}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={onContactLead}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Lead Pro
                </Button>
                <Button variant="outline" className="flex-1" onClick={onMessageLead}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-3 text-center">
                {leadPro.name} is your primary contact for this job
              </p>
            </div>
          )}

          {/* Crew Members */}
          {team
            .filter((m) => m.role === 'crew')
            .map((member) => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{member.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {member.jobsCompleted} jobs
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      member.status === 'arrived' || member.status === 'working'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {member.status.replace('_', ' ')}
                  </Badge>
                </div>

                {member.status === 'en_route' && member.eta && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                    <MapPin className="w-4 h-4" />
                    <span>{member.distance} away • ETA: {member.eta}</span>
                  </div>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Service Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, idx) => (
              <div key={phase.id} className="relative">
                {/* Timeline connector */}
                {idx < phases.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-16 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      phase.status === 'complete'
                        ? 'bg-green-100 text-green-600'
                        : phase.status === 'in_progress'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {phase.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : phase.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  {/* Phase Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{phase.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {phase.services.join(', ')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {phase.estimatedDuration}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {phase.teamSize} Pro{phase.teamSize > 1 ? 's' : ''}
                      </span>
                      {phase.completedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Completed {new Date(phase.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guarantees */}
      <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-green-600 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-green-900 dark:text-green-100">
                UpTend Multi-Pro Guarantee
              </p>
              <ul className="space-y-1 text-green-800 dark:text-green-200">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>All Pros background-checked and insured ($1M coverage)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Lead Pro coordinates all work and is your single point of contact</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Real-time GPS tracking of all team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Satisfaction guaranteed or your money back</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-sm text-muted-foreground">
                Contact your Lead Pro directly using the buttons above, or reach UpTend support at{' '}
                <a href="tel:+14071234567" className="text-primary hover:underline">
                  (407) 123-4567
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

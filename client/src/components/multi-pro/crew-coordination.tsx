/**
 * Crew Coordination Component
 *
 * For Lead Pros to coordinate multi-Pro jobs:
 * - See crew member locations (GPS)
 * - Assign tasks/phases
 * - Monitor progress
 * - Handle customer communication
 * - Approve completion
 *
 * For Crew Members:
 * - See Lead's instructions
 * - Update phase status
 * - Share photos with Lead
 * - Navigate to job site
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Star,
  Camera,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface CrewMember {
  id: string;
  name: string;
  role: 'lead' | 'crew';
  avatar?: string;
  rating: number;
  phone: string;
  status: 'en_route' | 'arrived' | 'working' | 'complete';
  location?: {
    lat: number;
    lng: number;
    lastUpdated: Date;
  };
  assignedPhase?: string;
  eta?: string;
}

interface JobPhase {
  id: string;
  name: string;
  services: string[];
  status: 'pending' | 'in_progress' | 'complete';
  assignedPros: string[];
  startTime?: Date;
  estimatedDuration: string;
  notes?: string;
}

interface CrewCoordinationProps {
  jobId: string;
  isLead: boolean;
  crew: CrewMember[];
  phases: JobPhase[];
  customerName: string;
  customerPhone: string;
  jobAddress: string;
  onUpdatePhase: (phaseId: string, status: string) => void;
  onContactCrew: (memberId: string) => void;
  onNavigate: (address: string) => void;
}

export function CrewCoordination({
  jobId,
  isLead,
  crew,
  phases,
  customerName,
  customerPhone,
  jobAddress,
  onUpdatePhase,
  onContactCrew,
  onNavigate,
}: CrewCoordinationProps) {
  const [activeTab, setActiveTab] = useState<string>(isLead ? 'crew' : 'instructions');

  const leadPro = crew.find((m) => m.role === 'lead');
  const crewMembers = crew.filter((m) => m.role === 'crew');
  const currentPhase = phases.find((p) => p.status === 'in_progress');
  const completedPhases = phases.filter((p) => p.status === 'complete');
  const progressPercent = (completedPhases.length / phases.length) * 100;

  // Get crew member by ID
  const getCrewMember = (id: string) => crew.find((m) => m.id === id);

  // Calculate distance to job site (mock)
  const getDistanceToJob = (member: CrewMember) => {
    if (!member.location) return null;
    // In real app, calculate actual distance
    return member.status === 'arrived' ? '0 mi' : member.eta || 'Calculating...';
  };

  return (
    <div className="space-y-6">
      {/* Job Overview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Multi-Pro Job Coordination</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {customerName} • {jobAddress}
              </p>
            </div>
            <Badge
              variant={currentPhase ? 'default' : 'secondary'}
              className="text-sm"
            >
              {currentPhase ? 'In Progress' : completedPhases.length === phases.length ? 'Complete' : 'Pending'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedPhases.length} of {phases.length} phases complete
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{crew.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">
                  {phases.reduce((sum, p) => sum + parseInt(p.estimatedDuration), 0)}h
                </p>
                <p className="text-xs text-muted-foreground">Est. Total Time</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crew">
            <Users className="w-4 h-4 mr-2" />
            Crew
          </TabsTrigger>
          <TabsTrigger value="phases">
            <Clock className="w-4 h-4 mr-2" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="instructions">
            <MessageSquare className="w-4 h-4 mr-2" />
            {isLead ? 'Customer' : 'Instructions'}
          </TabsTrigger>
        </TabsList>

        {/* Crew Tab */}
        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lead Pro */}
              {leadPro && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src={leadPro.avatar} />
                        <AvatarFallback>{leadPro.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{leadPro.name}</p>
                          <Badge className="bg-primary text-white">Lead Pro</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{leadPro.rating.toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {leadPro.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isLead && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onContactCrew(leadPro.id)}>
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {leadPro.location && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{getDistanceToJob(leadPro)} from job site</span>
                      {leadPro.eta && <span>• ETA: {leadPro.eta}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Crew Members */}
              {crewMembers.map((member) => (
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
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{member.rating.toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {member.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {member.assignedPhase && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Assigned: {member.assignedPhase}
                          </p>
                        )}
                      </div>
                    </div>
                    {isLead && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onContactCrew(member.id)}>
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {member.location && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{getDistanceToJob(member)} from job site</span>
                      {member.eta && <span>• ETA: {member.eta}</span>}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {isLead && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coordination Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Group Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Request Photos from Crew
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-4">
          {phases.map((phase, idx) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Phase {idx + 1}
                      </span>
                      {phase.status === 'complete' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {phase.status === 'in_progress' && (
                        <Badge variant="default">In Progress</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-1">{phase.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{phase.estimatedDuration}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Services */}
                <div>
                  <p className="text-sm font-medium mb-2">Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.services.map((service, i) => (
                      <Badge key={i} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Assigned Pros */}
                <div>
                  <p className="text-sm font-medium mb-2">Assigned Pros:</p>
                  <div className="flex items-center gap-2">
                    {phase.assignedPros.map((proId) => {
                      const member = getCrewMember(proId);
                      return member ? (
                        <div key={proId} className="flex items-center gap-2 text-sm">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Notes */}
                {phase.notes && (
                  <div className="p-3 bg-muted/50 rounded text-sm">
                    <p className="font-medium mb-1">Notes:</p>
                    <p className="text-muted-foreground">{phase.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {isLead && phase.status === 'in_progress' && (
                  <Button
                    className="w-full"
                    onClick={() => onUpdatePhase(phase.id, 'complete')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Phase Complete
                  </Button>
                )}
                {!isLead && phase.status === 'in_progress' && (
                  <Button variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Share Progress Photos
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Instructions/Customer Tab */}
        <TabsContent value="instructions" className="space-y-4">
          {isLead ? (
            // Lead sees customer contact
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-1">{customerName}</p>
                  <p className="text-sm text-muted-foreground">{customerPhone}</p>
                  <p className="text-sm text-muted-foreground mt-2">{jobAddress}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate(jobAddress)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate to Job Site
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Crew sees Lead's instructions
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions from Lead Pro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leadPro && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={leadPro.avatar} />
                        <AvatarFallback>{leadPro.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{leadPro.name}</p>
                        <p className="text-sm text-muted-foreground">Lead Pro</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      {currentPhase
                        ? `Currently working on: ${currentPhase.name}`
                        : 'Waiting for phase assignment'}
                    </p>
                  </div>
                )}
                <Button className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Lead Pro
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate(jobAddress)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate to Job Site
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

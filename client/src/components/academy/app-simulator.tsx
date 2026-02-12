import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, MapPin, Video, PenTool, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  {
    id: "accept",
    title: "Accept the Job",
    instruction: "A new job just popped up! Tap to claim it before someone else does.",
    why: "Speed matters. The faster you accept, the higher your algorithm score.",
    actionLabel: "Accept Job ($50)",
    icon: CheckCircle,
  },
  {
    id: "en_route",
    title: "Start Navigation",
    instruction: "You are getting in the truck. Let the customer know you are coming.",
    why: "This sends an automatic SMS to the customer so they don't call you asking 'Where are you?'",
    actionLabel: "Slide to 'En Route'",
    icon: MapPin,
  },
  {
    id: "arrive",
    title: "The Arrival",
    instruction: "You pulled into the driveway. Clock in.",
    why: "This starts the 'On-Site Timer'. If the customer makes you wait, you get paid for wait time.",
    actionLabel: "I've Arrived",
    icon: MapPin,
  },
  {
    id: "evidence",
    title: "Liability Protection",
    instruction: "Before you touch ANYTHING, take a photo of the pile.",
    why: "If the customer claims you scratched the wall behind the junk, this photo proves the scratch was already there.",
    actionLabel: "[Mock] Upload Before Photo",
    icon: Camera,
  },
  {
    id: "manifest",
    title: "The Video Scan",
    instruction: "Walk around the item and narrate any damage.",
    why: "This builds the 'Virtual Warehouse' so we can resell items for you.",
    actionLabel: "[Mock] Record 5s Video",
    icon: Video,
  },
  {
    id: "sign",
    title: "The Digital Handshake",
    instruction: "Job done? Get the signature.",
    why: "No Signature = No Payment. This stops chargebacks dead.",
    actionLabel: "[Mock] Collect Signature",
    icon: PenTool,
  },
];

interface AppSimulatorProps {
  onComplete: () => void;
}

export function AppSimulator({ onComplete }: AppSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleStep = () => {
    toast({
      title: "Correct!",
      description: STEPS[currentStep].why,
      duration: 3000,
    });

    if (currentStep < STEPS.length - 1) {
      timersRef.current.push(setTimeout(() => setCurrentStep((c) => c + 1), 1000));
    } else {
      timersRef.current.push(setTimeout(() => setIsComplete(true), 1000));
    }
  };

  if (isComplete) {
    return (
      <Card className="max-w-md mx-auto" data-testid="card-simulator-complete">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold" data-testid="text-simulator-hired">
            You&apos;re Hired!
          </h2>
          <p className="text-muted-foreground">
            You have mastered the UpTend OS. Your account is now <strong>Active</strong>.
          </p>

          <Card>
            <CardContent className="p-4 text-left space-y-2">
              <p className="font-bold text-sm text-muted-foreground uppercase">Your Starting Stats:</p>
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" /> Safety Rating
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">5.0</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> Algorithm Score
                </span>
                <Badge variant="secondary">ROOKIE</Badge>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full font-bold text-lg"
            onClick={onComplete}
            data-testid="button-simulator-go"
          >
            Go to Mission Control
          </Button>
        </CardContent>
      </Card>
    );
  }

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Card className="max-w-md mx-auto" data-testid="card-app-simulator">
      <div className="bg-blue-600 dark:bg-blue-700 p-4 text-white flex justify-between items-center gap-4 rounded-t-lg">
        <span className="font-bold" data-testid="text-simulator-mode">PRACTICE MODE</span>
        <Badge variant="secondary" data-testid="badge-simulator-step">
          Step {currentStep + 1} of {STEPS.length}
        </Badge>
      </div>

      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <StepIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold" data-testid="text-simulator-step-title">
            {step.title}
          </h3>
          <p className="text-lg text-muted-foreground font-medium" data-testid="text-simulator-instruction">
            &ldquo;{step.instruction}&rdquo;
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <span className="font-bold block mb-1 text-sm text-yellow-700 dark:text-yellow-400">
              Why do we do this?
            </span>
            <p className="text-sm text-muted-foreground" data-testid="text-simulator-why">
              {step.why}
            </p>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full font-bold text-lg"
          onClick={handleStep}
          data-testid="button-simulator-action"
        >
          {step.actionLabel}
        </Button>
      </CardContent>

      <div className="h-2 bg-muted w-full rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
          data-testid="progress-simulator"
        />
      </div>
    </Card>
  );
}

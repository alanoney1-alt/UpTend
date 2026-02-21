import { useEffect, useState } from 'react';
import wsService from '../services/websocket';

interface JobStatus {
  status: string;
  proLocation: { lat: number; lng: number } | null;
  eta: string | null;
}

export function useJobUpdates(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'pending',
    proLocation: null,
    eta: null,
  });

  useEffect(() => {
    if (!jobId) return;

    const unsubStatus = wsService.subscribe('job_status_update', (payload) => {
      if (payload.jobId === jobId) {
        setJobStatus((prev) => ({
          ...prev,
          status: payload.status ?? prev.status,
          eta: payload.eta ?? prev.eta,
        }));
      }
    });

    const unsubLocation = wsService.subscribe('pro_location', (payload) => {
      if (payload.jobId === jobId) {
        setJobStatus((prev) => ({
          ...prev,
          proLocation: { lat: payload.lat, lng: payload.lng },
        }));
      }
    });

    return () => {
      unsubStatus();
      unsubLocation();
    };
  }, [jobId]);

  return jobStatus;
}

export default useJobUpdates;

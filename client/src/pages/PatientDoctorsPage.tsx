import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX } from 'react';
import {
  createMyDoctorAccessCode,
  listMyDoctorAccess,
  revokeMyDoctorAccess,
} from '../api/patientApi';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';

export function PatientDoctorsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const accessQuery = useQuery({
    queryKey: ['patient-doctor-access'],
    queryFn: () => listMyDoctorAccess(accessToken!),
    enabled: Boolean(accessToken),
  });
  const accessCodeMutation = useMutation({
    mutationFn: () => createMyDoctorAccessCode(accessToken!),
  });
  const revokeMutation = useMutation({
    mutationFn: (doctorId: string) => revokeMyDoctorAccess(accessToken!, doctorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient-doctor-access'] }),
  });

  function handleRevoke(doctorId: string, doctorName: string): void {
    if (
      window.confirm(
        `Revoking access means ${doctorName} will no longer be able to access your health records.`,
      )
    ) {
      revokeMutation.mutate(doctorId);
    }
  }

  return (
    <PagePlaceholder
      eyebrow="Patient workspace"
      title="My Doctors"
      description="Review which doctors can access your health records."
    >
      <Card className="doctor-invite-card">
        <div>
          <strong>Connect a doctor</strong>
          <span>
            Generate a code to share with your doctor. Sharing it does not grant access
            automatically.
          </span>
        </div>
        {accessCodeMutation.data?.code ? (
          <div className="doctor-access-code">
            <strong>{accessCodeMutation.data.code}</strong>
            <span>Share this code with your doctor.</span>
          </div>
        ) : (
          <Button
            onClick={() => accessCodeMutation.mutate()}
            disabled={accessCodeMutation.isPending}
          >
            {accessCodeMutation.isPending ? 'Generating...' : '+ Connect Doctor'}
          </Button>
        )}
        {accessCodeMutation.isError && (
          <p className="form-error">Unable to generate a doctor access code.</p>
        )}
      </Card>
      {accessQuery.isPending && <p className="muted">Loading doctor access...</p>}
      {accessQuery.isError && <p className="form-error">Unable to load doctor access.</p>}
      {accessQuery.data?.access.length === 0 && (
        <Card className="empty-state">
          <strong>No doctors connected</strong>
          <span>Doctor connections will appear here when access is granted.</span>
        </Card>
      )}
      {accessQuery.data?.access.map((entry) => (
        <Card className="doctor-access-card" key={entry._id}>
          <span className="doctor-access-icon">👨‍⚕️</span>
          <div>
            <strong>{entry.doctorId.name}</strong>
            <span>General Physician</span>
            <span>Access: {entry.status === 'active' ? 'Active' : 'Revoked'}</span>
          </div>
          {entry.status === 'active' && (
            <Button
              variant="secondary"
              onClick={() => handleRevoke(entry.doctorId._id, entry.doctorId.name)}
              disabled={revokeMutation.isPending}
            >
              Revoke Access
            </Button>
          )}
        </Card>
      ))}
    </PagePlaceholder>
  );
}

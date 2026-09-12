import { type JSX } from 'react';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function ProfilePage(): JSX.Element {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  return (
    <PagePlaceholder
      eyebrow={isPatient ? 'Patient workspace' : 'Account'}
      title={isPatient ? 'Patient Profile' : 'Profile'}
      description={
        isPatient
          ? 'Review your personal and recorded health information.'
          : 'Manage your development workspace identity and preferences.'
      }
    >
      <Card className="profile-card profile-sections">
        <h2>Personal Information</h2>
        <strong>{user?.name ?? 'Account holder'}</strong>
        <span>{user?.email ?? 'Email not available'}</span>
        {isPatient && (
          <>
            <h2>Emergency Contact</h2>
            <span>Not recorded</span>
            <h2>Health Information</h2>
            <span>Blood group: Recorded from medical records</span>
            <span>Allergies: See My Health Records</span>
          </>
        )}
      </Card>
    </PagePlaceholder>
  );
}

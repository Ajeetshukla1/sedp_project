import { useQuery } from '@tanstack/react-query';
import { type JSX } from 'react';
import { listPatients } from '../api/patientApi';
import { listReports } from '../api/reportApi';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';

export function PatientNotificationsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const patientQuery = useQuery({
    queryKey: ['patient-notification-owner'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken),
  });
  const patientId = patientQuery.data?.patients[0]?._id;
  const reportsQuery = useQuery({
    queryKey: ['patient-notifications-reports', patientId],
    queryFn: () => listReports(accessToken!, patientId!),
    enabled: Boolean(accessToken && patientId),
  });
  const reports = reportsQuery.data?.reports ?? [];

  return (
    <PagePlaceholder
      eyebrow="Patient workspace"
      title="Notifications"
      description="Updates about your reports and health records."
    >
      {reportsQuery.isPending && <p className="muted">Loading notifications...</p>}
      {!reportsQuery.isPending && reports.length === 0 && (
        <Card className="empty-state">
          <strong>You&apos;re all caught up</strong>
          <span>New report and record updates will appear here.</span>
        </Card>
      )}
      {reports.map((report) => (
        <Card className="notification-card" key={report._id}>
          <span className="notification-icon">
            {report.processingStatus === 'failed' ? '⚠️' : '✓'}
          </span>
          <div>
            <strong>
              {report.processingStatus === 'processed'
                ? 'Your report has been processed.'
                : report.processingStatus === 'failed'
                  ? 'Your uploaded report could not be processed.'
                  : 'Your report is being processed.'}
            </strong>
            <span>{report.documentId.originalFileName}</span>
          </div>
        </Card>
      ))}
    </PagePlaceholder>
  );
}

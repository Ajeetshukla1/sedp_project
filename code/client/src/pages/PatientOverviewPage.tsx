import { useQuery } from '@tanstack/react-query';
import { type JSX } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPatient,
  listMedicalRecords,
  getPatientTimeline,
  type Allergy,
  type Condition,
  type Medication,
  type Observation,
} from '../api/patientApi';
import { useAuth } from '../hooks/useAuth';
import { listPatients } from '../api/patientApi';
import { listReports } from '../api/reportApi';
import { Card } from '../components/ui/Card';
import { PagePlaceholder } from './PagePlaceholder';
export function PatientOverviewPage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken, user } = useAuth();
  const patientListQuery = useQuery({
    queryKey: ['patient-self-record'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'patient' && !patientId),
  });
  const resolvedPatientId = patientId ?? patientListQuery.data?.patients[0]?._id;
  const patientQuery = useQuery({
    queryKey: ['patient', resolvedPatientId],
    queryFn: () => getPatient(accessToken!, resolvedPatientId!),
    enabled: Boolean(accessToken && resolvedPatientId),
  });
  const recordsQuery = useQuery({
    queryKey: ['patient-records', resolvedPatientId],
    queryFn: async () =>
      Promise.all([
        listMedicalRecords<{ conditions: Condition[] }>(
          accessToken!,
          resolvedPatientId!,
          'conditions',
        ),
        listMedicalRecords<{ allergies: Allergy[] }>(accessToken!, resolvedPatientId!, 'allergies'),
        listMedicalRecords<{ medications: Medication[] }>(
          accessToken!,
          resolvedPatientId!,
          'medications',
        ),
        listMedicalRecords<{ observations: Observation[] }>(
          accessToken!,
          resolvedPatientId!,
          'observations',
        ),
      ]),
    enabled: Boolean(accessToken && resolvedPatientId),
  });
  const timelineQuery = useQuery({
    queryKey: ['patient-timeline', resolvedPatientId],
    queryFn: () => getPatientTimeline(accessToken!, resolvedPatientId!),
    enabled: Boolean(accessToken && resolvedPatientId),
  });
  const reportsQuery = useQuery({
    queryKey: ['patient-record-reports', resolvedPatientId],
    queryFn: () => listReports(accessToken!, resolvedPatientId!),
    enabled: Boolean(accessToken && resolvedPatientId),
  });

  if (patientListQuery.isPending || patientQuery.isPending)
    return <p className="muted">Loading patient...</p>;
  if (patientQuery.isError || recordsQuery.isError || !patientQuery.data)
    return <p className="form-error">Unable to load this patient.</p>;
  const { patient } = patientQuery.data;
  const records = recordsQuery.data;

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="My Health Records"
      description={`${patient.patientCode} · ${patient.sex} · Born ${new Date(patient.dateOfBirth).toLocaleDateString()}`}
      action={{ label: 'View reports', to: 'reports' }}
    >
      <Card className="profile-card">
        <strong>
          {patient.firstName} {patient.lastName}
        </strong>
        <span>
          {patient.contact?.email ?? patient.contact?.phone ?? 'No contact information recorded'}
        </span>
      </Card>
      {records && (
        <>
          <h2 className="record-section-title">Medical History</h2>
          <div className="record-grid">
            <Card>
              <strong>Conditions</strong>
              <span>
                {records[0].conditions.map((condition) => condition.name).join(' · ') ||
                  'None recorded'}
              </span>
            </Card>
            <Card>
              <strong>Allergies</strong>
              <span>
                {records[1].allergies.map((allergy) => allergy.substance).join(' · ') ||
                  'None recorded'}
              </span>
            </Card>
            <Card>
              <strong>Family and lifestyle</strong>
              <span>Information not recorded</span>
            </Card>
            <Card>
              <strong>Past surgeries</strong>
              <span>None recorded</span>
            </Card>
          </div>
          <h2 className="record-section-title">Medical Events</h2>
          <div className="record-grid">
            <Card>
              <strong>Consultations</strong>
              <span>
                {timelineQuery.data?.events.filter((event) => event.type === 'encounter').length ??
                  0}
              </span>
            </Card>
            <Card>
              <strong>Diagnoses</strong>
              <span>{records[0].conditions.length}</span>
            </Card>
            <Card>
              <strong>Procedures</strong>
              <span>Recorded in timeline</span>
            </Card>
          </div>
          <h2 className="record-section-title">Documents</h2>
          <div className="record-grid">
            {(reportsQuery.data?.reports ?? []).slice(0, 4).map((report) => (
              <Card key={report._id}>
                <strong>🧪 {report.documentId.originalFileName}</strong>
                <span>{report.reportType}</span>
              </Card>
            ))}
            {reportsQuery.data?.reports.length === 0 && (
              <Card>
                <span>No documents uploaded.</span>
              </Card>
            )}
          </div>
        </>
      )}
      {timelineQuery.data && timelineQuery.data.conflicts.length > 0 && (
        <Card className="notice-panel">
          <strong>{timelineQuery.data.conflicts.length} record conflict(s) need review</strong>
          {timelineQuery.data.conflicts.map((conflict) => (
            <span key={`${conflict.type}-${conflict.evidenceIds.join('-')}`}>
              {conflict.message} · Evidence: {conflict.evidenceIds.join(', ')}
            </span>
          ))}
        </Card>
      )}
    </PagePlaceholder>
  );
}

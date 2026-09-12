import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { createAISummary, listAISummaries, type CitedStatement } from '../api/aiApi';
import {
  getPatientTimeline,
  listMedicalRecords,
  listPatients,
  type Allergy,
  type Condition,
  type Medication,
} from '../api/patientApi';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function PatientAIPage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken, user } = useAuth();
  const patientListQuery = useQuery({
    queryKey: ['patient-self-ai'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'patient' && !patientId),
  });
  const resolvedPatientId = patientId ?? patientListQuery.data?.patients[0]?._id;
  const queryClient = useQueryClient();
  const summariesQuery = useQuery({
    queryKey: ['patient-ai-summaries', resolvedPatientId],
    queryFn: () => listAISummaries(accessToken!, resolvedPatientId!),
    enabled: Boolean(accessToken && resolvedPatientId && user?.role !== 'patient'),
  });
  const generateMutation = useMutation({
    mutationFn: () => createAISummary(accessToken!, resolvedPatientId!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['patient-ai-summaries', resolvedPatientId] }),
  });
  const patientRecordsQuery = useQuery({
    queryKey: ['patient-ai-records', resolvedPatientId],
    queryFn: () =>
      Promise.all([
        listMedicalRecords<{ conditions: Condition[] }>(
          accessToken!,
          resolvedPatientId!,
          'conditions',
        ),
        listMedicalRecords<{ medications: Medication[] }>(
          accessToken!,
          resolvedPatientId!,
          'medications',
        ),
        listMedicalRecords<{ allergies: Allergy[] }>(accessToken!, resolvedPatientId!, 'allergies'),
        getPatientTimeline(accessToken!, resolvedPatientId!),
      ]),
    enabled: Boolean(accessToken && resolvedPatientId && user?.role === 'patient'),
  });
  const latest = summariesQuery.data?.summaries[0];
  const sections: Array<[string, CitedStatement[]]> = latest?.summary
    ? [
        ['Overview', latest.summary.overview],
        ['Relevant history', latest.summary.relevantHistory],
        ['Current conditions', latest.summary.currentConditions],
        ['Medications', latest.summary.medications],
        ['Allergies', latest.summary.allergies],
        ['Recent investigations', latest.summary.recentInvestigations],
        ['Important changes', latest.summary.importantChanges],
        ['Trends', latest.summary.trends],
        ['Conflicts and missing information', latest.summary.conflictsMissingInformation],
      ]
    : [];

  if (user?.role === 'patient') {
    const patientRecords = patientRecordsQuery.data;
    const conditions = patientRecords?.[0].conditions ?? [];
    const medications = patientRecords?.[1].medications ?? [];
    const allergies = patientRecords?.[2].allergies ?? [];
    const latestEvent = patientRecords?.[3].events[0];
    return (
      <PagePlaceholder
        eyebrow="Patient record"
        title="Your Health Summary"
        description="Recent health information in plain language."
      >
        <Card className="patient-ai-card">
          <h2>Recent health information</h2>
          <ul className="patient-summary-list">
            <li>
              Your records currently include {conditions.length} condition
              {conditions.length === 1 ? '' : 's'}.
            </li>
            <li>
              {latestEvent
                ? `Your latest record was ${latestEvent.title.toLowerCase()} on ${new Date(latestEvent.occurredAt).toLocaleDateString()}.`
                : 'Your latest health records will appear here.'}
            </li>
            <li>
              You currently have {medications.length} medication
              {medications.length === 1 ? '' : 's'} recorded.
            </li>
            <li>
              Your records contain {allergies.length} allergy entr
              {allergies.length === 1 ? 'y' : 'ies'}.
            </li>
          </ul>
          <Link className="text-link" to={resolvedPatientId ? `/patient/records` : '/dashboard'}>
            View supporting records <ArrowRight size={15} />
          </Link>
        </Card>
      </PagePlaceholder>
    );
  }

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="AI summary"
      description="A structured summary of documented records, trends, conflicts, and missing information."
    >
      <Card className="notice-panel">
        <Badge tone="gold">Clinician review required</Badge>
        <p>This feature is informational and is not a diagnostic or treatment engine.</p>
      </Card>
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Generating summary...' : 'Generate summary'}
        </Button>
      )}
      {summariesQuery.isPending && <p className="muted">Loading summaries...</p>}
      {summariesQuery.isError && <p className="form-error">Unable to load summaries.</p>}
      {generateMutation.isError && (
        <p className="form-error">
          AI summarization is currently unavailable or failed validation.
        </p>
      )}
      {latest?.status === 'failed' && (
        <Card className="notice-panel">
          <strong>Summary unavailable</strong>
          <span>This does not affect access to the patient record.</span>
        </Card>
      )}
      {latest?.status === 'completed' &&
        latest.summary &&
        sections.map(
          ([title, statements]) =>
            statements.length > 0 && (
              <Card key={title}>
                <strong>{title}</strong>
                {statements.map((statement) => (
                  <p
                    className="summary-statement"
                    key={`${statement.text}-${statement.sourceIds.join('-')}`}
                  >
                    {statement.text} <small>Evidence: {statement.sourceIds.join(', ')}</small>
                  </p>
                ))}
              </Card>
            ),
        )}
      {summariesQuery.isSuccess && summariesQuery.data.summaries.length === 0 && (
        <p className="muted">No summary has been generated yet.</p>
      )}
    </PagePlaceholder>
  );
}

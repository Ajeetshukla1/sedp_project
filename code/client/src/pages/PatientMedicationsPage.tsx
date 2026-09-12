import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type JSX } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import {
  createMedicalRecord,
  listMedicalRecords,
  listPatients,
  type Medication,
} from '../api/patientApi';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function PatientMedicationsPage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken, user } = useAuth();
  const patientListQuery = useQuery({
    queryKey: ['patient-self-medications'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'patient' && !patientId),
  });
  const resolvedPatientId = patientId ?? patientListQuery.data?.patients[0]?._id;
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [status, setStatus] = useState<Medication['status']>('active');
  const medicationsQuery = useQuery({
    queryKey: ['patient-medications', resolvedPatientId],
    queryFn: () =>
      listMedicalRecords<{ medications: Medication[] }>(
        accessToken!,
        resolvedPatientId!,
        'medications',
      ),
    enabled: Boolean(accessToken && resolvedPatientId),
  });
  const createMutation = useMutation({
    mutationFn: () =>
      createMedicalRecord(accessToken!, resolvedPatientId!, 'medications', {
        name,
        dosage,
        status,
      }),
    onSuccess: async () => {
      setName('');
      setDosage('');
      await queryClient.invalidateQueries({ queryKey: ['patient-medications', resolvedPatientId] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="Medications"
      description="Your current and previous medications from recorded health documents."
    >
      <Card className="notice-panel medication-notice">
        <strong>Medication information is based on your recorded health documents.</strong>
        <span>Do not change medication without consulting your doctor.</span>
      </Card>
      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <Card>
          <form className="form-stack compact-form" onSubmit={handleSubmit}>
            <label>
              Medication name
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Dosage
              <Input
                value={dosage}
                onChange={(event) => setDosage(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Medication['status'])}
              >
                <option value="active">Active</option>
                <option value="discontinued">Discontinued</option>
                <option value="completed">Completed</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            {createMutation.isError && <p className="form-error">Unable to save medication.</p>}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Add medication'}
            </Button>
          </form>
        </Card>
      )}
      {medicationsQuery.isPending && <p className="muted">Loading medications...</p>}
      {medicationsQuery.isError && <p className="form-error">Unable to load medications.</p>}
      {medicationsQuery.isSuccess && medicationsQuery.data.medications.length === 0 && (
        <p className="muted">No medications recorded.</p>
      )}
      {medicationsQuery.isSuccess && (
        <>
          <h2 className="record-section-title">Current medications</h2>
          {medicationsQuery.data.medications
            .filter((medication) => medication.status === 'active')
            .map((medication) => (
              <MedicationCard medication={medication} key={medication._id} />
            ))}
          <h2 className="record-section-title">Previous medications</h2>
          {medicationsQuery.data.medications
            .filter((medication) => medication.status !== 'active')
            .map((medication) => (
              <MedicationCard medication={medication} key={medication._id} />
            ))}
        </>
      )}
    </PagePlaceholder>
  );
}

function MedicationCard({ medication }: { medication: Medication }): JSX.Element {
  return (
    <Card className="medication-card">
      <strong>{medication.name}</strong>
      <span>{medication.dosage ?? 'Dosage not recorded'}</span>
      <span>{medication.frequency ?? 'Frequency not recorded'}</span>
      <span>
        Started: {medication.status === 'active' ? 'Currently recorded' : 'Previous record'}
      </span>
      <span>Status: {medication.status}</span>
    </Card>
  );
}

import { useState, type JSX } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { PagePlaceholder } from './PagePlaceholder';
import { useAuth } from '../hooks/useAuth';
import { listPatients } from '../api/patientApi';

export function PatientsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState('');
  const patientsQuery = useQuery({
    queryKey: ['patients', search],
    queryFn: () => listPatients(accessToken!, search),
    enabled: Boolean(accessToken),
  });

  return (
    <PagePlaceholder
      eyebrow="Directory"
      title="Patients"
      description="The patients you are authorized to access will appear here."
    >
      <Card className="toolbar">
        <Search size={18} />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patients"
          aria-label="Search patients"
        />
      </Card>
      <Card>
        {patientsQuery.isPending && <p className="muted">Loading patients...</p>}
        {patientsQuery.isError && <p className="form-error">Unable to load patients.</p>}
        {patientsQuery.isSuccess && patientsQuery.data.patients.length === 0 && (
          <EmptyState title="No patients found">
            Create or authorize a patient to see records here.
          </EmptyState>
        )}
        {patientsQuery.isSuccess && patientsQuery.data.patients.length > 0 && (
          <div className="patient-list">
            {patientsQuery.data.patients.map((patient) => (
              <Link className="patient-row" to={`/patients/${patient._id}`} key={patient._id}>
                <strong>
                  {patient.firstName} {patient.lastName}
                </strong>
                <span>{patient.patientCode}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PagePlaceholder>
  );
}

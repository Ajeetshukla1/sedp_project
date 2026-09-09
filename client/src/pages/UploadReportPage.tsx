import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadReport } from '../api/reportApi';
import { listPatients } from '../api/patientApi';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function UploadReportPage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken, user } = useAuth();
  const patientListQuery = useQuery({
    queryKey: ['patient-self-upload'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'patient' && !patientId),
  });
  const resolvedPatientId = patientId ?? patientListQuery.data?.patients[0]?._id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('Lab report');
  const [clinicalEventDate, setClinicalEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const uploadMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('reportType', reportType);
      formData.append('clinicalEventDate', clinicalEventDate);
      formData.append('notes', notes);
      return uploadReport(accessToken!, resolvedPatientId!, formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patient-reports', resolvedPatientId] });
      navigate(user?.role === 'patient' ? '/patient/reports' : '../reports');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (file && clinicalEventDate && resolvedPatientId) uploadMutation.mutate();
  }

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="Upload report"
      description="Upload a PDF or image report for this patient."
    >
      <Card>
        <form className="form-stack compact-form" onSubmit={handleSubmit}>
          <label>
            Report file
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <label>
            Report type
            <Input
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              required
            />
          </label>
          <label>
            Clinical event date
            <Input
              type="date"
              value={clinicalEventDate}
              onChange={(event) => setClinicalEventDate(event.target.value)}
              required
            />
          </label>
          <label>
            Notes
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional"
            />
          </label>
          {uploadMutation.isError && (
            <p className="form-error">
              Unable to upload this report. Check the file type, size, and metadata.
            </p>
          )}
          <Button type="submit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload report'}
          </Button>
        </form>
      </Card>
    </PagePlaceholder>
  );
}

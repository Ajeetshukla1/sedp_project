import { useQuery } from '@tanstack/react-query';
import { useState, type JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { downloadReport, listReports } from '../api/reportApi';
import { listPatients } from '../api/patientApi';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function PatientReportsPage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken, user } = useAuth();
  const patientListQuery = useQuery({
    queryKey: ['patient-self-reports'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken && user?.role === 'patient' && !patientId),
  });
  const resolvedPatientId = patientId ?? patientListQuery.data?.patients[0]?._id;
  const [downloadError, setDownloadError] = useState('');
  const [search, setSearch] = useState('');
  const reportsQuery = useQuery({
    queryKey: ['patient-reports', resolvedPatientId],
    queryFn: () => listReports(accessToken!, resolvedPatientId!),
    enabled: Boolean(accessToken && resolvedPatientId),
  });
  const reports = reportsQuery.data?.reports.filter((report) =>
    `${report.reportType} ${report.documentId.originalFileName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  async function handleDownload(reportId: string, fileName: string): Promise<void> {
    setDownloadError('');
    try {
      const blob = await downloadReport(accessToken!, resolvedPatientId!, reportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Unable to download this report.');
    }
  }

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="Medical Reports"
      description="Keep your blood tests, prescriptions, and medical documents together."
    >
      <div className="report-toolbar">
        <Input
          placeholder="Search reports"
          aria-label="Search reports"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Link
          className="button button-primary"
          to={user?.role === 'patient' ? '/patient/reports/upload' : 'upload'}
        >
          + Upload Report
        </Link>
      </div>
      {reportsQuery.isPending && <p className="muted">Loading reports...</p>}
      {reportsQuery.isError && <p className="form-error">Unable to load reports.</p>}
      {downloadError && <p className="form-error">{downloadError}</p>}
      {reportsQuery.isSuccess && reports?.length === 0 && (
        <p className="muted">No reports uploaded.</p>
      )}
      {reportsQuery.isSuccess &&
        reports?.map((report) => (
          <Card className="report-card" key={report._id}>
            <div>
              <strong>🧪 {report.reportType}</strong>
              <time>{formatReportDate(report.clinicalEventDate)}</time>
              <strong>{report.documentId.originalFileName}</strong>
              <span>
                {report.reportType} · {report.processingStatus}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => void handleDownload(report._id, report.documentId.originalFileName)}
            >
              Download
            </Button>
          </Card>
        ))}
    </PagePlaceholder>
  );
}

function formatReportDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

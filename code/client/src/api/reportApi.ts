import { http } from './http';

export type MedicalReport = {
  _id: string;
  reportType: string;
  clinicalEventDate: string;
  processingStatus: 'uploaded' | 'processing' | 'processed' | 'failed';
  documentId: {
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    extractionStatus: string;
  };
};

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listReports(
  accessToken: string,
  patientId: string,
): Promise<{ reports: MedicalReport[] }> {
  return http<{ reports: MedicalReport[] }>(`/patients/${patientId}/reports`, {
    headers: authHeaders(accessToken),
  });
}

export function uploadReport(
  accessToken: string,
  patientId: string,
  formData: FormData,
): Promise<{ report: MedicalReport }> {
  return http<{ report: MedicalReport }>(`/patients/${patientId}/reports`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: formData,
  });
}

export async function downloadReport(
  accessToken: string,
  patientId: string,
  reportId: string,
): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'}/patients/${patientId}/reports/${reportId}`,
    { headers: authHeaders(accessToken), credentials: 'include' },
  );
  if (!response.ok) throw new Error('Unable to download report');
  return response.blob();
}

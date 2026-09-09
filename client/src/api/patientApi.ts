import { http } from './http';

export type Patient = {
  _id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'female' | 'male' | 'intersex' | 'unknown';
  contact?: { phone?: string; email?: string; address?: string };
};
export type Condition = { _id: string; name: string; status: 'active' | 'resolved' | 'unknown' };
export type Medication = {
  _id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  status: 'active' | 'discontinued' | 'completed' | 'unknown';
};
export type Allergy = {
  _id: string;
  substance: string;
  reaction?: string;
  status: 'active' | 'resolved' | 'unknown';
};
export type Observation = {
  _id: string;
  normalizedName: string;
  value: number;
  unit: string;
  observedAt: string;
};
export type TimelineEvent = {
  id: string;
  type: string;
  occurredAt: string;
  title: string;
  detail: string;
  sourceIds?: string[];
};
export type PatientTimeline = {
  events: TimelineEvent[];
  trends: Array<{
    normalizedName: string;
    unit: string | null;
    category: string;
    evidenceIds: string[];
  }>;
  conflicts: Array<{ type: string; message: string; evidenceIds: string[] }>;
};
export type DoctorAccess = {
  _id: string;
  doctorId: { _id: string; name: string; email: string };
  status: 'active' | 'revoked';
  grantedAt: string;
};

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listPatients(
  accessToken: string,
  search?: string,
): Promise<{ patients: Patient[] }> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return http<{ patients: Patient[] }>(`/patients${query}`, { headers: authHeaders(accessToken) });
}

export function getPatient(accessToken: string, patientId: string): Promise<{ patient: Patient }> {
  return http<{ patient: Patient }>(`/patients/${patientId}`, {
    headers: authHeaders(accessToken),
  });
}

export function listMedicalRecords<T>(
  accessToken: string,
  patientId: string,
  resource: string,
): Promise<T> {
  return http<T>(`/patients/${patientId}/${resource}`, { headers: authHeaders(accessToken) });
}

export function createMedicalRecord<TInput, TResponse>(
  accessToken: string,
  patientId: string,
  resource: string,
  input: TInput,
): Promise<TResponse> {
  return http<TResponse>(`/patients/${patientId}/${resource}`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
}

export function getPatientTimeline(
  accessToken: string,
  patientId: string,
): Promise<PatientTimeline> {
  return http<PatientTimeline>(`/patients/${patientId}/timeline`, {
    headers: authHeaders(accessToken),
  });
}

export function listMyDoctorAccess(accessToken: string): Promise<{ access: DoctorAccess[] }> {
  return http<{ access: DoctorAccess[] }>('/patients/me/access', {
    headers: authHeaders(accessToken),
  });
}

export function revokeMyDoctorAccess(accessToken: string, doctorId: string): Promise<void> {
  return http<void>(`/patients/me/access/${doctorId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
}

export function createMyDoctorAccessCode(accessToken: string): Promise<{ code: string }> {
  return http<{ code: string }>('/patients/me/access-code', {
    method: 'POST',
    headers: authHeaders(accessToken),
  });
}

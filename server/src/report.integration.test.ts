import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { Document } from './models/Document.js';
import { DoctorPatientAccess } from './models/DoctorPatientAccess.js';
import { MedicalReport } from './models/MedicalReport.js';
import { Observation } from './models/Observation.js';
import { Patient } from './models/Patient.js';
import { User } from './models/User.js';

describe('medical report API', () => {
  let server: Server;
  let baseUrl: string;
  let patientId: string;
  const password = 'test-password-123';
  const doctorEmail = `report-doctor-${Date.now()}@example.com`;
  const otherDoctorEmail = `report-other-doctor-${Date.now()}@example.com`;

  function syntheticPdf(): string {
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      '<< /Length 67 >>\nstream\nBT /F1 12 Tf 72 720 Td (Glucose: 92 mg/dL Reference: 70-100) Tj ET\nendstream',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
      .slice(1)
      .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `)
      .join(
        '\n',
      )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  beforeAll(async () => {
    await connectDatabase();
    server = createApp().listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await MedicalReport.deleteMany({ patientId });
    await Document.deleteMany({ patientId });
    await DoctorPatientAccess.deleteMany({ patientId });
    if (patientId) await Patient.deleteOne({ _id: patientId });
    await User.deleteMany({ email: { $in: [doctorEmail, otherDoctorEmail] } });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await mongoose.disconnect();
  });

  async function registerDoctor(email: string): Promise<string> {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Report Doctor', email, password, role: 'doctor' }),
    });
    const result = (await response.json()) as { user: { id: string } };
    await User.updateOne({ _id: result.user.id }, { $set: { role: 'doctor' } });
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'doctor' }),
    });
    return ((await loginResponse.json()) as { accessToken: string }).accessToken;
  }

  it('uploads and protects synthetic report files', async () => {
    const doctorToken = await registerDoctor(doctorEmail);
    const otherDoctorToken = await registerDoctor(otherDoctorEmail);
    const patientResponse = await fetch(`${baseUrl}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        firstName: 'Report',
        lastName: 'Patient',
        dateOfBirth: '1992-03-04',
        sex: 'unknown',
      }),
    });
    patientId = ((await patientResponse.json()) as { patient: { _id: string } }).patient._id;
    assert.equal(patientResponse.status, 201);

    const form = new FormData();
    form.append('reportType', 'Lab report');
    form.append('clinicalEventDate', '2026-08-26');
    form.append('notes', 'Synthetic report');
    form.append(
      'file',
      new Blob([syntheticPdf()], { type: 'application/pdf' }),
      'synthetic-report.pdf',
    );
    const uploadResponse = await fetch(`${baseUrl}/patients/${patientId}/reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: form,
    });
    const uploaded = (await uploadResponse.json()) as {
      report: { _id: string; documentId: string; processingStatus: string };
    };
    assert.equal(uploadResponse.status, 201);
    assert.equal(uploaded.report.processingStatus, 'processed');
    assert.equal(
      await Observation.countDocuments({ patientId, sourceDocumentId: uploaded.report.documentId }),
      1,
    );
    assert.equal(
      (await Document.findById(uploaded.report.documentId))?.extractedText?.includes('Glucose'),
      true,
    );

    const listResponse = await fetch(`${baseUrl}/patients/${patientId}/reports`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const listed = (await listResponse.json()) as { reports: Array<{ _id: string }> };
    assert.equal(listResponse.status, 200);
    assert.equal(listed.reports.length, 1);

    const downloadResponse = await fetch(
      `${baseUrl}/patients/${patientId}/reports/${uploaded.report._id}`,
      { headers: { Authorization: `Bearer ${doctorToken}` } },
    );
    assert.equal(downloadResponse.status, 200);
    assert.equal((await downloadResponse.arrayBuffer()).byteLength > 0, true);

    const forbiddenResponse = await fetch(`${baseUrl}/patients/${patientId}/reports`, {
      headers: { Authorization: `Bearer ${otherDoctorToken}` },
    });
    assert.equal(forbiddenResponse.status, 403);

    const duplicateForm = new FormData();
    duplicateForm.append('reportType', 'Lab report');
    duplicateForm.append('clinicalEventDate', '2026-08-26');
    duplicateForm.append(
      'file',
      new Blob([syntheticPdf()], { type: 'application/pdf' }),
      'duplicate.pdf',
    );
    const duplicateResponse = await fetch(`${baseUrl}/patients/${patientId}/reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: duplicateForm,
    });
    assert.equal(duplicateResponse.status, 409);

    const invalidForm = new FormData();
    invalidForm.append('reportType', 'Unsupported');
    invalidForm.append('clinicalEventDate', '2026-08-26');
    invalidForm.append('file', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt');
    const invalidResponse = await fetch(`${baseUrl}/patients/${patientId}/reports`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: invalidForm,
    });
    assert.equal(invalidResponse.status, 400);

    const deleteResponse = await fetch(
      `${baseUrl}/patients/${patientId}/reports/${uploaded.report._id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${doctorToken}` } },
    );
    assert.equal(deleteResponse.status, 204);
  });
});

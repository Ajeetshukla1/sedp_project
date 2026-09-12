import { type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, FileText, HeartPulse, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  listMedicalRecords,
  listPatients,
  getPatientTimeline,
  type Allergy,
  type Condition,
  type Medication,
  type Observation,
} from '../api/patientApi';
import { listReports } from '../api/reportApi';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export function DashboardPage(): JSX.Element {
  const { accessToken, user } = useAuth();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/health`);
      if (!response.ok) throw new Error('API unavailable');
      return response.json() as Promise<{ status: string }>;
    },
  });
  if (user?.role === 'patient')
    return <PatientDashboard accessToken={accessToken} userName={user.name} />;

  return (
    <PagePlaceholder
      eyebrow="Tuesday, August 25"
      title="Good morning, Dr. Joshi"
      description="A focused view of the care work waiting for you today."
      action={{ label: 'View patients', to: '/patients' }}
    >
      <div className="metric-grid">
        <Card>
          <Users size={20} />
          <strong>0</strong>
          <span>Authorized patients</span>
        </Card>
        <Card>
          <FileText size={20} />
          <strong>0</strong>
          <span>Reports this week</span>
        </Card>
        <Card>
          <Activity size={20} />
          <strong>Ready</strong>
          <span>Workspace status</span>
        </Card>
      </div>
      <Card className="status-panel">
        <div>
          <p className="eyebrow">System status</p>
          <h2>Backend connectivity</h2>
          <p className="muted">
            The Phase 1 health endpoint remains available while the application shell is being
            built.
          </p>
        </div>
        {health.isPending ? (
          <Skeleton className="status-skeleton" />
        ) : health.isError ? (
          <ErrorState message="Backend unavailable" />
        ) : (
          <Badge tone="teal">{health.data.status === 'ok' ? 'Connected' : 'Unavailable'}</Badge>
        )}
      </Card>
    </PagePlaceholder>
  );
}

function PatientDashboard({
  accessToken,
  userName,
}: {
  accessToken: string | null;
  userName: string;
}): JSX.Element {
  const patientQuery = useQuery({
    queryKey: ['patient-dashboard-patient'],
    queryFn: () => listPatients(accessToken!),
    enabled: Boolean(accessToken),
  });
  const patient = patientQuery.data?.patients[0];
  const recordsQuery = useQuery({
    queryKey: ['patient-dashboard-records', patient?._id],
    queryFn: async () =>
      Promise.all([
        listMedicalRecords<{ conditions: Condition[] }>(accessToken!, patient!._id, 'conditions'),
        listMedicalRecords<{ medications: Medication[] }>(
          accessToken!,
          patient!._id,
          'medications',
        ),
        listMedicalRecords<{ allergies: Allergy[] }>(accessToken!, patient!._id, 'allergies'),
        listMedicalRecords<{ observations: Observation[] }>(
          accessToken!,
          patient!._id,
          'observations',
        ),
      ]),
    enabled: Boolean(accessToken && patient),
  });
  const timelineQuery = useQuery({
    queryKey: ['patient-dashboard-timeline', patient?._id],
    queryFn: () => getPatientTimeline(accessToken!, patient!._id),
    enabled: Boolean(accessToken && patient),
  });
  const reportsQuery = useQuery({
    queryKey: ['patient-dashboard-reports', patient?._id],
    queryFn: () => listReports(accessToken!, patient!._id),
    enabled: Boolean(accessToken && patient),
  });

  if (patientQuery.isPending) return <p className="muted">Loading your health dashboard...</p>;
  if (patientQuery.isError) return <ErrorState message="Unable to load your patient record." />;
  if (!patient) {
    return (
      <PagePlaceholder
        eyebrow="Patient workspace"
        title={`Welcome, ${userName}.`}
        description="Your patient record has not been created yet."
      >
        <Card className="empty-state">
          <HeartPulse size={24} />
          <strong>Your dashboard is waiting for your record</strong>
          <span>Please contact your care team to finish setting up your health record.</span>
        </Card>
      </PagePlaceholder>
    );
  }

  const records = recordsQuery.data;
  const events = timelineQuery.data?.events.slice(0, 3) ?? [];
  const observations = records?.[3].observations ?? [];
  const encounters = timelineQuery.data?.events.filter((event) => event.type === 'encounter') ?? [];
  const activeConditions =
    records?.[0].conditions.filter((condition) => condition.status === 'active') ?? [];
  const activeMedications =
    records?.[1].medications.filter((medication) => medication.status === 'active') ?? [];
  const allergies = records?.[2].allergies ?? [];
  const recentReports = reportsQuery.data?.reports ?? [];
  const nextVisit = encounters[0];
  const timelineEvents = timelineQuery.data?.events ?? [];
  const hasError = recordsQuery.isError || timelineQuery.isError || reportsQuery.isError;

  return (
    <div className="patient-dashboard page-stack">
      <div className="patient-dashboard-heading">
        <div>
          <h1>
            Good morning, {userName.split(' ')[0]} <span className="wave">👋</span>
          </h1>
          <p className="lede">Here&apos;s your health overview.</p>
        </div>
      </div>
      {hasError && <ErrorState message="Some dashboard data could not be loaded." />}
      <div className="patient-summary-grid">
        <DashboardOverviewCard
          icon="🫀"
          label="Conditions"
          value={`${activeConditions.length} Active`}
          details={activeConditions.map((condition) => condition.name)}
          action="View details"
          to={`/patients/${patient._id}`}
        />
        <DashboardOverviewCard
          icon="💊"
          label="Medications"
          value={`${activeMedications.length} Active`}
          action="View medications"
          to={`/patients/${patient._id}/medications`}
        />
        <DashboardOverviewCard
          icon="⚠️"
          label="Allergies"
          value={`${allergies.length} Recorded`}
          details={allergies.map((allergy) => allergy.substance)}
          action="View details"
          to={`/patients/${patient._id}`}
        />
        <DashboardOverviewCard
          icon="🧪"
          label="Reports"
          value={`${recentReports.length} Recent`}
          action="View reports"
          to={`/patients/${patient._id}/reports`}
        />
        <DashboardOverviewCard
          icon="📅"
          label="Next Visit"
          value={nextVisit ? formatDateLong(nextVisit.occurredAt) : 'No visit scheduled'}
          details={nextVisit ? [nextVisit.detail || nextVisit.title] : []}
          to={`/patients/${patient._id}/timeline`}
        />
      </div>
      <section className="patient-dashboard-section health-timeline-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Health Timeline</h2>
            <p className="timeline-intro">Your healthcare journey in one place.</p>
          </div>
          <Link className="text-link" to={`/patients/${patient._id}/timeline`}>
            View full timeline <ArrowRight size={15} />
          </Link>
        </div>
        <Card className="health-timeline-card">
          {timelineQuery.isPending ? (
            <Skeleton className="dashboard-list-skeleton" />
          ) : timelineEvents.length === 0 ? (
            <p className="muted">Your health history will appear here as records are added.</p>
          ) : (
            <HealthTimeline events={timelineEvents} />
          )}
        </Card>
      </section>
      <section className="patient-dashboard-section">
        <div className="dashboard-section-heading">
          <h2>Recent Health Activity</h2>
          <Link className="text-link" to={`/patients/${patient._id}/timeline`}>
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <Card className="dashboard-activity-panel">
          {timelineQuery.isPending ? (
            <Skeleton className="dashboard-list-skeleton" />
          ) : events.length === 0 ? (
            <p className="muted">No recent activity recorded.</p>
          ) : (
            <div className="dashboard-activity-list">
              {events.map((event) => (
                <div className="dashboard-activity-row" key={`${event.type}-${event.id}`}>
                  <span className="activity-icon">{event.type === 'report' ? '🧪' : '🧑‍⚕️'}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                  <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
      <section className="patient-dashboard-section">
        <div className="dashboard-section-heading">
          <h2>Health Trends</h2>
          <Link className="text-link" to={`/patients/${patient._id}/timeline`}>
            Details <ArrowRight size={15} />
          </Link>
        </div>
        <Card className="dashboard-trends-panel">
          <div className="dashboard-section-heading">
            <div>
              <h3>{observations[0]?.normalizedName ?? 'Your observations'}</h3>
            </div>
          </div>
          {observations.length === 0 ? (
            <p className="muted">Your measurements will appear here as they are recorded.</p>
          ) : (
            <TrendChart observations={observations.slice(-8)} />
          )}
        </Card>
      </section>
    </div>
  );
}

function HealthTimeline({
  events,
}: {
  events: Array<{ id: string; type: string; occurredAt: string; title: string; detail: string }>;
}): JSX.Element {
  const grouped = events.reduce<
    Record<
      string,
      Array<{ id: string; type: string; occurredAt: string; title: string; detail: string }>
    >
  >((groups, event) => {
    const year = new Date(event.occurredAt).getFullYear().toString();
    groups[year] ??= [];
    groups[year].push(event);
    return groups;
  }, {});

  return (
    <div className="health-timeline">
      {Object.entries(grouped).map(([year, yearEvents]) => (
        <div className="timeline-year" key={year}>
          <h3>{year}</h3>
          <div className="timeline-events">
            {yearEvents.map((event) => (
              <div className="health-timeline-event" key={`${event.type}-${event.id}`}>
                <div className="timeline-event-date">
                  <strong>
                    {new Date(event.occurredAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: '2-digit',
                    })}
                  </strong>
                </div>
                <span className="timeline-event-icon">{timelineIcon(event.type)}</span>
                <div className="timeline-event-copy">
                  <strong>{event.title}</strong>
                  <span>{event.detail || 'Healthcare record updated'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function timelineIcon(type: string): string {
  if (type === 'observation' || type === 'report') return '🧪';
  if (type === 'medication') return '💊';
  return '🧑‍⚕️';
}

function DashboardOverviewCard({
  icon,
  label,
  value,
  details = [],
  action,
  to,
}: {
  icon: string;
  label: string;
  value: string;
  details?: string[];
  action?: string;
  to: string;
}): JSX.Element {
  return (
    <Link className="dashboard-overview-card" to={to}>
      <span className="dashboard-card-icon">{icon}</span>
      <span className="dashboard-card-label">{label}</span>
      <strong>{value}</strong>
      {details.length > 0 && (
        <span className="dashboard-card-details">{details.slice(0, 2).join(' · ')}</span>
      )}
      {action && (
        <span className="dashboard-card-action">
          {action} <ArrowRight size={14} />
        </span>
      )}
    </Link>
  );
}

function TrendChart({ observations }: { observations: Observation[] }): JSX.Element {
  const values = observations.map((observation) => observation.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = 24 + (index * 352) / Math.max(values.length - 1, 1);
      const y = 132 - ((value - min) / spread) * 94;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="trend-chart" aria-label="Recent health observations">
      <div className="trend-axis-labels">
        <span>{max}</span>
        <span>{Math.round((max + min) / 2)}</span>
        <span>{min}</span>
      </div>
      <svg viewBox="0 0 400 160" role="img" aria-label="Health trend line">
        <line x1="24" y1="18" x2="24" y2="132" />
        <line x1="24" y1="132" x2="376" y2="132" />
        <polyline points={points} />
        {observations.map((observation, index) => {
          const x = 24 + (index * 352) / Math.max(observations.length - 1, 1);
          const y = 132 - ((observation.value - min) / spread) * 94;
          return <circle key={observation._id} cx={x} cy={y} r="3.5" />;
        })}
      </svg>
      <div className="trend-dates">
        {observations.map((observation) => (
          <time key={observation._id}>{formatDate(observation.observedAt)}</time>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function formatDateLong(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

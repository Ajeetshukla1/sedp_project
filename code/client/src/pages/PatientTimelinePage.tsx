import { useQuery } from '@tanstack/react-query';
import { useState, type JSX } from 'react';
import { useParams } from 'react-router-dom';
import { getPatientTimeline } from '../api/patientApi';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { PagePlaceholder } from './PagePlaceholder';
export function PatientTimelinePage(): JSX.Element {
  const { patientId } = useParams();
  const { accessToken } = useAuth();
  const [eventType, setEventType] = useState('all');
  const [date, setDate] = useState('');
  const timelineQuery = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: () => getPatientTimeline(accessToken!, patientId!),
    enabled: Boolean(accessToken && patientId),
  });
  const events = timelineQuery.data?.events.filter(
    (event) =>
      (eventType === 'all' || event.type === eventType) &&
      (!date || event.occurredAt.startsWith(date)),
  );

  return (
    <PagePlaceholder
      eyebrow="Patient record"
      title="Timeline"
      description="Chronological clinical events, deterministic trends, and record conflicts."
    >
      <Card className="toolbar">
        <select
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
          aria-label="Filter event type"
        >
          <option value="all">All events</option>
          <option value="encounter">Encounters</option>
          <option value="condition">Conditions</option>
          <option value="medication">Medications</option>
          <option value="allergy">Allergies</option>
          <option value="observation">Observations</option>
          <option value="report">Reports</option>
        </select>
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Filter event date"
        />
      </Card>
      {timelineQuery.isPending && <p className="muted">Loading timeline...</p>}
      {timelineQuery.isError && <p className="form-error">Unable to load the timeline.</p>}
      {timelineQuery.isSuccess && timelineQuery.data.conflicts.length > 0 && (
        <Card className="notice-panel">
          <strong>{timelineQuery.data.conflicts.length} record conflict(s) need review</strong>
          {timelineQuery.data.conflicts.map((conflict) => (
            <span key={`${conflict.type}-${conflict.evidenceIds.join('-')}`}>
              {conflict.message} · Evidence: {conflict.evidenceIds.join(', ')}
            </span>
          ))}
        </Card>
      )}
      {timelineQuery.isSuccess && timelineQuery.data.trends.length > 0 && (
        <div className="record-grid">
          {timelineQuery.data.trends.map((trend) => (
            <Card key={trend.normalizedName}>
              <strong>{trend.normalizedName}</strong>
              <span>
                {trend.category}
                {trend.unit ? ` · ${trend.unit}` : ''}
              </span>
            </Card>
          ))}
        </div>
      )}
      {timelineQuery.isSuccess && (!events || events.length === 0) && (
        <p className="muted">No events match these filters.</p>
      )}
      {events && events.length > 0 && (
        <div className="timeline-list">
          {events.map((event) => (
            <Card className="timeline-row" key={`${event.type}-${event.id}`}>
              <div>
                <strong>{event.title}</strong>
                <span>
                  {event.type} · {event.detail}
                </span>
              </div>
              <time dateTime={event.occurredAt}>
                {new Date(event.occurredAt).toLocaleDateString()}
              </time>
            </Card>
          ))}
        </div>
      )}
    </PagePlaceholder>
  );
}

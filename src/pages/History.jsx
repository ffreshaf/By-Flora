import { useEffect, useMemo, useState } from 'react';
import { useDog } from '../hooks/useDog.js';
import { getEventsForDog } from '../db/careEvents.js';
import { startOfToday } from '../utils/reminders.js';
import { Link } from 'react-router-dom';
import './Home.css';

const DAY_MS = 24 * 60 * 60 * 1000;

function getDayStart(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], {
    weekday: 'long'
  });
}

function getEventIcon(type) {
  switch (type) {
    case 'feed':
      return '🍖';
    case 'walk':
      return '🐾';
    case 'play':
      return '🎾';
    case 'bath':
      return '🛁';
    default:
      return '✨';
  }
}

function getEventName(type) {
  switch (type) {
    case 'feed':
      return 'Feed';
    case 'walk':
      return 'Walk';
    case 'play':
      return 'Play';
    case 'bath':
      return 'Bath';
    default:
      return type;
  }
}

function History() {
  const { dog, loading } = useDog();
  const [events, setEvents] = useState([]);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (dog) {
      loadEvents();
    } else {
      setEvents([]);
    }
  }, [dog?.id]);

  async function loadEvents() {
    const result = await getEventsForDog(dog.id);
    setEvents(result);
  }

  const today = getDayStart(new Date());

  const periodStart = useMemo(() => {
    const start = new Date(today);

    if (period === 'week') {
      start.setDate(start.getDate() - 6);
    }

    if (period === 'month') {
      start.setDate(start.getDate() - 29);
    }

    return start;
  }, [period]);

  const periodEvents = useMemo(() => {
    return events
      .filter((event) => event.timestamp >= periodStart.getTime())
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [events, periodStart]);

  const stats = useMemo(() => {
    const feeds = periodEvents.filter((e) => e.type === 'feed');
    const walks = periodEvents.filter((e) => e.type === 'walk');
    const plays = periodEvents.filter((e) => e.type === 'play');
    const baths = periodEvents.filter((e) => e.type === 'bath');

    const walkMinutes = walks.reduce(
      (total, event) => total + (event.durationMinutes || 0),
      0
    );

    const playMinutes = plays.reduce(
      (total, event) => total + (event.durationMinutes || 0),
      0
    );

    return {
      feeds: feeds.length,
      walks: walks.length,
      plays: plays.length,
      baths: baths.length,
      walkMinutes,
      playMinutes
    };
  }, [periodEvents]);

  const chartDays = useMemo(() => {
    const days = [];

    const numberOfDays = period === 'month' ? 30 : 7;

    for (let i = numberOfDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const start = getDayStart(date).getTime();
      const end = start + DAY_MS;

      const dayEvents = events.filter(
        (event) =>
          event.timestamp >= start &&
          event.timestamp < end
      );

      const minutes = dayEvents.reduce(
        (total, event) =>
          total + (event.durationMinutes || 0),
        0
      );

      days.push({
        date,
        minutes,
        label: date.toLocaleDateString([], {
          weekday: 'short'
        })
      });
    }

    return days;
  }, [events, period, today]);

  const maxChartMinutes = Math.max(
    ...chartDays.map((day) => day.minutes),
    1
  );

  const recentGroups = useMemo(() => {
    const groups = [];

    for (const event of periodEvents) {
      const dateKey = getDayStart(event.timestamp).getTime();

      let group = groups.find((item) => item.dateKey === dateKey);

      if (!group) {
        group = {
          dateKey,
          events: []
        };

        groups.push(group);
      }

      group.events.push(event);
    }

    return groups.slice(0, 7);
  }, [periodEvents]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!dog) {
    return (
      <div className="care-card">
        <h2>History</h2>

        <p className="care-note">
          Set up her profile first to start tracking her history.
        </p>

        <Link to="/settings" className="btn btn-primary">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="care-card history-page">

      <div className="history-header">
        <div>
          <p className="settings-section-label">History</p>
          <h2>{dog.name}'s routine</h2>
        </div>

        <select
          className="history-period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="week">This week</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>

      <div className="history-summary">
        <div className="history-summary-number">
          {periodEvents.length}
        </div>

        <div>
          <strong>care activities</strong>
          <span>
            {period === 'week'
              ? 'recorded this week'
              : 'recorded in the last 30 days'}
          </span>
        </div>
      </div>

      <div className="history-stat-grid">

        <div className="history-stat-card">
          <span className="history-stat-icon">🍖</span>
          <strong>{stats.feeds}</strong>
          <span>Meals</span>
        </div>

        <div className="history-stat-card">
          <span className="history-stat-icon">🐾</span>
          <strong>{stats.walkMinutes}m</strong>
          <span>Walk time</span>
        </div>

        <div className="history-stat-card">
          <span className="history-stat-icon">🎾</span>
          <strong>{stats.playMinutes}m</strong>
          <span>Play time</span>
        </div>

        <div className="history-stat-card">
          <span className="history-stat-icon">🛁</span>
          <strong>{stats.baths}</strong>
          <span>Baths</span>
        </div>

      </div>

      <div className="history-section">
        <h3>Activity</h3>

        {period === 'week' ? (
            <div className="history-chart">
            {chartDays.map((day) => {
                const height =
                    day.minutes === 0
                        ? 4
                        : Math.max(
                            8,
                            (day.minutes / maxChartMinutes) * 100
                        );

                    return (
                        <div
                            className="chart-column"
                            key={day.date.toISOString()}
                        >
                        <div className="chart-bar-wrap">
                            <div
                                className="chart-bar"
                                style={{ height: `${height}%` }}
                                title={`${day.minutes} minutes`}
                            />
                        </div>

                        <span>{day.label}</span>
                    </div>
                );
            })}
        </div>
    ) : (
        <div className="history-month-grid">
            <div className="month-weekdays">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(
                    (day, index) => (
                        <span key={index}>{day}</span>
                    )
                )}
            </div>

            <div className="month-days">
                {chartDays.map((day) => {
                    const intensity =
                        day.minutes === 0
                            ? ''
                            : day.minutes < maxChartMinutes * 0.4
                                ? 'low-activity'
                                : day.minutes < maxChartMinutes * 0.75
                                    ? 'medium-activity'
                                    : 'high-activity';

                    const isToday =
                        day.date.toDateString() === today.toDateString();

                    return (
                        <div
                            key={day.date.toISOString()}
                            className={`month-day ${
                                day.minutes > 0 ? 'has-activity' : ''
                            } ${intensity} ${isToday ? 'today' : ''}`}
                            title={`${day.date.toLocaleDateString()}: ${day.minutes} minutes`}
                        >
                            <span className="month-day-number">
                                {day.date.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
        )}

        <p className="chart-note">
            Walk and play time combined
        </p>
        </div>

      <div className="history-section">

        <h3>Recent activity</h3>

        {recentGroups.length === 0 ? (
          <p className="history-empty">
            Nothing logged yet. Her history will appear here.
          </p>
        ) : (
          <div className="history-groups">

            {recentGroups.map((group) => (
              <div
                className="history-day-group"
                key={group.dateKey}
              >

                <h4>
                  {group.dateKey === getDayStart(new Date()).getTime()
                    ? 'Today'
                    : formatDate(group.dateKey)}
                </h4>

                <ul className="history-list">

                  {group.events.map((event) => (
                    <li key={event.id || event.timestamp}>

                      <span className="history-event-icon">
                        {getEventIcon(event.type)}
                      </span>

                      <span className="history-event-name">
                        {getEventName(event.type)}
                      </span>

                      {event.durationMinutes > 0 && (
                        <span className="history-event-duration">
                          {event.durationMinutes}m
                        </span>
                      )}

                      <span className="history-event-time">
                        {formatTime(event.timestamp)}
                      </span>

                    </li>
                  ))}

                </ul>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default History;
'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardData } from '@/lib/analytics';


export default function AnalyticsSummary() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
  fetchDashboardData().then((data) => {
    console.log("Dashboard Response:", data); 
    setStats(data);
  });
}, []);

  if(stats == null){
    return <div>Loading stats...</div>;
  }

    return ( <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Meta Information */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">📅 Date Range</h2>
        <p className="text-gray-700">
          <span className="font-semibold">Start:</span> {stats.meta.start} | 
          <span className="font-semibold"> End:</span> {stats.meta.end}
        </p>
      </section>

      {/* Overview - KPIs */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">📊 Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-gray-600 uppercase">Total Members</p>
            <p className="text-3xl font-bold text-blue-700">{stats.overview.kpis.total_members}</p>
          </div>
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-gray-600 uppercase">Active Members</p>
            <p className="text-3xl font-bold text-green-700">{stats.overview.kpis.active_members}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded border border-purple-200">
            <p className="text-sm text-gray-600 uppercase">Active Member %</p>
            <p className="text-3xl font-bold text-purple-700">{(stats.overview.kpis.active_member_pct * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-orange-50 rounded border border-orange-200">
            <p className="text-sm text-gray-600 uppercase">30-Day Growth</p>
            <p className="text-3xl font-bold text-orange-700">{(stats.overview.kpis.registered_growth_last_30d_pct * 100).toFixed(1)}%</p>
          </div>
        </div>
      </section>

      {/* Overview - Members Over Time */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">📈 Members Over Time</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Period</th>
                <th className="border p-3 text-left">Registered Members</th>
                <th className="border p-3 text-left">Active Members</th>
              </tr>
            </thead>
            <tbody>
              {stats.overview.members_over_time.map((item: any) => (
                <tr key={item.period} className="hover:bg-gray-50">
                  <td className="border p-3 font-semibold">{item.period}</td>
                  <td className="border p-3">{item.registered_members_cumulative}</td>
                  <td className="border p-3">{item.active_members_cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mission - Major Category Distribution */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">🎓 Major Category Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.mission.major_category_distribution.map((item: any) => (
            <div key={item.major_category} className="p-4 bg-indigo-50 rounded border border-indigo-200">
              <p className="text-sm text-gray-600">{item.major_category}</p>
              <p className="text-2xl font-bold text-indigo-700">{item.members} members</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission - Class Year Distribution */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">🎒 Class Year Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.mission.class_year_distribution.map((item: any) => (
            <div key={item.class_year} className="p-4 bg-teal-50 rounded border border-teal-200">
              <p className="text-sm text-gray-600">{item.class_year}</p>
              <p className="text-2xl font-bold text-teal-700">{item.members}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission - Event Major Category Percent */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">🎉 Event Attendance by Major</h2>
        <div className="space-y-6">
          {stats.mission.event_major_category_percent.map((event: any) => (
            <div key={event.event_id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800">{event.event_title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                📅 {new Date(event.starts_at).toLocaleString()} | 
                👥 {event.total_attendees} attendees
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {event.segments.map((segment: any) => (
                  <div key={segment.major_category} className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">{segment.major_category}</p>
                    <p className="text-lg font-bold">{segment.count}</p>
                    <p className="text-sm text-gray-500">{(segment.pct * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Retention - Overall Distribution */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">🔄 Attendance Count Distribution (Overall)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.retention.attendance_count_distribution_overall.map((item: any) => (
            <div key={item.events_attended_bucket} className="p-4 bg-rose-50 rounded border border-rose-200">
              <p className="text-sm text-gray-600">{item.events_attended_bucket} events</p>
              <p className="text-2xl font-bold text-rose-700">{item.people} people</p>
            </div>
          ))}
        </div>
      </section>

      {/* Retention - By Major Category */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">🔄 Attendance Distribution by Major</h2>
        <div className="space-y-6">
          {stats.retention.attendance_count_distribution_by_major_category.map((major: any) => (
            <div key={major.major_category} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">{major.major_category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {major.distribution.map((item: any) => (
                  <div key={item.events_attended_bucket} className="p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="text-xs text-gray-600">{item.events_attended_bucket} events</p>
                    <p className="text-xl font-bold text-amber-700">{item.people}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      
    </div>
  );
}

//export default AnalyticsSummary;
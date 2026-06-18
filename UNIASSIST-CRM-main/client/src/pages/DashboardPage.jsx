import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiUserGroup, 
  HiAcademicCap, 
  HiChartPie, 
  HiSquare3Stack3D 
} from 'react-icons/hi2';
import { getLeads } from '../services/leadService';
import { getStudents } from '../services/studentService';
import { getUniversities } from '../services/masterService';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalStudents: 0,
    conversionRate: 0,
    totalUniversities: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all counts
        const leadsRes = await getLeads({ page: 1, limit: 5 });
        const studentsRes = await getStudents({ page: 1, limit: 5 });
        const unisRes = await getUniversities();

        const totalLeads = leadsRes.total || 0;
        const totalStudents = studentsRes.total || 0;
        const totalUnis = unisRes.length || 0;

        // Calculate conversion rate
        const rate = totalLeads > 0 ? ((totalStudents / totalLeads) * 100).toFixed(1) : 0;

        setStats({
          totalLeads,
          totalStudents,
          conversionRate: rate,
          totalUniversities: totalUnis
        });

        setRecentLeads(leadsRes.data || []);
        setRecentStudents(studentsRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(99,102,241,0.15),rgba(255,255,255,0))] rounded-3xl p-8 border border-slate-800 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold font-sans tracking-tight mb-1">
            CRM Portal Overview
          </h2>
          <p className="text-xs text-slate-400 font-sans max-w-md">
            Consultancy admissions and leads dashboard. Synchronized directly with Excel local database storage.
          </p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 font-semibold text-xs rounded-xl shadow-md transition-all focus:outline-none"
        >
          View Leads
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={HiUserGroup}
          description="Inquiries registered"
          colorClass="text-brand-600 bg-brand-50"
        />
        <StatCard
          title="Active Students"
          value={stats.totalStudents}
          icon={HiAcademicCap}
          description="Enrolled / Confirmed status"
          colorClass="text-purple-600 bg-purple-50"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={HiChartPie}
          description="Inquiry to student conversion"
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Universities Listed"
          value={stats.totalUniversities}
          icon={HiSquare3Stack3D}
          description="Affiliated institutions"
          colorClass="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 font-sans">Recent Inquiries</h3>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="flex flex-col divide-y divide-slate-100">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No leads available.</p>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="py-3.5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 capitalize">{lead.name}</span>
                    <span className="text-xs text-slate-400 font-sans mt-0.5">{lead.email || lead.phone || 'No Contact'}</span>
                  </div>
                  <span className={`text-xxs font-bold px-2 py-0.5 rounded-lg ${
                    lead.status === 'Confirmed' ? 'text-emerald-700 bg-emerald-50' :
                    lead.status === 'Follow-up' ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-50'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 font-sans">Admission Pipeline</h3>
            <button
              onClick={() => navigate('/students')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              See all
            </button>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {recentStudents.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No student records available.</p>
            ) : (
              recentStudents.map((student) => (
                <div key={student.id} className="py-3.5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700 capitalize">{student.name}</span>
                    <span className="text-xs text-slate-400 font-sans mt-0.5">
                      {student.university ? `${student.course || 'Course'} at ${student.university}` : 'Unassigned University'}
                    </span>
                  </div>
                  <span className="text-xxs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">
                    {student.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

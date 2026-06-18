import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { HiPlus, HiTrash, HiCheck, HiXMark } from 'react-icons/hi2';
import * as masterService from '../services/masterService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export const MastersPage = () => {
  const [activeTab, setActiveTab] = useState('countries');
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();

  const { register: regCountry, handleSubmit: subCountry, reset: resCountry } = useForm();
  const { register: regUni, handleSubmit: subUni, reset: resUni } = useForm();
  const { register: regCourse, handleSubmit: subCourse, reset: resCourse } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [countriesData, unisData, coursesData] = await Promise.all([
        masterService.getCountries(),
        masterService.getUniversities(),
        masterService.getCourses()
      ]);
      setCountries(countriesData);
      setUniversities(unisData);
      setCourses(coursesData);
    } catch (err) {
      toast.error('Failed to load masters database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Country Handlers
  const onAddCountry = async (data) => {
    try {
      await masterService.createCountry({ name: data.name, status: 'Active' });
      toast.success('Country added successfully.');
      resCountry();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add country.');
    }
  };

  const onDeleteCountry = async (id) => {
    try {
      await masterService.deleteCountry(id);
      toast.success('Country removed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove country.');
    }
  };

  const onToggleCountryStatus = async (item) => {
    try {
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await masterService.updateCountry(item.id, { ...item, status: newStatus });
      toast.success(`Country status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // University Handlers
  const onAddUni = async (data) => {
    try {
      await masterService.createUniversity({ name: data.name, country: data.country, status: 'Active' });
      toast.success('University added successfully.');
      resUni();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add university.');
    }
  };

  const onDeleteUni = async (id) => {
    try {
      await masterService.deleteUniversity(id);
      toast.success('University removed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove university.');
    }
  };

  const onToggleUniStatus = async (item) => {
    try {
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await masterService.updateUniversity(item.id, { ...item, status: newStatus });
      toast.success(`University status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  // Course Handlers
  const onAddCourse = async (data) => {
    try {
      await masterService.createCourse({ name: data.name, university: data.university, status: 'Active' });
      toast.success('Course program added.');
      resCourse();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add course.');
    }
  };

  const onDeleteCourse = async (id) => {
    try {
      await masterService.deleteCourse(id);
      toast.success('Course program removed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove course.');
    }
  };

  const onToggleCourseStatus = async (item) => {
    try {
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await masterService.updateCourse(item.id, { ...item, status: newStatus });
      toast.success(`Course status updated to ${newStatus}.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { id: 'countries', name: 'Countries Interest' },
          { id: 'universities', name: 'Affiliated Universities' },
          { id: 'courses', name: 'Course Programs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Countries Tab */}
          {activeTab === 'countries' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Add form */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-800">Add Country</h3>
                <form onSubmit={subCountry(onAddCountry)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Country Name</label>
                    <input
                      type="text"
                      placeholder="e.g. New Zealand"
                      required
                      {...regCountry('name')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white rounded-xl shadow-md transition-all focus:outline-none"
                  >
                    <HiPlus className="w-4 h-4" />
                    <span>Add Country</span>
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Country Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {countries.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No countries configured yet.</td>
                      </tr>
                    ) : (
                      countries.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{item.id}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-700 capitalize">{item.name}</td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => onToggleCountryStatus(item)}
                              className={`text-xxs font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 focus:outline-none transition-all ${
                                item.status === 'Active' 
                                  ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10 hover:bg-emerald-100' 
                                  : 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/10 hover:bg-rose-100'
                              }`}
                            >
                              {item.status === 'Active' ? <HiCheck className="w-3 h-3" /> : <HiXMark className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => onDeleteCountry(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
                              title="Delete Country"
                            >
                              <HiTrash className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Universities Tab */}
          {activeTab === 'universities' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Add form */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-800">Add University</h3>
                <form onSubmit={subUni(onAddUni)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Country Location</label>
                    <select
                      required
                      {...regUni('country')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    >
                      <option value="">Choose Country</option>
                      {countries.filter(c => c.status === 'Active').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">University Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      required
                      {...regUni('name')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white rounded-xl shadow-md transition-all focus:outline-none"
                  >
                    <HiPlus className="w-4 h-4" />
                    <span>Add University</span>
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">University Name</th>
                      <th className="px-6 py-4">Country Location</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {universities.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No universities configured yet.</td>
                      </tr>
                    ) : (
                      universities.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{item.id}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-700 capitalize">{item.name}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-500">{item.country}</td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => onToggleUniStatus(item)}
                              className={`text-xxs font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 focus:outline-none transition-all ${
                                item.status === 'Active' 
                                  ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10 hover:bg-emerald-100' 
                                  : 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/10 hover:bg-rose-100'
                              }`}
                            >
                              {item.status === 'Active' ? <HiCheck className="w-3 h-3" /> : <HiXMark className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => onDeleteUni(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
                              title="Delete University"
                            >
                              <HiTrash className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Add form */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-800">Add Course</h3>
                <form onSubmit={subCourse(onAddCourse)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">University</label>
                    <select
                      required
                      {...regCourse('university')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    >
                      <option value="">Choose University</option>
                      {universities.filter(u => u.status === 'Active').map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Program Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Master of Business Administration"
                      required
                      {...regCourse('name')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white rounded-xl shadow-md transition-all focus:outline-none"
                  >
                    <HiPlus className="w-4 h-4" />
                    <span>Add Course</span>
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Course Program Name</th>
                      <th className="px-6 py-4">University</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No courses configured yet.</td>
                      </tr>
                    ) : (
                      courses.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{item.id}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-700 capitalize">{item.name}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-500">{item.university}</td>
                          <td className="px-6 py-3.5">
                            <button
                              onClick={() => onToggleCourseStatus(item)}
                              className={`text-xxs font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 focus:outline-none transition-all ${
                                item.status === 'Active' 
                                  ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/10 hover:bg-emerald-100' 
                                  : 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/10 hover:bg-rose-100'
                              }`}
                            >
                              {item.status === 'Active' ? <HiCheck className="w-3 h-3" /> : <HiXMark className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </button>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => onDeleteCourse(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
                              title="Delete Course"
                            >
                              <HiTrash className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MastersPage;

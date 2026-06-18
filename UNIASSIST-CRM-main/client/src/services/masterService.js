import api from './api';

// Countries
export const getCountries = async () => {
  const response = await api.get('/masters/countries');
  return response.data;
};
export const createCountry = async (data) => {
  const response = await api.post('/masters/countries', data);
  return response.data;
};
export const updateCountry = async (id, data) => {
  const response = await api.put(`/masters/countries/${id}`, data);
  return response.data;
};
export const deleteCountry = async (id) => {
  const response = await api.delete(`/masters/countries/${id}`);
  return response.data;
};

// Universities
export const getUniversities = async () => {
  const response = await api.get('/masters/universities');
  return response.data;
};
export const createUniversity = async (data) => {
  const response = await api.post('/masters/universities', data);
  return response.data;
};
export const updateUniversity = async (id, data) => {
  const response = await api.put(`/masters/universities/${id}`, data);
  return response.data;
};
export const deleteUniversity = async (id) => {
  const response = await api.delete(`/masters/universities/${id}`);
  return response.data;
};

// Courses
export const getCourses = async () => {
  const response = await api.get('/masters/courses');
  return response.data;
};
export const createCourse = async (data) => {
  const response = await api.post('/masters/courses', data);
  return response.data;
};
export const updateCourse = async (id, data) => {
  const response = await api.put(`/masters/courses/${id}`, data);
  return response.data;
};
export const deleteCourse = async (id) => {
  const response = await api.delete(`/masters/courses/${id}`);
  return response.data;
};

// Config Settings
export const getConfig = async () => {
  const response = await api.get('/config');
  return response.data;
};
export const updateConfig = async (configData) => {
  const response = await api.put('/config', configData);
  return response.data;
};

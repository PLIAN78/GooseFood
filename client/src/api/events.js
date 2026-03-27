import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000'
});

export const getUniversities = () => API.get('/universities');
export const getEvents = (slug, filters = {}) => API.get(`/campus/${slug}/events`, { params: filters });
export const getEventDetail = (id) => API.get(`/campus/detail/${id}`);
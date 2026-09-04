const TRACKS = [
  'backend_dev',
  'frontend_dev',
  'fullstack_dev',
  'mobile_dev',
  'devops_cloud',
  'network_admin',
  'network_security',
  'ml_ai',
];

const TRACK_LABELS = {
  backend_dev: 'Backend Development',
  frontend_dev: 'Frontend Development',
  fullstack_dev: 'Full-Stack Development',
  mobile_dev: 'Mobile Development',
  devops_cloud: 'DevOps & Cloud Engineering',
  network_admin: 'Network Administration',
  network_security: 'Network Security',
  ml_ai: 'Machine Learning / AI',
};

const FIELD_OF_STUDY_TRACKS = {
  'Software Development': 'Full-Stack Development',
  'Data Science & Analytics': 'Machine Learning / AI',
  'DevOps & Cloud Infrastructure': 'DevOps & Cloud Engineering',
  'UI/UX Design': 'Frontend Development',
  Cybersecurity: 'Network Security',
  'Mobile Development': 'Mobile Development',
};

const trackFromFieldOfStudy = (fieldOfStudy) => FIELD_OF_STUDY_TRACKS[fieldOfStudy];

module.exports = { TRACKS, TRACK_LABELS, FIELD_OF_STUDY_TRACKS, trackFromFieldOfStudy };

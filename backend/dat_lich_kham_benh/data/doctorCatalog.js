// Minimal doctor and hospital catalog used by in-memory services.
export const doctorCatalog = [
  {
    fullName: 'Dr. Nguyen Van A',
    title: 'MD',
    specialty: 'General Practitioner',
    hospital: 'HealthyAI General Hospital',
    experienceYears: 8,
    rating: 4.7,
    bio: 'Experienced GP focusing on preventive care and chronic disease management.',
    avatarColor: '#2b7edb',
    avatarUrl: '',
    timeSlots: ['09:00','10:00','11:00'],
  },
];

export const hospitalCatalog = [
  {
    id: 'h1',
    name: 'HealthyAI General Hospital',
    address: '123 Example Street',
  },
];

export default { doctorCatalog, hospitalCatalog };

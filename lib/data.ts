export type Staff = { id: number; name: string; email: string; department: string; position: string; role: string; phone: string; status: string };
export type Attendance = { id: number; staffId: number; date: string; checkIn: string; checkOut: string; status: string };
export type Leave = { id: number; staffId: number; start: string; end: string; type: string; reason: string; status: string };
export type Department = { id: number; name: string; code: string; head: string };
export type Activity = { id: number; name: string; text: string; time: string; kind: string };
export type Data = { staff: Staff[]; attendance: Attendance[]; leaves: Leave[]; departments: Department[]; activities: Activity[]; profile: { id?: number; role?: string; department?: string; position?: string; name: string; email: string; phone: string }; settings: { institution: string; email: string; notifications: boolean } };

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
export function createData(): Data {
  const departments = [
    { id: 1, name: 'Information Technology', code: 'IT', head: 'Daniel Lee' },
    { id: 2, name: 'Business & Management', code: 'BUS', head: 'Nur Aisyah' },
    { id: 3, name: 'Engineering', code: 'ENG', head: 'James Wilson' },
    { id: 4, name: 'Student Affairs', code: 'SA', head: 'Priya Sharma' },
    { id: 5, name: 'Human Resources', code: 'HR', head: 'Siti Aminah' },
  ];
  const names = ['Sarah Johnson', 'Daniel Lee', 'Nur Aisyah', 'James Wilson', 'Priya Sharma', 'Siti Aminah', 'Michael Chen', 'Emily Davis', 'Ahmad Hakimi', 'Lisa Brown', 'David Tan', 'Fatimah Zahra', 'Ryan Mitchell', 'Chloe Wong', 'Adam Hassan', 'Sophia Lim', 'Omar Farouk', 'Grace Thomas', 'Ben Carter', 'Nadia Rahman', 'Alex Martin', 'Mei Ling', 'Hana Yusuf', 'Ethan Brooks', 'Aisha Karim', 'Lucas Green', 'Yasmin Ali', 'Oliver Scott', 'Anika Patel', 'Noah Walker'];
  const staff = names.map((name, i) => ({ id: i + 1, name, email: name.toLowerCase().replaceAll(' ', '.') + '@university.example', department: departments[i === 0 ? 4 : (i - 1) % 5].name, position: i === 0 ? 'HR Administrator' : i < 6 ? 'Department Head' : i % 3 === 0 ? 'Senior Lecturer' : i % 3 === 1 ? 'Lecturer' : 'Administrative Officer', role: i === 0 ? 'Administrator' : i < 6 ? 'Department Head' : 'Staff Member', phone: '+60 3 5550 ' + String(1000 + i), status: i === 28 ? 'Inactive' : 'Active' }));
  const attendance = staff.map((s, i) => ({ id: i + 1, staffId: s.id, date: today(), checkIn: i < 24 ? `08:${String(5 + (i * 7) % 50).padStart(2, '0')} AM` : '', checkOut: i < 3 ? '05:02 PM' : '', status: i < 3 ? 'Checked out' : i < 24 ? 'Present' : i === 24 || i === 25 ? 'On leave' : 'Absent' }));
  const leaves = [
    { id: 1, staffId: 7, start: '2026-11-12', end: '2026-11-13', type: 'Annual leave', reason: 'Family commitments.', status: 'Pending' },
    { id: 2, staffId: 8, start: '2026-11-11', end: '2026-11-11', type: 'Medical leave', reason: 'Medical appointment.', status: 'Pending' },
    { id: 3, staffId: 9, start: '2026-11-16', end: '2026-11-18', type: 'Annual leave', reason: 'Personal matters.', status: 'Pending' },
    { id: 4, staffId: 10, start: '2026-11-19', end: '2026-11-20', type: 'Annual leave', reason: 'Family holiday.', status: 'Pending' },
    { id: 5, staffId: 11, start: '2026-11-23', end: '2026-11-23', type: 'Emergency leave', reason: 'Urgent family matter.', status: 'Pending' },
    { id: 6, staffId: 12, start: '2026-11-25', end: '2026-11-26', type: 'Annual leave', reason: 'Personal commitments.', status: 'Pending' },
    { id: 7, staffId: 25, start: today(), end: today(), type: 'Medical leave', reason: 'Rest and recovery.', status: 'Approved' },
    { id: 8, staffId: 26, start: today(), end: today(), type: 'Annual leave', reason: 'Family visit.', status: 'Approved' },
    { id: 9, staffId: 14, start: '2026-11-04', end: '2026-11-05', type: 'Annual leave', reason: 'Personal leave.', status: 'Approved' },
    { id: 10, staffId: 15, start: '2026-11-02', end: '2026-11-03', type: 'Annual leave', reason: 'Personal leave.', status: 'Rejected' },
  ];
  return { staff, attendance, leaves, departments, activities: [
    { id: 1, name: 'Michael Chen', text: 'submitted a leave request', time: '20 minutes ago', kind: 'leave' },
    { id: 2, name: 'Emily Davis', text: 'updated her profile information', time: '1 hour ago', kind: 'profile' },
    { id: 3, name: 'Ahmad Hakimi', text: 'checked in for today', time: '2 hours ago', kind: 'attendance' },
    { id: 4, name: 'Sarah Johnson', text: 'approved a leave request', time: '3 hours ago', kind: 'leave' },
    { id: 5, name: 'Noah Walker', text: 'joined Engineering', time: 'Yesterday', kind: 'staff' },
  ], profile: { name: 'Sarah Johnson', email: 'sarah.johnson@university.example', phone: '+60 3 5550 1000' }, settings: { institution: 'University Staff Management', email: 'hr@university.example', notifications: true } };
}

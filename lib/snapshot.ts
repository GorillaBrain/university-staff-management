import { db } from './db';
import { scope } from './http';
import type { User } from './auth';
import type { Data } from './data';

export async function snapshot(u: User): Promise<Data> {
  const visible = { ...scope(u), role: { not: 'Read-only Demo' } };
  const [staff, departments, attendance, leaves, activities, settings] = await Promise.all([
    db.staff.findMany({ where: visible, include: { department: true }, orderBy: { id: 'asc' } }),
    db.department.findMany({ where: ['Administrator', 'Read-only Demo'].includes(u.role) ? {} : { id: u.departmentId }, include: { head: { select: { name: true } } }, orderBy: { id: 'asc' } }),
    db.attendance.findMany({ where: { staff: visible }, orderBy: [{ date: 'desc' }, { staffId: 'asc' }] }),
    db.leave.findMany({ where: { staff: visible }, orderBy: { createdAt: 'desc' } }),
    db.activity.findMany({ where: { staff: visible }, take: 20, orderBy: { createdAt: 'desc' } }),
    db.setting.findUnique({ where: { id: 1 } }),
  ]);
  return {
    staff: staff.map(s => ({ id: s.id, name: s.name, email: s.email, department: s.department.name, position: s.position, role: s.role, phone: s.phone, status: s.status })),
    departments: departments.map(d => ({ id: d.id, name: d.name, code: d.code, head: d.head?.name || '' })),
    attendance: attendance.map(a => ({ id: a.id, staffId: a.staffId, date: a.date, checkIn: a.checkIn, checkOut: a.checkOut, status: a.status })),
    leaves: leaves.map(l => ({ id: l.id, staffId: l.staffId, start: l.start, end: l.end, type: l.type, reason: l.reason, status: l.status })),
    activities: activities.map(a => ({ id: a.id, name: a.name, text: a.text, kind: a.kind, time: a.createdAt.toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) })),
    profile: { id: u.id, role: u.role, department: departments.find(d => d.id === u.departmentId)?.name || '', position: u.position, name: u.name, email: u.email, phone: u.phone },
    settings: { institution: settings?.institution || 'University Staff Management', email: settings?.email || 'hr@university.example', notifications: u.notifications },
  };
}

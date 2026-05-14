import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    capacity: 82 // Static for now as per design
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Query projects where user is owner or member
        // For now, simplicity: projects owned by user
        const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
        const projectsSnap = await getDocs(projectsQuery);
        const projectsCount = projectsSnap.size;

        // Fetch all tasks for those projects (this is complex in Firestore without collectionGroup or specific indexing)
        // For simplicity, let's just fetch tasks across projects if we had a flat collection or use a specific one
        // Given our blueprint, tasks are subcollections. So we'd need to loop projects.
        let allPending = 0;
        let allOverdue = 0;
        let recent: any[] = [];

        for (const projectDoc of projectsSnap.docs) {
          const tasksQuery = query(collection(db, `projects/${projectDoc.id}/tasks`));
          const tasksSnap = await getDocs(tasksQuery);
          
          tasksSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.status !== 'completed') allPending++;
            if (data.deadline && new Date(data.deadline) < new Date() && data.status !== 'completed') allOverdue++;
            recent.push({ id: doc.id, ...data, projectName: projectDoc.data().name });
          });
        }

        setStats({
          activeProjects: projectsCount,
          pendingTasks: allPending,
          overdueTasks: allOverdue,
          capacity: 82
        });
        setRecentTasks(recent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));

      } catch (error) {
        // handleFirestoreError(error, OperationType.GET, 'dashboard');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Stats Row */}
      <section className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={stats.activeProjects} sub="+2 since last month" color="text-slate-900" subColor="text-green-600" />
        <StatCard title="Tasks Pending" value={stats.pendingTasks} sub={`${stats.pendingTasks > 5 ? 'High workload' : 'Manageable'}`} color="text-slate-900" subColor="text-amber-600" />
        <StatCard title="Overdue Tasks" value={stats.overdueTasks} sub="Requires attention" color="text-red-600" subColor="text-slate-400" />
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Capacity</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.capacity}%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${stats.capacity}%` }}></div>
          </div>
        </div>
      </section>

      {/* Task List Area */}
      <section className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">My Recent Tasks</h3>
          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-3">Task Name</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">No tasks found. Create a project to get started!</td>
                </tr>
              ) : (
                recentTasks.map((task) => (
                  <tr key={task.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{task.title}</td>
                    <td className="px-6 py-4 text-slate-500">{task.projectName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(task.deadline)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Featured / Progress */}
      <section className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
          <h3 className="text-lg font-bold z-10 relative">System Status</h3>
          <p className="text-sm text-indigo-200 z-10 relative mt-1 italic">Welcome back, {profile?.displayName}</p>
          <div className="mt-4 flex items-center gap-2 z-10 relative">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-indigo-300">All systems operational</span>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>

        <TeamSection />
      </section>
    </div>
  );
}

function StatCard({ title, value, sub, color, subColor }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
      <p className={cn("text-xs mt-2 font-medium", subColor)}>{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'todo': 'bg-slate-100 text-slate-500',
    'in_progress': 'bg-amber-100 text-amber-700',
    'review': 'bg-indigo-100 text-indigo-700',
    'completed': 'bg-green-100 text-green-700',
    'high_priority': 'bg-red-100 text-red-700', // for specific highlighting
  };
  
  return (
    <span className={cn("px-2 py-1 rounded-md text-xs font-bold capitalize", styles[status] || styles['todo'])}>
      {status.replace('_', ' ')}
    </span>
  );
}

function TeamSection() {
  const members = [
    { name: 'Marcus Kane', initials: 'MK', activity: 'Working on "Auth Flows"', color: 'bg-blue-100 text-blue-700' },
    { name: 'Sarah Liao', initials: 'SL', activity: 'Idle • Available', color: 'bg-pink-100 text-pink-700' },
    { name: 'Ben Thompson', initials: 'BT', activity: 'On Call • Urgent Fix', color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
      <h3 className="font-bold text-slate-800 mb-4">Active Team Members</h3>
      <div className="space-y-4">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm", m.color)}>
              {m.initials}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{m.name}</p>
              <p className="text-[10px] text-slate-500">{m.activity}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 opacity-50">
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border-2 border-white shadow-sm">+4</div>
          <div>
            <p className="text-xs font-bold text-slate-800">Others</p>
            <p className="text-[10px] text-slate-500">In meeting</p>
          </div>
        </div>
      </div>
    </div>
  );
}

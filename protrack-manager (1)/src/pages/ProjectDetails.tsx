import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  Flag, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Circle,
  Clock,
  Trash2,
  Settings
} from 'lucide-react';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', status: 'todo', priority: 'medium', deadline: '' });

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      }

      const tasksSnap = await getDocs(collection(db, `projects/${projectId}/tasks`));
      setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newTask.title) return;

    try {
      const taskData = {
        ...newTask,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, `projects/${projectId}/tasks`), taskData);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', status: 'todo', priority: 'medium', deadline: '' });
      fetchProjectData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}/tasks`);
    }
  };

  const handleToggleTask = async (task: any) => {
    if (!projectId) return;
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      await updateDoc(doc(db, `projects/${projectId}/tasks`, task.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      fetchProjectData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/tasks/${task.id}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !window.confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, `projects/${projectId}/tasks`, taskId));
      fetchProjectData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!project) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800">Project not found</h3>
      <Link to="/projects" className="text-indigo-600 font-bold hover:underline mt-4 inline-block">&larr; Back to projects</Link>
    </div>
  );

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link to="/projects" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Projects
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{project.name}</h2>
            <p className="text-slate-500 max-w-2xl">{project.description}</p>
          </div>
          
          <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden min-w-[240px] shrink-0">
            <div className="flex justify-between items-center mb-4 z-10 relative">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Progress</span>
              <Settings className="w-4 h-4 text-indigo-400 cursor-pointer" />
            </div>
            <div className="flex items-end gap-2 mb-2 z-10 relative">
              <span className="text-4xl font-bold">{progress}%</span>
              <span className="text-xs text-indigo-300 mb-1">Complete</span>
            </div>
            <div className="w-full bg-indigo-800 h-2 rounded-full z-10 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-white h-2 rounded-full"
              />
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex gap-4">
            <button className="text-sm font-bold text-slate-900 border-b-2 border-indigo-600 pb-1">Tasks</button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-1">Timeline</button>
            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-1">Files</button>
          </div>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="py-20 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400">No tasks created for this project.</p>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="text-indigo-600 text-sm font-bold mt-2 hover:underline"
              >
                Create your first task &rarr;
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className={cn(
                  "p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors",
                  task.status === 'completed' && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => handleToggleTask(task)}
                    className={cn(
                      "p-1 rounded-full border-2 transition-colors",
                      task.status === 'completed' ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 text-slate-200 hover:border-indigo-400"
                    )}
                  >
                    {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-transparent" />}
                  </button>
                  <div>
                    <h5 className={cn("font-bold text-slate-800 mb-0.5", task.status === 'completed' && "line-through")}>{task.title}</h5>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Flag className={cn("w-3 h-3", 
                          task.priority === 'high' ? "text-red-500" : 
                          task.priority === 'medium' ? "text-amber-500" : "text-slate-400"
                        )} />
                        {task.priority}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.deadline)}
                      </div>
                      <div className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider", 
                        task.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {task.status}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleCreateTask}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Create Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                  <input 
                    autoFocus required type="text" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Design Login Page"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                    <select 
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deadline</label>
                    <input 
                      type="date" 
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button 
                  type="button" onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
                >
                  Create Task
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

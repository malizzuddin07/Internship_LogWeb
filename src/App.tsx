import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';
import { LogIn, LogOut, LayoutDashboard, FileText, Users, Settings, Plus, Download, Trash2, Edit2, Key, ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Log, UserRole } from '@/src/types';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth, db } from '@/src/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import ExcelJS from 'exceljs';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, role }: { activeTab: string, setActiveTab: (tab: string) => void, role: UserRole }) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = role === 'admin' 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Manage Students', icon: Users },
        { id: 'logs', label: 'View All Logs', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'submit', label: 'Submit Daily Log', icon: Plus },
        { id: 'logs', label: 'My Logs', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">IL</div>
            <h1 className="text-xl font-bold tracking-tight">InternLog</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === item.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}
                `}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Pages ---

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const role = email === 'akmal.izzuddin07@gmail.com' ? 'admin' : 'student';
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          name,
          role,
          department,
          created_at: serverTimestamp()
        });
        toast.success('Account created successfully!');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold">IL</div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Welcome to InternLog' : 'Create an Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Join InternLog to start logging your internship'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" placeholder="e.g. Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ role, userId }: { role: UserRole, userId: string }) => {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === 'admin') {
          const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          const logsSnap = await getDocs(collection(db, 'logs'));
          
          let totalHours = 0;
          const logsByDayMap: Record<string, { date: string, count: number, hours: number }> = {};
          
          logsSnap.forEach(doc => {
            const data = doc.data();
            totalHours += (data.hours_worked || 0);
            const date = data.date;
            if (!logsByDayMap[date]) {
              logsByDayMap[date] = { date, count: 0, hours: 0 };
            }
            logsByDayMap[date].count += 1;
            logsByDayMap[date].hours += (data.hours_worked || 0);
          });

          const logsByDay = Object.values(logsByDayMap)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7)
            .reverse();

          setStats({
            totalStudents: studentsSnap.size,
            totalLogs: logsSnap.size,
            totalHours,
            logsByDay
          });
        }

        const q = role === 'admin' 
          ? query(collection(db, 'logs'), orderBy('date', 'desc'), limit(5))
          : query(collection(db, 'logs'), where('student_id', '==', userId), orderBy('date', 'desc'), limit(5));
        
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Log)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [role, userId]);

  if (role === 'admin') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHours || 0}h</div>
            </CardContent>
          </Card>
        </div>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Logs and hours submitted over the last 7 days</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.logsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Logs" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  const totalHours = logs.reduce((acc, log) => acc + log.hours_worked, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Total Hours</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your last 5 submitted logs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 5).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.date}</TableCell>
                  <TableCell>{log.department}</TableCell>
                  <TableCell>{log.hours_worked}h</TableCell>
                  <TableCell className="max-w-[200px] truncate">{log.tasks_performed}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No logs submitted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ManageStudents = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '', department: '' });

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        created_at: (d.data().created_at as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      } as User)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Direct student creation by Admin requires Firebase Admin SDK. Please ask students to sign up themselves.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('Student record deleted');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">Manage internship students and their access</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Initial Password</Label>
                <Input type="password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={newStudent.department} onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit">Create Student</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.department || '-'}</TableCell>
                <TableCell>{format(new Date(student.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(student.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const LogsPage = ({ role, userId }: { role: UserRole, userId: string }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchLogs = async () => {
    try {
      let q = query(collection(db, 'logs'), orderBy('date', 'desc'));
      if (role !== 'admin') {
        q = query(collection(db, 'logs'), where('student_id', '==', userId), orderBy('date', 'desc'));
      }
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Log)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Internship Logs');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Student Name', key: 'student_name', width: 20 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Tasks Performed', key: 'tasks_performed', width: 40 },
        { header: 'Skills Learned', key: 'skills_learned', width: 40 },
        { header: 'Problems Faced', key: 'problems_faced', width: 40 },
        { header: 'Solutions', key: 'solutions', width: 40 },
        { header: 'Hours Worked', key: 'hours_worked', width: 15 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];

      logs.forEach(log => worksheet.addRow(log));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `internship_logs_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{role === 'admin' ? 'All Internship Logs' : 'My Internship Logs'}</h2>
          <p className="text-muted-foreground">View and export internship activity records</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" className="w-40" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
          <span className="text-muted-foreground">to</span>
          <Input type="date" className="w-40" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" /> {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      <Card>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                {role === 'admin' && <TableHead>Student</TableHead>}
                <TableHead>Department</TableHead>
                <TableHead>Tasks Performed</TableHead>
                <TableHead>Skills Learned</TableHead>
                <TableHead className="w-[80px]">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.date}</TableCell>
                  {role === 'admin' && <TableCell>{log.student_name}</TableCell>}
                  <TableCell>{log.department}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.tasks_performed}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.skills_learned}</TableCell>
                  <TableCell>{log.hours_worked}h</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={role === 'admin' ? 6 : 5} className="text-center py-10 text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
};

const SubmitLogPage = ({ user, onSuccess }: { user: User, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    department: user.department || '',
    tasks_performed: '',
    skills_learned: '',
    problems_faced: '',
    solutions: '',
    hours_worked: 8,
    remarks: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'logs'), {
        ...formData,
        student_id: user.id,
        student_name: user.name,
        created_at: serverTimestamp()
      });
      toast.success('Log submitted successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Daily Log</CardTitle>
          <CardDescription>Record your internship activities for today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input placeholder="e.g. Engineering" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tasks Performed</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What did you work on today?"
                value={formData.tasks_performed}
                onChange={(e) => setFormData({ ...formData, tasks_performed: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Skills Learned</Label>
              <textarea 
                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Any new tools or concepts?"
                value={formData.skills_learned}
                onChange={(e) => setFormData({ ...formData, skills_learned: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Problems Faced</Label>
                <Input placeholder="Optional" value={formData.problems_faced} onChange={(e) => setFormData({ ...formData, problems_faced: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Solutions</Label>
                <Input placeholder="Optional" value={formData.solutions} onChange={(e) => setFormData({ ...formData, solutions: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours Worked</Label>
                <Input type="number" step="0.5" value={formData.hours_worked} onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input placeholder="Optional" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Log'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsPage = ({ user }: { user: User }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, passwords.current);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, passwords.new);
        toast.success('Password changed successfully');
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your security credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setUser(null);
      }
      setIsReady(true);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
    setActiveTab('dashboard');
  };

  if (!isReady) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
        className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4"
      >
        IL
      </motion.div>
      <p className="text-slate-500 font-medium animate-pulse">Initializing InternLog...</p>
    </div>
  );

  if (!user) return (
    <AuthContext.Provider value={{ user, logout, isReady }}>
      <LoginPage />
      <Toaster position="top-center" />
    </AuthContext.Provider>
  );

  return (
    <AuthContext.Provider value={{ user, logout, isReady }}>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user.role} />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-10 pt-20 lg:pt-10">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {activeTab === 'dashboard' && 'Welcome back, ' + user.name.split(' ')[0]}
                  {activeTab === 'students' && 'Student Management'}
                  {activeTab === 'logs' && 'Internship Logs'}
                  {activeTab === 'submit' && 'New Log Entry'}
                  {activeTab === 'settings' && 'Settings'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {user.role === 'admin' ? 'Administrator' : (user.department || 'General') + ' Intern'}
                </p>
              </div>
              <div className="hidden md:block">
                <Badge variant="secondary" className="px-3 py-1">
                  {format(new Date(), 'EEEE, MMMM do')}
                </Badge>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <Dashboard role={user.role} userId={user.id} />}
                {activeTab === 'students' && user.role === 'admin' && <ManageStudents />}
                {activeTab === 'logs' && <LogsPage role={user.role} userId={user.id} />}
                {activeTab === 'submit' && user.role === 'student' && <SubmitLogPage user={user} onSuccess={() => setActiveTab('logs')} />}
                {activeTab === 'settings' && <SettingsPage user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Toaster position="top-center" />
    </AuthContext.Provider>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetcher';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Pencil, Trash2, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { signOut } from '@/auth';

interface ProjectAdminData {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  categoryName: string;
  trackCount: number;
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ProjectAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const projects: ProjectAdminData[] = await adminFetch('/projects');
      setData(projects);
      setError(null);
    } catch (e: any) {
      console.error('Failed to fetch projects:', e);
      setError(`Failed to load data: ${e.message || 'Unknown error'}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = async () => {
  if (!confirm('Are you sure you want to logout?')) return;
  
  setLoggingOut(true);
    try {
      await signOut({ redirect: true, redirectTo: '/login' });
    } catch (e) {
      console.error('Logout error:', e);
      setLoggingOut(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete project: "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminFetch(`/project/${id}`, { method: 'DELETE' });
      alert(`Project "${title}" deleted successfully!`);
      fetchProjects();
    } catch (e: any) {
      console.error('Failed to delete project:', e);
      alert(`Error deleting project: ${e.message || 'Unknown error'}`);
    }
  };

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleEditProject = (id: string) => {
    router.push(`/projects/${id}/edit`);
  };

  return (
    <main className="container max-w-7xl mx-auto py-10 px-4">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard: Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your music projects</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateProject}> 
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Project
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Logout
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading Projects...
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-lg text-muted-foreground">No projects found. Click "Add New Project" to get started.</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="border rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="text-muted-foreground">{project.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.categoryName}</TableCell>
                  <TableCell className="text-center">{project.trackCount}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      title="Edit"
                      onClick={() => handleEditProject(project.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      title="Delete"
                      onClick={() => handleDeleteProject(project.id, project.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
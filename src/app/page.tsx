/* sax-music-admin/src/app/page.tsx (อัปเดตใหม่) */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetcher';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProjectAdminData {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  categoryName: string;
  trackCount: number;
  is_published: boolean;
}

interface GroupedProjects {
  [categoryName: string]: ProjectAdminData[];
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ProjectAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const groupedProjects = useMemo(() => {
    return data.reduce((acc, project) => {
      const category = project.categoryName || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(project);
      return acc;
    }, {} as GroupedProjects);
  }, [data]);

  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete project: "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminFetch(`/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch (e: any) {
      alert(`Error deleting project: ${e.message || 'Unknown error'}`);
    }
  };

  return (
    <main className="container max-w-7xl mx-auto py-10 px-4">
      {/* Header (Responsive) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Projects Overview by Category</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/projects')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Manage Projects
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
        <div className="text-center p-8 border rounded-lg bg-card">
          <p className="text-lg text-muted-foreground">No projects found. Go to "Manage Projects" to get started.</p>
        </div>
      )}

      {/* ⭐️ 1. เปลี่ยน Grid เป็น Layout แนวตั้ง (space-y-6) */}
      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col space-y-6">
          
          {Object.entries(groupedProjects).map(([categoryName, projects]) => (
            <div key={categoryName} className="bg-card border border-border rounded-lg shadow-lg flex flex-col">
              {/* Category Header */}
              <div className="p-3 md:p-4 border-b">
                <h3 className="text-xl font-semibold text-primary">{categoryName}</h3>
                <p className="text-sm text-muted-foreground">{projects.length} {projects.length > 1 ? 'projects' : 'project'}</p>
              </div>

              {/* ⭐️ 2. เพิ่ม max-h และ overflow-y-auto สำหรับ Scroll ภายใน */}
              <div className="p-2 md:p-4 space-y-2 max-h-[300px] overflow-y-auto">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-md bg-background border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm" title={project.title}>{project.title}</p>
                      <p className="text-xs text-muted-foreground">{project.trackCount} {project.trackCount > 1 ? 'tracks' : 'track'}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                      {project.is_published ? (
                         <Eye className="h-4 w-4 text-green-500" title="Published" />
                      ) : (
                         <EyeOff className="h-4 w-4 text-muted-foreground" title="Not Published" />
                      )}
                      <Button 
                        variant="outline" 
                        size="icon-sm" 
                        title="Edit"
                        onClick={() => router.push('/projects')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon-sm" 
                        title="Delete"
                        onClick={() => handleDeleteProject(project.id, project.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ⭐️ 3. ลบ Footer (ปุ่ม Manage Tracks) ออก */}

            </div>
          ))}
        </div>
      )}
    </main>
  );
}
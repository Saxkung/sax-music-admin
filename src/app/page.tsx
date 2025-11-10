// src/app/page.tsx
'use client'; 

import { useEffect, useState, useCallback } from 'react'; // ⬅️ เพิ่ม useCallback
import { useRouter } from 'next/navigation'; // ⬅️ เพิ่ม useRouter
import { adminFetch } from '@/lib/adminFetcher'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // สมมติว่ามี component Alert

// Type ที่ถูกต้องสำหรับข้อมูลจาก Worker
interface ProjectAdminData {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  categoryName: string; // มาจากการ Join ใน Worker
  trackCount: number;    // มาจากการนับใน Worker
}

export default function ProjectsDashboard() {
  const router = useRouter(); // ⬅️ เรียกใช้ Next.js Router
  const [data, setData] = useState<ProjectAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Refactor Logic การดึงข้อมูลให้ออกมาเป็น Function ที่เรียกซ้ำได้
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      // Endpoint: /api/admin-proxy/projects
      const projects: ProjectAdminData[] = await adminFetch('/projects'); //
      
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

  // 2. Logic การลบ Project
  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete project: "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // เรียก API DELETE /api/admin/project/:id
      await adminFetch(`/project/${id}`, { 
        method: 'DELETE',
      });
      
      alert(`Project "${title}" deleted successfully!`); // ควรเปลี่ยนเป็น Toast/Notification ที่ดีกว่า
      
      // อัปเดตตารางโดยการเรียกข้อมูลใหม่
      fetchProjects();
    } catch (e: any) {
      console.error('Failed to delete project:', e);
      alert(`Error deleting project: ${e.message || 'Unknown error'}`);
    }
  };

  // 3. Logic การนำทางไปยังหน้า Create
  const handleCreateProject = () => {
    router.push('/projects/create'); // ⬅️ ต้องสร้างไฟล์ src/app/projects/create/page.tsx
  };

  // 4. Logic การนำทางไปยังหน้า Edit
  const handleEditProject = (id: string) => {
    router.push(`/projects/${id}/edit`); // ⬅️ ต้องสร้างไฟล์ src/app/projects/[id]/edit/page.tsx
  };

  // 5. แสดงผล
  return (
    <main className="container max-w-7xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard: Projects</h1>
        <Button onClick={handleCreateProject}> 
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Project
        </Button>
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
                    {/* ปุ่ม Edit: เรียก handler ที่นำทาง */}
                    <Button 
                      variant="outline" 
                      size="icon" 
                      title="Edit"
                      onClick={() => handleEditProject(project.id)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {/* ปุ่ม Delete: เรียก handler ที่ลบข้อมูล */}
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
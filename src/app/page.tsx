// src/app/page.tsx
'use client'; 

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetcher'; // ใช้ fetcher ที่เราสร้าง
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';

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
  const [data, setData] = useState<ProjectAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        // 1. เรียก Proxy (ซึ่ง Proxy จะแนบ Token ไปเรียก Worker จริง)
        // Endpoint: /api/admin-proxy/projects
        const projects: ProjectAdminData[] = await adminFetch('/projects');
        
        // ข้อมูลกลับมาเป็น Array ของ Project ที่มีรายละเอียด Category
        setData(projects);
        setError(null);

      } catch (err: any) {
        // หากมี Error จาก Proxy/Worker จะถูกจับที่นี่
        setError(err.message || 'Unknown API Error');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects Dashboard</h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add New Project
        </Button>
      </div>

      {loading && (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading projects...</p>
        </div>
      )}

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md border border-red-500">Error: {error}</p>}

      {!loading && !error && (
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
                  <TableCell className="text-muted-foreground">{project.id}</TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.categoryName}</TableCell>
                  <TableCell className="text-center">{project.trackCount}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="icon" title="Edit">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" title="Delete">
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
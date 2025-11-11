/* sax-music-admin/src/app/projects/page.tsx (อัปเดต) */
'use client';

import { useEffect, useState, useRef, DragEvent } from 'react';
import { adminFetch } from '@/lib/adminFetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  GripVertical,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  display_order: number;
  is_published: boolean;
  categoryName?: string;
}

// ⭐️ 1. เพิ่ม tempImageKey ใน State
interface FormData {
  id: string;
  title: string;
  description: string;
  image: string; // URL ปัจจุบัน (สำหรับ Preview)
  category_id: string;
  tempImageKey?: string; // Key ชั่วคราว (ถ้ามีการอัปโหลดใหม่)
}

const initialFormData: FormData = {
  id: '',
  title: '',
  description: '',
  image: '',
  category_id: '',
  tempImageKey: '',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    image: '',
    category_id: '',
  });

  // ⭐️ Refs สำหรับ Drag & Drop
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, categoriesData] = await Promise.all([
        adminFetch<Project[]>('/projects'), 
        adminFetch<Category[]>('/categories'),
      ]);
      setProjects(projectsData);
      setCategories(categoriesData);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    // ⭐️ 2. Reset formData (รวม tempImageKey)
    setFormData(initialFormData);
    setIsFormOpen(true);
  };
  
  const openEditForm = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      id: project.id,
      title: project.title,
      description: project.description,
      image: project.image,
      category_id: project.category_id,
      tempImageKey: '', // ⭐️ เริ่มต้นด้วย Key ว่าง
    });
    setIsFormOpen(true);
  };

  // ⭐️ 3. อัปเดต handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category_id) {
      alert('กรุณากรอก Title และเลือก Category');
      return;
    }

    try {
      if (editingId) {
        // Update
        await adminFetch(`/projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            image: formData.image, // URL (เก่า หรือ ใหม่)
            category_id: formData.category_id,
            tempImageKey: formData.tempImageKey, // ⭐️ ส่ง Key ใหม่ (ถ้ามี)
          }),
        });
      } else {
        // Create
        // ⭐️ สร้าง ID ที่นี่
        const id =
          formData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') +
          '_' +
          Date.now();
          
        await adminFetch('/projects', {
          method: 'POST',
          body: JSON.stringify({
            ...formData, // ⭐️ ส่ง formData ทั้งหมด (รวม tempImageKey)
            id, // ⭐️ ส่ง ID ที่สร้างใหม่
            display_order: projects.length,
          }),
        });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ต้องการลบ "${title}" หรือไม่? Tracks ทั้งหมดจะถูกลบด้วย`))
      return;

    try {
      await adminFetch(`/projects/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const togglePublished = async (id: string, currentPublished: boolean) => {
    try {
      await adminFetch(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !currentPublished }),
      });
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  // ⭐️ --- Logic สำหรับ Drag & Drop ---
  const handleDragStart = (id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      setProjects([...projects]); // Rerender
      return;
    }
    
    const newProjects = [...projects];
    const dragItemIndex = newProjects.findIndex(p => p.id === dragItem.current);
    const dragOverItemIndex = newProjects.findIndex(p => p.id === dragOverItem.current);
    
    const [draggedItem] = newProjects.splice(dragItemIndex, 1);
    newProjects.splice(dragOverItemIndex, 0, draggedItem);
    
    const updatedProjects = newProjects.map((p, index) => ({
      ...p,
      display_order: index,
    }));
    
    setProjects(updatedProjects);
    
    dragItem.current = null;
    dragOverItem.current = null;

    saveOrder(updatedProjects);
  };

  const saveOrder = async (updatedProjects: Project[]) => {
    setIsSavingOrder(true);
    try {
      const itemsToSave = updatedProjects.map(p => ({ id: p.id, display_order: p.display_order }));
      await adminFetch('/projects/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: itemsToSave }),
      });
    } catch (e: any) {
      alert(`Error saving order: ${e.message}`);
      fetchData(); // Rollback
    } finally {
      setIsSavingOrder(false);
    }
  };
  // ⭐️ --- จบ Logic Drag & Drop ---

  return (
    <main className="container mx-auto p-8">
      {/* ... (ส่วน Header, Loading, Error, Empty State เหมือนเดิม) ... */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects Management</h1>
        <Button onClick={openCreateForm}>
          <PlusCircle />
          Add Project
        </Button>
      </div>

      {isSavingOrder && (
        <div className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
          <Loader2 className="size-4 animate-spin" /> Saving new order...
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-lg text-muted-foreground">
            No projects found. Click "Add Project" to get started.
          </p>
        </div>
      )}

      {/* ... (Table Rendering เหมือนเดิม, อย่าลืมแก้ Hydration Error) ... */}
      {!loading && !error && projects.length > 0 && (
        <div className="border rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />{/* ⭐️ แก้ Hydration */}
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  draggable
                  onDragStart={() => handleDragStart(project.id)}
                  onDragEnter={() => handleDragEnter(project.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    'cursor-move',
                    dragItem.current === project.id && 'opacity-30',
                    dragOverItem.current === project.id && 'bg-muted'
                  )}
                >
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="size-5" />
                  </TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>
                    {project.categoryName || getCategoryName(project.category_id)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.description}
                  </TableCell>
                  <TableCell className="text-center">
                    {project.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        togglePublished(project.id, project.is_published)
                      }
                    >
                      {project.is_published ? <Eye /> : <EyeOff />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEditForm(project)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() =>
                          handleDelete(project.id, project.title)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* ... (Modal Header, Form Fields: Title, Category, Description เหมือนเดิม) ... */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Project' : 'Create Project'}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsFormOpen(false)}
              >
                <X />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Project description"
                />
              </div>

              {/* ⭐️ 4. อัปเดต onUploadSuccess */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Image
                </label>
                <ImageUploader
                  value={formData.image}
                  onUploadSuccess={(result) => {
                    if (result) {
                      setFormData({
                        ...formData,
                        image: result.url, // สำหรับ Preview
                        tempImageKey: result.key, // สำหรับส่งให้ Backend
                      });
                    } else {
                      // เมื่อกดลบรูป
                      setFormData({
                        ...formData,
                        image: '',
                        tempImageKey: '',
                      });
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
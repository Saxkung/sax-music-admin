/* sax-music-admin/src/app/projects/page.tsx (อัปเดตใหม่) */
'use client';

import { useEffect, useState, useRef, DragEvent, useMemo } from 'react';
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

// ... (Interface Project, Category, FormData, initialFormData ... ไม่เปลี่ยนแปลง)
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

interface FormData {
  id: string;
  title: string;
  description: string;
  image: string;
  category_id: string;
  tempImageKey?: string;
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

  // ⭐️ 1. เปลี่ยนค่าเริ่มต้นเป็น ""
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  // Refs สำหรับ Drag & Drop
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
      
      // ⭐️ 2. ตั้งค่า Category แรกเป็น Default
      if (categoriesData.length > 0 && selectedCategoryId === '') {
        setSelectedCategoryId(categoriesData[0].id);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // ⭐️ เอา [selectedCategoryId] ออก

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      // ⭐️ 3. ตั้งค่า Category ปัจจุบัน
      category_id: selectedCategoryId,
    });
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
      tempImageKey: '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // ... ( handleSubmit ... ไม่เปลี่ยนแปลง)
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
            image: formData.image,
            category_id: formData.category_id,
            tempImageKey: formData.tempImageKey,
          }),
        });
      } else {
        // Create
        const id =
          formData.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') +
          '_' +
          Date.now();
          
        await adminFetch('/projects', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            id,
            display_order: projects.length, // ⭐️ order จะถูกจัดใหม่ใน Category
          }),
        });
      }
      setIsFormOpen(false);
      fetchData(); // ⭐️ Refresh ข้อมูลทั้งหมด
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    // ... ( handleDelete ... ไม่เปลี่ยนแปลง)
    if (!confirm(`ต้องการลบ "${title}" หรือไม่? Tracks ทั้งหมดจะถูกลบด้วย`))
      return;

    try {
      await adminFetch(`/projects/${id}`, { method: 'DELETE' });
      fetchData(); // ⭐️ Refresh ข้อมูลทั้งหมด
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const togglePublished = async (id: string, currentPublished: boolean) => {
    // ... ( togglePublished ... ไม่เปลี่ยนแปลง)
    try {
      await adminFetch(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !currentPublished }),
      });
      // ⭐️ อัปเดต State ทันที (Optimistic Update)
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === id ? { ...p, is_published: !currentPublished } : p
        )
      );
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      fetchData(); // Rollback
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  // ⭐️ 4. Logic การกรอง (ลบ 'all' case)
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => p.category_id === selectedCategoryId)
      .sort((a, b) => a.display_order - b.display_order); // ⭐️ จัดเรียงตาม Order
  }, [projects, selectedCategoryId]);


  // ⭐️ 5. --- Logic สำหรับ Drag & Drop (อัปเดตใหม่) ---
  const handleDragStart = (id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = (e: DragEvent<HTMLTableRowElement>) => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    
    // 1. ทำงานกับ List ที่กรองแล้วเท่านั้น
    const currentCategoryProjects = [...filteredProjects];
    const dragItemIndex = currentCategoryProjects.findIndex(p => p.id === dragItem.current);
    const dragOverItemIndex = currentCategoryProjects.findIndex(p => p.id === dragOverItem.current);
    
    if (dragItemIndex === -1 || dragOverItemIndex === -1) return;

    // 2. ย้าย Item ใน List ที่กรองแล้ว
    const [draggedItem] = currentCategoryProjects.splice(dragItemIndex, 1);
    currentCategoryProjects.splice(dragOverItemIndex, 0, draggedItem);
    
    // 3. อัปเดต display_order เฉพาะในกลุ่มนี้ (0...N)
    const reorderedCategoryProjects = currentCategoryProjects.map((p, index) => ({
      ...p,
      display_order: index,
    }));
    
    // 4. อัปเดต State หลัก
    const otherProjects = projects.filter(p => p.category_id !== selectedCategoryId);
    setProjects([...otherProjects, ...reorderedCategoryProjects]);
    
    dragItem.current = null;
    dragOverItem.current = null;

    // 5. ส่งเฉพาะ List ที่อัปเดตไปบันทึก
    saveOrder(reorderedCategoryProjects);
  };

  const saveOrder = async (updatedCategoryProjects: Project[]) => {
    setIsSavingOrder(true);
    try {
      const itemsToSave = updatedCategoryProjects.map(p => ({ 
        id: p.id, 
        display_order: p.display_order 
      }));
      
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
    <main className="container mx-auto p-4 md:p-8">
      {/* Header (Responsive) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Projects Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
            disabled={categories.length === 0} // ⭐️ Disable ถ้าไม่มี Category
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {/* ⭐️ 6. ลบ "All Categories" */}
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={openCreateForm} 
            className="w-full md:w-auto"
            disabled={categories.length === 0} // ⭐️ Disable ถ้าไม่มี Category
          >
            <PlusCircle />
            Add Project
          </Button>
        </div>
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
        <div className="text-center p-8 border rounded-lg bg-card">
          <p className="text-lg text-muted-foreground">
            {categories.length === 0 
              ? 'Please create a Category first.' 
              : 'No projects found. Click "Add Project" to get started.'}
          </p>
        </div>
      )}

      {/* ⭐️ 7. ใช้ 'filteredProjects' */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="border rounded-lg shadow-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell max-w-xs">Description</TableHead>
                <TableHead className="hidden md:table-cell text-center">Order</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-center w-32 md:w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  draggable // ⭐️ 8. เปิด Drag & Drop
                  onDragStart={() => handleDragStart(project.id)}
                  onDragEnter={() => handleDragEnter(project.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    'cursor-move', // ⭐️ 8. เปิด Drag & Drop
                    dragItem.current === project.id && 'opacity-30',
                    dragOverItem.current === project.id && 'bg-muted'
                  )}
                >
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="size-5" />
                  </TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {project.categoryName || getCategoryName(project.category_id)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate">
                    {project.description}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    {project.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        togglePublished(project.id, project.is_published)
                      }
                    
                      title={project.is_published ? 'Unpublish Project' : 'Publish Project'}
                    >
                      {project.is_published ? <Eye /> : <EyeOff />}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1.5 md:gap-2">
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

      {/* ⭐️ 9. Modal Form (Responsive) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        image: result.url,
                        tempImageKey: result.key,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        image: '',
                        tempImageKey: '',
                      });
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
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
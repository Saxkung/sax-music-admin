/* sax-music-admin/src/app/categories/page.tsx (อัปเดต) */
'use client';

import { useEffect, useState, useRef, DragEvent } from 'react';
import { adminFetch } from '@/lib/adminFetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils'; // ⭐️ Import cn

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_visible: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false); // ⭐️ State สำหรับบันทึก

  // ⭐️ Ref สำหรับ Drag & Drop
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data: Category[] = await adminFetch('/categories');
      setCategories(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      alert('กรุณาใส่ชื่อ Category');
      return;
    }
    try {
      setIsCreating(true);
      const id = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await adminFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          id,
          name: newCategoryName,
          display_order: categories.length,
        }),
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await adminFetch(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName }),
      });
      setEditingId(null);
      fetchCategories();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ต้องการลบ "${name}" หรือไม่?`)) return;
    try {
      await adminFetch(`/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      await adminFetch(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_visible: !currentVisible }),
      });
      fetchCategories();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
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
      setCategories([...categories]); // Rerender
      return;
    }
    
    // สร้าง Array ใหม่
    const newCategories = [...categories];
    const dragItemIndex = newCategories.findIndex(c => c.id === dragItem.current);
    const dragOverItemIndex = newCategories.findIndex(c => c.id === dragOverItem.current);
    
    // ย้าย Item
    const [draggedItem] = newCategories.splice(dragItemIndex, 1);
    newCategories.splice(dragOverItemIndex, 0, draggedItem);
    
    // อัปเดต display_order ใน state
    const updatedCategories = newCategories.map((c, index) => ({
      ...c,
      display_order: index,
    }));
    
    setCategories(updatedCategories); // อัปเดต UI ทันที
    
    dragItem.current = null;
    dragOverItem.current = null;

    // เรียก API เพื่อบันทึก
    saveOrder(updatedCategories);
  };

  const saveOrder = async (updatedCategories: Category[]) => {
    setIsSavingOrder(true);
    try {
      const itemsToSave = updatedCategories.map(c => ({ id: c.id, display_order: c.display_order }));
      await adminFetch('/categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: itemsToSave }),
      });
    } catch (e: any) {
      alert(`Error saving order: ${e.message}`);
      fetchCategories(); // Rollback
    } finally {
      setIsSavingOrder(false);
    }
  };
  // ⭐️ --- จบ Logic Drag & Drop ---

  return (
    <main className="container mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            Add Category
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

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead className="w-12" />{/* Grip */}
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow 
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(category.id)}
                onDragEnter={() => handleDragEnter(category.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()} // ⭐️
                className={cn(
                  'cursor-move',
                  dragItem.current === category.id && 'opacity-30',
                  dragOverItem.current === category.id && 'bg-muted'
                )}
              >
                <TableCell className="text-muted-foreground">
                  <GripVertical className="size-5" />
                </TableCell>
                <TableCell>
                  {editingId === category.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-64"
                      onClick={(e) => e.stopPropagation()} // ⭐️
                      onDragStart={(e) => e.preventDefault()} // ⭐️
                    />
                  ) : (
                    <span className="font-medium">{category.name}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {category.display_order}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      toggleVisibility(category.id, category.is_visible)
                    }
                  >
                    {category.is_visible ? <Eye /> : <EyeOff />}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    {editingId === category.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(category.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditName(category.name);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
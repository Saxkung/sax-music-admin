/* sax-music-admin/src/app/tracks/page.tsx (อัปเดต) */
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
  Music,
  X,
  GripVertical,
} from 'lucide-react';
import { AudioUploader } from '@/components/ui/AudioUploader';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  category_id: string;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  src: string;
  project_id: string;
  display_order: number;
  // duration ถูกลบ
}

export default function TracksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // ⭐️ 1. ลบ duration ออกจาก formData
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    src: '',
  });

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<Project[]>('/projects');
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async (projectId: string) => {
    if (!projectId) return;

    try {
      setLoading(true);
      const data = await adminFetch<Track[]>(`/tracks/${projectId}`);
      setTracks(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTracks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ title: '', artist: '', src: '' }); // ⭐️ 1. ลบ duration
    setIsFormOpen(true);
  };

  const openEditForm = (track: Track) => {
    setEditingId(track.id);
    setFormData({
      title: track.title,
      artist: track.artist,
      src: track.src,
      // ⭐️ 1. ลบ duration
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.src) {
      alert('กรุณากรอก Title และ Source URL');
      return;
    }

    try {
      if (editingId) {
        await adminFetch(`/tracks/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await adminFetch('/tracks', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            project_id: selectedProjectId,
            display_order: tracks.length,
          }),
        });
      }
      setIsFormOpen(false);
      fetchTracks(selectedProjectId);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`ต้องการลบ "${title}" หรือไม่?`)) return;

    try {
      await adminFetch(`/tracks/${id}`, { method: 'DELETE' });
      fetchTracks(selectedProjectId);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // ⭐️ --- Logic สำหรับ Drag & Drop ---
  const handleDragStart = (id: number) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id: number) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = (e: DragEvent<HTMLTableRowElement>) => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      setTracks([...tracks]); // Rerender
      return;
    }
    
    const newTracks = [...tracks];
    const dragItemIndex = newTracks.findIndex(t => t.id === dragItem.current);
    const dragOverItemIndex = newTracks.findIndex(t => t.id === dragOverItem.current);
    
    const [draggedItem] = newTracks.splice(dragItemIndex, 1);
    newTracks.splice(dragOverItemIndex, 0, draggedItem);
    
    const updatedTracks = newTracks.map((t, index) => ({
      ...t,
      display_order: index,
    }));
    
    setTracks(updatedTracks);
    
    dragItem.current = null;
    dragOverItem.current = null;

    saveOrder(updatedTracks);
  };

  const saveOrder = async (updatedTracks: Track[]) => {
    setIsSavingOrder(true);
    try {
      const itemsToSave = updatedTracks.map(t => ({ id: t.id, display_order: t.display_order }));
      await adminFetch('/tracks/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: itemsToSave }),
      });
    } catch (e: any) {
      alert(`Error saving order: ${e.message}`);
      fetchTracks(selectedProjectId); // Rollback
    } finally {
      setIsSavingOrder(false);
    }
  };
  // ⭐️ --- จบ Logic Drag & Drop ---


  return (
    <main className="container mx-auto p-8">
      {/* ⭐️ ปรับ Header (Responsive) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Tracks Management</h1>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex-1 w-full md:w-64">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={openCreateForm}
            disabled={!selectedProjectId}
            className="w-full md:w-auto"
          >
            <PlusCircle />
            Add Track
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

      {!loading && !error && selectedProjectId && tracks.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            No tracks in this project. Click "Add Track" to get started.
          </p>
        </div>
      )}

      {!loading && !error && tracks.length > 0 && (
        <div className="border rounded-lg shadow-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Artist</TableHead>
                <TableHead className="hidden md:table-cell text-center w-24">Order</TableHead>
                <TableHead className="text-center w-32 md:w-40">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow
                  key={track.id}
                  draggable
                  onDragStart={() => handleDragStart(track.id)}
                  onDragEnter={() => handleDragEnter(track.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    'cursor-move',
                    dragItem.current === track.id && 'opacity-30',
                    dragOverItem.current === track.id && 'bg-muted'
                  )}
                >
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="size-5" />
                  </TableCell>
                  <TableCell className="font-medium">{track.title}</TableCell>
                  {/* ⭐️ 2. ซ่อน Artist บนจอมือถือ (sm) */}
                  <TableCell className="hidden sm:table-cell">{track.artist || '-'}</TableCell>
                  
                  {/* ⭐️ 3. ซ่อน Order บนจอมือถือ (md) */}
                  <TableCell className="hidden md:table-cell text-center">
                    {track.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEditForm(track)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDelete(track.id, track.title)}
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
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Track' : 'Add Track'}
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
                  placeholder="Track title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Artist
                </label>
                <Input
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  placeholder="Artist name"
                />
              </div>

              {/* ⭐️ ใช้ AudioUploader แทน Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Source File * (HLS m3u8, mp3, etc.)
                </label>
                <AudioUploader
                  value={formData.src}
                  onUploadSuccess={(url) => {
                    setFormData({ ...formData, src: url });
                  }}
                />
                <Input
                  value={formData.src}
                  onChange={(e) =>
                    setFormData({ ...formData, src: e.target.value })
                  }
                  placeholder="หรือวาง URL โดยตรง (https://...)"
                  className='mt-2'
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (seconds)
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="240"
                />
              </div>

              {/* ⭐️ 1. ลบช่องกรอก Duration ออก */}
              
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
import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Save,
} from 'lucide-react';

interface ServiceFichaEditorProps {
  serviceId: string;
  initialFichaHtml: string;
  initialCategoria: string;
  initialFichaResumen: string;
}

export default function ServiceFichaEditor({
  serviceId,
  initialFichaHtml,
  initialCategoria,
  initialFichaResumen,
}: ServiceFichaEditorProps) {
  const { toast } = useToast();
  const [categoria, setCategoria] = useState(initialCategoria);
  const [fichaResumen, setFichaResumen] = useState(initialFichaResumen);
  const [categoriaOptions, setCategoriaOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchCategorias = useCallback(async () => {
    const { data } = await supabase
      .from('services')
      .select('categoria')
      .not('categoria', 'is', null)
      .neq('categoria', '')
      .neq('id', serviceId);
    if (data) {
      const unique = [...new Set(data.map((s: any) => s.categoria).filter(Boolean))] as string[];
      setCategoriaOptions(unique.sort());
    }
  }, [serviceId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Escribe la ficha comercial del servicio aquí...' }),
    ],
    content: initialFichaHtml || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none p-4',
      },
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `ficha-images/${serviceId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('company-assets')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path);

      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
    } catch (err: any) {
      toast({
        title: 'Error al subir imagen',
        description: err?.message ?? String(err),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const ficha_html = editor.getHTML();
      const { error } = await supabase
        .from('services')
        .update({ ficha_html, categoria: categoria || null, ficha_resumen: fichaResumen || null } as any)
        .eq('id', serviceId);

      if (error) throw error;
      toast({ title: 'Ficha guardada correctamente' });
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err?.message ?? String(err),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoría del servicio</Label>
        <Input
          id="categoria"
          list="categoria-options"
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          onFocus={fetchCategorias}
          placeholder="Ej: Alarmas, Rastreo, Inmovilizadores..."
          className="max-w-sm"
        />
        <datalist id="categoria-options">
          {categoriaOptions.map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {/* Editor Tiptap */}
      <div className="space-y-2">
        <Label>Contenido de la ficha</Label>

        <div className="flex flex-wrap gap-1 p-2 border rounded-t-md bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor?.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <label className="cursor-pointer">
            <Button type="button" variant="ghost" size="sm" asChild>
              <span>
                <ImageIcon className="h-4 w-4" />
                {uploading && <span className="ml-1 text-xs">Subiendo...</span>}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="border rounded-b-md bg-background min-h-[300px]">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar ficha'}
        </Button>
      </div>
    </div>
  );
}

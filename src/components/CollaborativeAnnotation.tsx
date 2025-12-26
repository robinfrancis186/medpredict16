import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Circle, 
  Square, 
  Type, 
  Trash2, 
  Users,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Annotation {
  id: string;
  scan_id: string;
  user_id: string;
  annotation_type: string;
  x_position: number;
  y_position: number;
  width?: number;
  height?: number;
  content?: string;
  color: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface CollaborativeAnnotationProps {
  scanId: string;
  imageUrl?: string;
  onAnnotationChange?: (count: number) => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

type Tool = 'select' | 'marker' | 'region' | 'text';

export function CollaborativeAnnotation({ scanId, imageUrl, onAnnotationChange }: CollaborativeAnnotationProps) {
  const { user, profile } = useAuth();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnnotations();
    subscribeToChanges();
  }, [scanId]);

  const fetchAnnotations = async () => {
    const { data } = await supabase
      .from('scan_annotations')
      .select('*')
      .eq('scan_id', scanId)
      .order('created_at', { ascending: true });
    
    // Fetch user profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { user_id: string; full_name: string }>);
      
      const annotationsWithProfiles = data.map(a => ({
        ...a,
        profiles: profileMap[a.user_id]
      }));
      
      setAnnotations(annotationsWithProfiles as Annotation[]);
      onAnnotationChange?.(annotationsWithProfiles.length);
    } else {
      setAnnotations([]);
      onAnnotationChange?.(0);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`scan-annotations-${scanId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_annotations',
          filter: `scan_id=eq.${scanId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnnotations(prev => [...prev, payload.new as Annotation]);
            onAnnotationChange?.(annotations.length + 1);
          } else if (payload.eventType === 'DELETE') {
            setAnnotations(prev => prev.filter(a => a.id !== payload.old.id));
            onAnnotationChange?.(annotations.length - 1);
          } else if (payload.eventType === 'UPDATE') {
            setAnnotations(prev => prev.map(a => a.id === payload.new.id ? payload.new as Annotation : a));
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((p: any) => p.user_name);
        setActiveUsers([...new Set(users)]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile) {
          await channel.track({ user_name: profile.full_name });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getRelativePosition = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    const pos = getRelativePosition(e);
    
    if (selectedTool === 'marker') {
      addAnnotation('marker', pos.x, pos.y);
    } else if (selectedTool === 'text') {
      setTextPosition(pos);
    } else if (selectedTool === 'region') {
      setIsDrawing(true);
      setDrawStart(pos);
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    
    const pos = getRelativePosition(e);
    const width = Math.abs(pos.x - drawStart.x);
    const height = Math.abs(pos.y - drawStart.y);
    
    if (width > 2 && height > 2) {
      await addAnnotation('region', Math.min(pos.x, drawStart.x), Math.min(pos.y, drawStart.y), width, height);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
  };

  const addAnnotation = async (type: string, x: number, y: number, width?: number, height?: number, content?: string) => {
    if (!user) return;

    const { error } = await supabase.from('scan_annotations').insert({
      scan_id: scanId,
      user_id: user.id,
      annotation_type: type,
      x_position: x,
      y_position: y,
      width,
      height,
      content,
      color: selectedColor
    });

    if (error) {
      toast.error('Failed to add annotation');
    }
  };

  const handleTextSubmit = async () => {
    if (!textPosition || !textInput.trim()) return;
    
    await addAnnotation('text', textPosition.x, textPosition.y, undefined, undefined, textInput);
    setTextInput('');
    setTextPosition(null);
  };

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase.from('scan_annotations').delete().eq('id', id);
    if (error) toast.error('Failed to delete annotation');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            Collaborative Annotations
          </CardTitle>
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 3).map((name, i) => (
                  <Avatar key={i} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {activeUsers.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{activeUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={selectedTool === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('select')}
              className="h-8 px-2"
            >
              Select
            </Button>
            <Button
              variant={selectedTool === 'marker' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('marker')}
              className="h-8 px-2"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedTool === 'region' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('region')}
              className="h-8 px-2"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedTool === 'text' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('text')}
              className="h-8 px-2"
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Palette className="w-4 h-4" />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Badge variant="outline" className="ml-auto">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Image with Annotations */}
        <div
          ref={containerRef}
          className={cn(
            "relative aspect-square bg-muted rounded-lg overflow-hidden border",
            selectedTool !== 'select' && "cursor-crosshair"
          )}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Scan" className="w-full h-full object-contain pointer-events-none" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Upload a scan to annotate
            </div>
          )}

          {/* Render Annotations */}
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className="absolute group"
              style={{
                left: `${annotation.x_position}%`,
                top: `${annotation.y_position}%`,
                width: annotation.width ? `${annotation.width}%` : undefined,
                height: annotation.height ? `${annotation.height}%` : undefined,
              }}
            >
              {annotation.annotation_type === 'marker' && (
                <div
                  className="w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                  style={{ backgroundColor: annotation.color }}
                />
              )}
              {annotation.annotation_type === 'region' && (
                <div
                  className="w-full h-full border-2 rounded"
                  style={{ borderColor: annotation.color, backgroundColor: `${annotation.color}20` }}
                />
              )}
              {annotation.annotation_type === 'text' && (
                <div
                  className="px-2 py-1 rounded text-xs text-white shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: annotation.color }}
                >
                  {annotation.content}
                </div>
              )}
              
              {/* Delete button on hover */}
              {annotation.user_id === user?.id && (
                <button
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Drawing preview */}
          {isDrawing && drawStart && (
            <div
              className="absolute border-2 border-dashed rounded pointer-events-none"
              style={{
                left: `${drawStart.x}%`,
                top: `${drawStart.y}%`,
                borderColor: selectedColor
              }}
            />
          )}
        </div>

        {/* Text Input Dialog */}
        {textPosition && (
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter annotation text..."
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              autoFocus
            />
            <Button onClick={handleTextSubmit} disabled={!textInput.trim()}>
              Add
            </Button>
            <Button variant="outline" onClick={() => setTextPosition(null)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Annotation List */}
        {annotations.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {annotations.map(annotation => (
              <div key={annotation.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: annotation.color }} />
                <span className="text-muted-foreground">{annotation.profiles?.full_name || 'Unknown'}:</span>
                <span className="capitalize">{annotation.annotation_type}</span>
                {annotation.content && <span className="text-muted-foreground">- {annotation.content}</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

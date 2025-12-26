import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowLeftRight, Calendar, TrendingUp, TrendingDown, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskBadge } from '@/components/RiskBadge';

interface Scan {
  id: string;
  patient_id: string;
  scan_type: string;
  created_at: string;
  image_url: string | null;
  risk_level: string | null;
  confidence_score: number | null;
  abnormality_score: number | null;
  diagnosis_probability: number | null;
  ai_explanation: string | null;
}

interface ComparativeScanViewerProps {
  patientId: string;
  currentScanId?: string;
  onClose?: () => void;
}

export function ComparativeScanViewer({ patientId, currentScanId, onClose }: ComparativeScanViewerProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [leftScanId, setLeftScanId] = useState<string>('');
  const [rightScanId, setRightScanId] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, [patientId]);

  useEffect(() => {
    if (currentScanId && scans.length > 0) {
      setRightScanId(currentScanId);
      // Set left to the previous scan if available
      const currentIndex = scans.findIndex(s => s.id === currentScanId);
      if (currentIndex > 0) {
        setLeftScanId(scans[currentIndex - 1].id);
      } else if (scans.length > 1) {
        setLeftScanId(scans[1].id);
      }
    }
  }, [currentScanId, scans]);

  const fetchScans = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('medical_scans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    setScans(data || []);
    setIsLoading(false);
  };

  const leftScan = scans.find(s => s.id === leftScanId);
  const rightScan = scans.find(s => s.id === rightScanId);

  const getChangeIndicator = (left: number | null, right: number | null) => {
    if (left === null || right === null) return null;
    const diff = right - left;
    if (Math.abs(diff) < 0.01) return { icon: Minus, color: 'text-muted-foreground', text: 'No change' };
    if (diff > 0) return { icon: TrendingUp, color: 'text-destructive', text: `+${(diff * 100).toFixed(1)}%` };
    return { icon: TrendingDown, color: 'text-green-500', text: `${(diff * 100).toFixed(1)}%` };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading scan history...
        </CardContent>
      </Card>
    );
  }

  if (scans.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Need at least 2 scans for comparison.</p>
          <p className="text-sm mt-2">Current scans: {scans.length}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Comparative Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Historical Scan</label>
            <Select value={leftScanId} onValueChange={setLeftScanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select scan..." />
              </SelectTrigger>
              <SelectContent>
                {scans.filter(s => s.id !== rightScanId).map(scan => (
                  <SelectItem key={scan.id} value={scan.id}>
                    {scan.scan_type} - {format(new Date(scan.created_at), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Scan</label>
            <Select value={rightScanId} onValueChange={setRightScanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select scan..." />
              </SelectTrigger>
              <SelectContent>
                {scans.filter(s => s.id !== leftScanId).map(scan => (
                  <SelectItem key={scan.id} value={scan.id}>
                    {scan.scan_type} - {format(new Date(scan.created_at), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Side by Side Comparison */}
        {leftScan && rightScan && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Left Scan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(leftScan.created_at), 'MMM d, yyyy')}
                  </Badge>
                  {leftScan.risk_level && (
                    <RiskBadge level={leftScan.risk_level as 'low' | 'medium' | 'high'} />
                  )}
                </div>
                <div 
                  className="aspect-square bg-muted rounded-lg overflow-hidden border"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                  {leftScan.image_url ? (
                    <img 
                      src={leftScan.image_url} 
                      alt="Historical scan" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>
              </div>

              {/* Right Scan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(rightScan.created_at), 'MMM d, yyyy')}
                  </Badge>
                  {rightScan.risk_level && (
                    <RiskBadge level={rightScan.risk_level as 'low' | 'medium' | 'high'} />
                  )}
                </div>
                <div 
                  className="aspect-square bg-muted rounded-lg overflow-hidden border"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                  {rightScan.image_url ? (
                    <img 
                      src={rightScan.image_url} 
                      alt="Current scan" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Comparison */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Metric Changes</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {/* Abnormality Score */}
                <div className="space-y-1">
                  <p className="text-muted-foreground">Abnormality Score</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {leftScan.abnormality_score !== null 
                        ? `${Math.round((leftScan.abnormality_score || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">
                      {rightScan.abnormality_score !== null 
                        ? `${Math.round((rightScan.abnormality_score || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                    {(() => {
                      const change = getChangeIndicator(leftScan.abnormality_score, rightScan.abnormality_score);
                      if (!change) return null;
                      return (
                        <span className={cn("flex items-center gap-1", change.color)}>
                          <change.icon className="w-3 h-3" />
                          {change.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Diagnosis Probability */}
                <div className="space-y-1">
                  <p className="text-muted-foreground">Diagnosis Probability</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {leftScan.diagnosis_probability !== null 
                        ? `${Math.round((leftScan.diagnosis_probability || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">
                      {rightScan.diagnosis_probability !== null 
                        ? `${Math.round((rightScan.diagnosis_probability || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="space-y-1">
                  <p className="text-muted-foreground">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {leftScan.confidence_score !== null 
                        ? `${Math.round((leftScan.confidence_score || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">
                      {rightScan.confidence_score !== null 
                        ? `${Math.round((rightScan.confidence_score || 0) * 100)}%` 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Findings Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Previous Findings</p>
                <p className="text-sm">{leftScan.ai_explanation || 'No findings recorded'}</p>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Current Findings</p>
                <p className="text-sm">{rightScan.ai_explanation || 'No findings recorded'}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

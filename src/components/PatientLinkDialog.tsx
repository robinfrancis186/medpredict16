import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link2, Loader2, Search, User, Mail, CheckCircle } from 'lucide-react';

interface PatientLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  currentEmail: string | null;
  onSuccess: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export function PatientLinkDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  currentEmail,
  onSuccess,
}: PatientLinkDialogProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setSearchPerformed(true);
    setFoundUser(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .ilike('email', searchEmail.trim())
        .maybeSingle();

      if (error) throw error;
      setFoundUser(data);
    } catch (error: any) {
      console.error('Error searching for user:', error);
      toast.error('Search failed', { description: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async () => {
    if (!foundUser) return;
    setIsLinking(true);

    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          created_by: foundUser.user_id,
          email: foundUser.email 
        })
        .eq('id', patientId);

      if (error) throw error;

      toast.success('Patient linked', {
        description: `${patientName} is now linked to ${foundUser.email}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error linking patient:', error);
      toast.error('Failed to link', { description: error.message });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsLinking(true);

    try {
      const { error } = await supabase
        .from('patients')
        .update({ created_by: null })
        .eq('id', patientId);

      if (error) throw error;

      toast.success('Patient unlinked', {
        description: `${patientName} is no longer linked to a user account`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error unlinking patient:', error);
      toast.error('Failed to unlink', { description: error.message });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Link Patient to User Account
          </DialogTitle>
          <DialogDescription>
            Connect {patientName}'s record to a registered user account for portal access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentEmail && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-1">Currently linked to:</p>
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentEmail}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={isLinking}
                  className="text-destructive hover:text-destructive"
                >
                  Unlink
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Search User by Email</Label>
            <div className="flex gap-2">
              <Input
                placeholder="patient@email.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching || !searchEmail.trim()}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {searchPerformed && (
            <div className="mt-4">
              {foundUser ? (
                <div className="p-4 rounded-lg border border-chart-2/30 bg-chart-2/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-chart-2/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="font-medium">{foundUser.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {foundUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLink}
                    disabled={isLinking}
                    className="w-full"
                    variant="medical"
                  >
                    {isLinking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Link to This User
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-muted/50 text-center">
                  <p className="text-muted-foreground">
                    No registered user found with that email.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The user must sign up first before you can link them.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
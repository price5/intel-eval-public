import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Edit, Mail, User, Lock } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { EditFieldDialog } from './EditFieldDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';

export const MyAccountSection: React.FC = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<'username' | 'name' | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!profile || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Manage your account credentials and personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>
            <div className="flex gap-2">
              <Input value={profile.username} disabled className="bg-muted" />
              <Button variant="outline" size="icon" onClick={() => setEditingField('username')}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <div className="flex gap-2">
              <Input value={profile.full_name} disabled className="bg-muted" />
              <Button variant="outline" size="icon" onClick={() => setEditingField('name')}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input value={user.email} disabled className="bg-muted cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <div className="flex gap-2">
              <Input type="password" value="••••••••" disabled className="bg-muted" />
              <Button variant="outline" size="icon" onClick={() => setChangePasswordOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditFieldDialog
        open={editingField === 'username'}
        onOpenChange={(open) => !open && setEditingField(null)}
        fieldName="Username"
        fieldKey="username"
        currentValue={profile.username}
        userId={profile.user_id}
      />

      <EditFieldDialog
        open={editingField === 'name'}
        onOpenChange={(open) => !open && setEditingField(null)}
        fieldName="Full Name"
        fieldKey="full_name"
        currentValue={profile.full_name}
        userId={profile.user_id}
      />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

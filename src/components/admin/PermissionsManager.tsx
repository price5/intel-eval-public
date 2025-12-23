import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, User, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Permission {
  type: 'role' | 'user';
  targetId: string;
  view: boolean;
  send: boolean;
}

interface PermissionsManagerProps {
  entityType: 'channel' | 'category';
  entityId: string;
  permissions: Permission[];
  onUpdate: () => void;
  categoryId?: string; // For channels to fetch category permissions
  categoryName?: string; // For displaying inheritance source
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  entityType,
  entityId,
  permissions,
  onUpdate,
  categoryId,
  categoryName,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionType, setPermissionType] = useState<'role' | 'user'>('role');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [viewAccess, setViewAccess] = useState(true);
  const [sendAccess, setSendAccess] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [roles] = useState(['admin', 'moderator', 'user']);
  const [inheritedPermissions, setInheritedPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    fetchUsers();
    if (entityType === 'channel' && categoryId) {
      fetchCategoryPermissions();
    }
  }, [entityType, categoryId]);

  const fetchCategoryPermissions = async () => {
    if (!categoryId) return;

    const { data } = await supabase
      .from('chat_categories')
      .select('permissions')
      .eq('id', categoryId)
      .single();

    if (data && data.permissions) {
      setInheritedPermissions(data.permissions as any as Permission[]);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username')
      .order('full_name');
    setUsers(data || []);
  };

  const handleAddPermission = async () => {
    if (!selectedTarget) {
      toast.error('Please select a user or role');
      return;
    }

    const updatedPermissions = [
      ...permissions,
      {
        type: permissionType,
        targetId: selectedTarget,
        view: viewAccess,
        send: sendAccess,
      },
    ];

    const table = entityType === 'channel' ? 'chat_channels' : 'chat_categories';
    const { error } = await supabase
      .from(table)
      .update({ permissions: updatedPermissions as any })
      .eq('id', entityId);

    if (error) {
      toast.error('Failed to add permission');
      return;
    }

    toast.success('Permission added');
    setDialogOpen(false);
    setSelectedTarget('');
    setViewAccess(true);
    setSendAccess(true);
    onUpdate();
  };

  const handleRemovePermission = async (index: number) => {
    const updatedPermissions = permissions.filter((_, i) => i !== index);

    const table = entityType === 'channel' ? 'chat_channels' : 'chat_categories';
    const { error } = await supabase
      .from(table)
      .update({ permissions: updatedPermissions as any })
      .eq('id', entityId);

    if (error) {
      toast.error('Failed to remove permission');
      return;
    }

    toast.success('Permission removed');
    onUpdate();
  };

  const getTargetName = (permission: Permission) => {
    if (permission.type === 'role') {
      return permission.targetId;
    }
    const user = users.find((u) => u.user_id === permission.targetId);
    return user ? `${user.full_name} (@${user.username})` : 'Unknown User';
  };

  const handleClearOverride = async () => {
    if (!confirm('Clear all channel-specific permissions and inherit from category?')) {
      return;
    }

    const { error } = await supabase
      .from('chat_channels')
      .update({ permissions: [] as any })
      .eq('id', entityId);

    if (error) {
      toast.error('Failed to clear permissions');
      return;
    }

    toast.success('Permissions cleared. Channel now inherits from category.');
    onUpdate();
  };

  const hasDirectPermissions = permissions.length > 0;
  const hasInheritedPermissions = entityType === 'channel' && inheritedPermissions.length > 0;
  const effectivePermissions = hasDirectPermissions ? permissions : inheritedPermissions;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[hsl(215,60%,60%)]" />
          <h4 className="text-sm font-medium text-foreground/90">Permissions</h4>
          {entityType === 'channel' && (
            <div className="flex items-center gap-1.5">
              {hasInheritedPermissions && !hasDirectPermissions && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,46%)] border border-[hsl(142,76%,36%)]/20 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Inherited
                </span>
              )}
              {hasDirectPermissions && hasInheritedPermissions && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,57%)] border border-[hsl(45,93%,47%)]/20 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Override
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entityType === 'channel' && hasDirectPermissions && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearOverride}
              className="h-8 bg-[hsl(210,18%,16%)] border-[hsl(215,15%,25%)] hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
            >
              Clear Override
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="h-8 bg-[hsl(210,18%,16%)] border-[hsl(215,15%,25%)] hover:bg-[hsl(210,20%,20%)]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Inherited Permissions (for channels) */}
      {entityType === 'channel' && hasInheritedPermissions && !hasDirectPermissions && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[hsl(142,76%,36%)]/5 border border-[hsl(142,76%,36%)]/20 rounded-md">
            <Layers className="h-3.5 w-3.5 text-[hsl(142,76%,46%)]" />
            <span className="text-xs font-medium text-[hsl(142,76%,46%)]">
              Inherited from {categoryName || 'category'}
            </span>
          </div>
          {inheritedPermissions.map((permission, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[hsl(142,76%,36%)]/5 border border-[hsl(142,76%,36%)]/15 rounded-md opacity-75"
            >
              <div className="flex items-center gap-3">
                {permission.type === 'role' ? (
                  <Users className="h-4 w-4 text-[hsl(142,76%,46%)]" />
                ) : (
                  <User className="h-4 w-4 text-[hsl(142,76%,46%)]" />
                )}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground/70">
                    {getTargetName(permission)}
                  </div>
                  <div className="flex gap-2">
                    {permission.view && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(215,60%,60%)]/10 text-[hsl(215,60%,70%)] border border-[hsl(215,60%,60%)]/20">
                        View
                      </span>
                    )}
                    {permission.send && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,46%)] border border-[hsl(142,76%,36%)]/20">
                        Send
                      </span>
                    )}
                    {!permission.view && !permission.send && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        No Access
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground italic">Inherited</span>
            </div>
          ))}
          <div className="px-2 py-2 text-xs text-muted-foreground bg-[hsl(210,18%,12%)] border border-[hsl(215,15%,20%)] rounded-md">
            💡 <strong>Tip:</strong> Add a permission rule below to override category permissions for this channel.
          </div>
        </div>
      )}

      {/* Direct Permissions */}
      {permissions.length === 0 && (!hasInheritedPermissions || hasDirectPermissions) ? (
        <div className="text-xs text-muted-foreground italic bg-[hsl(210,18%,14%)] border border-[hsl(215,15%,20%)] rounded-md p-3">
          {entityType === 'channel' && hasInheritedPermissions
            ? `This channel uses inherited permissions from ${categoryName || 'its category'}.`
            : `No permissions set. Everyone can access this ${entityType}.`}
        </div>
      ) : permissions.length > 0 ? (
        <div className="space-y-2">
          {hasInheritedPermissions && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[hsl(45,93%,47%)]/5 border border-[hsl(45,93%,47%)]/20 rounded-md">
              <Layers className="h-3.5 w-3.5 text-[hsl(45,93%,57%)]" />
              <span className="text-xs font-medium text-[hsl(45,93%,57%)]">
                Channel-specific permissions (overriding {categoryName || 'category'})
              </span>
            </div>
          )}
          {permissions.map((permission, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[hsl(210,18%,14%)] border border-[hsl(215,15%,20%)] rounded-md hover:bg-[hsl(210,18%,16%)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {permission.type === 'role' ? (
                  <Users className="h-4 w-4 text-[hsl(215,60%,60%)]" />
                ) : (
                  <User className="h-4 w-4 text-[hsl(215,60%,60%)]" />
                )}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground/90">
                    {getTargetName(permission)}
                  </div>
                  <div className="flex gap-2">
                    {permission.view && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(215,60%,60%)]/10 text-[hsl(215,60%,70%)] border border-[hsl(215,60%,60%)]/20">
                        View
                      </span>
                    )}
                    {permission.send && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,46%)] border border-[hsl(142,76%,36%)]/20">
                        Send
                      </span>
                    )}
                    {!permission.view && !permission.send && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        No Access
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemovePermission(index)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[hsl(210,18%,12%)] border-[hsl(215,15%,25%)]">
          <DialogHeader>
            <DialogTitle>Add Permission Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Permission Type</Label>
              <Select
                value={permissionType}
                onValueChange={(value: any) => {
                  setPermissionType(value);
                  setSelectedTarget('');
                }}
              >
                <SelectTrigger className="bg-[hsl(210,18%,16%)] border-[hsl(215,15%,25%)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role-based</SelectItem>
                  <SelectItem value="user">User-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {permissionType === 'role' ? 'Select Role' : 'Select User'}
              </Label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger className="bg-[hsl(210,18%,16%)] border-[hsl(215,15%,25%)]">
                  <SelectValue
                    placeholder={
                      permissionType === 'role' ? 'Choose a role' : 'Choose a user'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {permissionType === 'role'
                    ? roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))
                    : users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} (@{user.username})
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2 border-t border-[hsl(215,15%,25%)]">
              <Label className="text-sm font-medium">Access Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="view-access"
                  checked={viewAccess}
                  onCheckedChange={(checked) => setViewAccess(checked as boolean)}
                />
                <label
                  htmlFor="view-access"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  View Access
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-access"
                  checked={sendAccess}
                  onCheckedChange={(checked) => setSendAccess(checked as boolean)}
                />
                <label
                  htmlFor="send-access"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send Messages
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPermission}>Add Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

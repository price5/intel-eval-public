import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, Code, MessagesSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AchievementManagement } from './AchievementManagement';
import { ChannelCategoryManagement } from './ChannelCategoryManagement';
import { PracticeProblemsManagement } from './PracticeProblemsManagement';
import { FeedbackManagement } from './FeedbackManagement';
import { UserManagement } from './UserManagement';
import { LeagueManagement } from './LeagueManagement';
import { LeagueOverview } from './LeagueOverview';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  profiles?: {
    full_name: string;
    username: string;
  };
}

interface Channel {
  id: string;
  name: string;
  category_id: string;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

export const AdminPanel: React.FC = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');
  
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      // Fetch all profiles for role assignment
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username')
        .order('full_name');

      // Enrich roles with profile data
      const enrichedRoles = rolesData?.map(role => {
        const profile = profilesData?.find(p => p.user_id === role.user_id);
        return {
          ...role,
          profiles: profile ? {
            full_name: profile.full_name,
            username: profile.username
          } : undefined
        };
      }) || [];

      // Fetch channels
      const { data: channelsData } = await supabase
        .from('chat_channels')
        .select('*')
        .order('display_order');

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('chat_categories')
        .select('*')
        .order('display_order');

      setUserRoles(enrichedRoles);
      setProfiles(profilesData || []);
      setChannels(channelsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: selectedRole,
        });

      if (error) throw error;

      toast.success('Role assigned successfully');
      setRoleDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('user');
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Failed to assign role');
      }
      console.error('Error assigning role:', error);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Role removed successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove role');
      console.error('Error removing role:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName || !selectedCategoryId) {
      toast.error('Please enter channel name and select category');
      return;
    }

    try {
      const maxOrder = Math.max(...channels.map(c => c.display_order), 0);
      
      const { error } = await supabase
        .from('chat_channels')
        .insert({
          name: newChannelName,
          category_id: selectedCategoryId,
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast.success('Channel created successfully');
      setChannelDialogOpen(false);
      setNewChannelName('');
      setSelectedCategoryId('');
      fetchData();
    } catch (error) {
      toast.error('Failed to create channel');
      console.error('Error creating channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel? All messages will be lost.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      toast.success('Channel deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete channel');
      console.error('Error deleting channel:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="channels">Channel Management</TabsTrigger>
          <TabsTrigger value="achievements">Achievement Management</TabsTrigger>
          <TabsTrigger value="practice-problems">Practice Problems</TabsTrigger>
          <TabsTrigger value="feedback">
            <MessagesSquare className="h-4 w-4 mr-2" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="leagues">League Actions</TabsTrigger>
          <TabsTrigger value="league-overview">League Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

          <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Roles</CardTitle>
              <Button onClick={() => setRoleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userRoles.map((userRole) => (
                  <div
                    key={userRole.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{userRole.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{userRole.profiles?.username}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                        {userRole.role}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRole(userRole.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <ChannelCategoryManagement />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementManagement />
        </TabsContent>

        <TabsContent value="practice-problems" className="space-y-4">
          <PracticeProblemsManagement />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackManagement />
        </TabsContent>

        <TabsContent value="leagues" className="space-y-4">
          <LeagueManagement />
        </TabsContent>

        <TabsContent value="league-overview" className="space-y-4">
          <LeagueOverview />
        </TabsContent>
      </Tabs>

      {/* Assign Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.full_name} (@{profile.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>Assign Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                placeholder="general"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel}>Create Channel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

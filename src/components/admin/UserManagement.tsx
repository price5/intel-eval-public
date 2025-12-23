import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  UserX, 
  UserCheck, 
  Ban, 
  ShieldOff, 
  Clock, 
  Calendar,
  Download,
  Upload,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ActivityTimeline } from './ActivityTimeline';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  role: string;
  college: string;
  usn: string;
  created_at: string;
  last_login_date: string | null;
  streak_count: number;
  days_active: number | null;
  is_suspended: boolean;
  is_banned: boolean;
  moderation_reason: string | null;
  moderation_expires_at: string | null;
}

interface UserStats {
  submissions_count: number;
  perfect_scores: number;
  level: number;
}

interface ModerationLog {
  id: string;
  action: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
  moderator_id: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Moderation dialog states
  const [moderationDialog, setModerationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [moderationAction, setModerationAction] = useState<'suspend' | 'ban' | 'unsuspend' | 'unban'>('suspend');
  const [moderationReason, setModerationReason] = useState('');
  const [moderationExpiry, setModerationExpiry] = useState<string>('');
  
  // User details dialog
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.full_name.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.usn.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.is_suspended && !user.is_banned);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(user => user.is_suspended);
      } else if (statusFilter === 'banned') {
        filtered = filtered.filter(user => user.is_banned);
      }
    }

    setFilteredUsers(filtered);
  };

  const openModerationDialog = (user: UserProfile, action: 'suspend' | 'ban' | 'unsuspend' | 'unban') => {
    setSelectedUser(user);
    setModerationAction(action);
    setModerationReason('');
    setModerationExpiry('');
    setModerationDialog(true);
  };

  const handleModeration = async () => {
    if (!selectedUser) return;
    
    // Only require reason for suspend and ban actions
    if ((moderationAction === 'suspend' || moderationAction === 'ban') && !moderationReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for this action',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile status
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (moderationAction === 'suspend') {
        updates.is_suspended = true;
        updates.moderation_reason = moderationReason;
        if (moderationExpiry) {
          updates.moderation_expires_at = moderationExpiry;
        }
      } else if (moderationAction === 'ban') {
        updates.is_banned = true;
        updates.moderation_reason = moderationReason;
        updates.moderation_expires_at = null; // Permanent
      } else if (moderationAction === 'unsuspend') {
        updates.is_suspended = false;
        updates.moderation_reason = null;
        updates.moderation_expires_at = null;
      } else if (moderationAction === 'unban') {
        updates.is_banned = false;
        updates.moderation_reason = null;
        updates.moderation_expires_at = null;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      // Log the moderation action
      const { error: logError } = await supabase
        .from('user_moderation_logs')
        .insert({
          user_id: selectedUser.user_id,
          action: moderationAction,
          reason: moderationReason,
          moderator_id: user.id,
          expires_at: moderationExpiry || null,
          is_active: true,
        });

      if (logError) throw logError;

      toast({
        title: 'Success',
        description: `User has been ${moderationAction === 'suspend' ? 'suspended' : moderationAction === 'ban' ? 'banned' : moderationAction === 'unsuspend' ? 'unsuspended' : 'unbanned'} successfully. ${moderationAction === 'suspend' || moderationAction === 'ban' ? 'They will see a notification on their next login.' : 'They now have full access restored.'}`,
      });

      setModerationDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error moderating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to moderate user',
        variant: 'destructive',
      });
    }
  };

  const openUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsDialog(true);

    // Fetch user stats
    try {
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      setUserStats(stats || null);

      // Fetch moderation logs
      const { data: logs, error: logsError } = await supabase
        .from('user_moderation_logs')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setModerationLogs(logs || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Full Name', 'Username', 'USN', 'Role', 'College', 'Status', 'Created At', 'Last Login'].join(','),
      ...filteredUsers.map(user =>
        [
          user.full_name,
          user.username,
          user.usn,
          user.role,
          user.college,
          user.is_banned ? 'Banned' : user.is_suspended ? 'Suspended' : 'Active',
          format(new Date(user.created_at), 'yyyy-MM-dd'),
          user.last_login_date ? format(new Date(user.last_login_date), 'yyyy-MM-dd') : 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Users exported successfully',
    });
  };

  const getUserStatusBadge = (user: UserProfile) => {
    if (user.is_banned) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Banned
        </Badge>
      );
    }
    if (user.is_suspended) {
      return (
        <Badge className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white gap-1">
          <Clock className="h-3 w-3" />
          Suspended
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white gap-1">
        <UserCheck className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users, view profiles, and moderate accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or USN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportUsers} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Users:</span>{' '}
              <span className="font-semibold">{users.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Filtered:</span>{' '}
              <span className="font-semibold">{filteredUsers.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Active:</span>{' '}
              <span className="font-semibold text-green-600">
                {users.filter(u => !u.is_suspended && !u.is_banned).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Suspended:</span>{' '}
              <span className="font-semibold text-orange-600">
                {users.filter(u => u.is_suspended).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Banned:</span>{' '}
              <span className="font-semibold text-red-600">
                {users.filter(u => u.is_banned).length}
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username} • {user.usn}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUserStatusBadge(user)}</TableCell>
                      <TableCell>
                        {user.last_login_date
                          ? format(new Date(user.last_login_date), 'MMM dd, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openUserDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!user.is_suspended && !user.is_banned && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => openModerationDialog(user, 'suspend')}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openModerationDialog(user, 'ban')}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.is_suspended && (
                              <DropdownMenuItem
                                onClick={() => openModerationDialog(user, 'unsuspend')}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Unsuspend User
                              </DropdownMenuItem>
                            )}
                            {user.is_banned && (
                              <DropdownMenuItem
                                onClick={() => openModerationDialog(user, 'unban')}
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog} onOpenChange={setModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{moderationAction} User</DialogTitle>
            <DialogDescription>
              {moderationAction === 'suspend' && 'Temporarily restrict this user\'s access'}
              {moderationAction === 'ban' && 'Permanently ban this user from the platform'}
              {moderationAction === 'unsuspend' && 'Restore this user\'s access'}
              {moderationAction === 'unban' && 'Remove the ban from this user'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="font-medium">{selectedUser.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  @{selectedUser.username}
                </div>
              </div>
            )}

            {(moderationAction === 'suspend' || moderationAction === 'ban') && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason for this action..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {moderationAction === 'suspend' && (
              <div className="space-y-2">
                <Label htmlFor="expiry">Suspension Expiry (Optional)</Label>
                <Input
                  id="expiry"
                  type="datetime-local"
                  value={moderationExpiry}
                  onChange={(e) => setModerationExpiry(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for indefinite suspension
                </p>
              </div>
            )}
            
            {(moderationAction === 'unsuspend' || moderationAction === 'unban') && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  This will restore full access for this user.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleModeration}
              variant={
                moderationAction === 'ban' || moderationAction === 'suspend' 
                  ? 'destructive' 
                  : 'default'
              }
              disabled={
                (moderationAction === 'suspend' || moderationAction === 'ban') && 
                !moderationReason.trim()
              }
            >
              {moderationAction === 'suspend' && 'Suspend User'}
              {moderationAction === 'ban' && 'Ban User'}
              {moderationAction === 'unsuspend' && 'Unsuspend User'}
              {moderationAction === 'unban' && 'Unban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Full Name</div>
                    <div className="font-medium">{selectedUser.full_name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Username</div>
                    <div className="font-medium">@{selectedUser.username}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">USN</div>
                    <div className="font-medium">{selectedUser.usn}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Role</div>
                    <div className="font-medium capitalize">{selectedUser.role}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">College</div>
                    <div className="font-medium">{selectedUser.college}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div>{getUserStatusBadge(selectedUser)}</div>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Activity</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Joined</div>
                    <div className="font-medium">
                      {format(new Date(selectedUser.created_at), 'PPP')}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Login</div>
                    <div className="font-medium">
                      {selectedUser.last_login_date
                        ? format(new Date(selectedUser.last_login_date), 'PPP')
                        : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Streak</div>
                    <div className="font-medium">{selectedUser.streak_count} days</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Days Active</div>
                    <div className="font-medium">{selectedUser.days_active || 0} days</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              {userStats && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Submissions</div>
                      <div className="font-medium">{userStats.submissions_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Perfect Scores</div>
                      <div className="font-medium">{userStats.perfect_scores}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Level</div>
                      <div className="font-medium">{userStats.level}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation Status */}
              {(selectedUser.is_suspended || selectedUser.is_banned) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Moderation Status</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      {getUserStatusBadge(selectedUser)}
                    </div>
                    {selectedUser.moderation_reason && (
                      <div>
                        <div className="text-sm text-muted-foreground">Reason</div>
                        <div className="text-sm">{selectedUser.moderation_reason}</div>
                      </div>
                    )}
                    {selectedUser.moderation_expires_at && (
                      <div>
                        <div className="text-sm text-muted-foreground">Expires</div>
                        <div className="text-sm">
                          {format(new Date(selectedUser.moderation_expires_at), 'PPP p')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Moderation History */}
              {moderationLogs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Moderation History</h3>
                  <div className="space-y-2">
                    {moderationLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="capitalize">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'PPp')}
                          </span>
                        </div>
                        <div className="text-muted-foreground">{log.reason}</div>
                        {log.expires_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Expires: {format(new Date(log.expires_at), 'PPp')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="pt-4">
                <ActivityTimeline userId={selectedUser.user_id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
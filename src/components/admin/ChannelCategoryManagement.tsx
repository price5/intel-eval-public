import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Edit2, Search, FolderPlus, Hash, Settings } from 'lucide-react';
import { PermissionsManager } from './PermissionsManager';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  category_id: string;
  display_order: number;
  permissions?: any[];
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  permissions?: any[];
}

export const ChannelCategoryManagement: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  // Dialog states
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);

  // Form states
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: channelsData } = await supabase
        .from('chat_channels')
        .select('*')
        .order('display_order');

      const { data: categoriesData } = await supabase
        .from('chat_categories')
        .select('*')
        .order('display_order');

      setChannels((channelsData || []) as any);
      setCategories((categoriesData || []) as any);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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

  const handleCreateCategory = async () => {
    if (!newCategoryName) {
      toast.error('Please enter category name');
      return;
    }

    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      
      const { error } = await supabase
        .from('chat_categories')
        .insert({
          name: newCategoryName,
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast.success('Category created successfully');
      setCategoryDialogOpen(false);
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
    }
  };

  const handleEditChannel = async () => {
    if (!editingChannel || !editChannelName) {
      toast.error('Please enter channel name');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_channels')
        .update({ name: editChannelName })
        .eq('id', editingChannel.id);

      if (error) throw error;

      toast.success('Channel updated successfully');
      setEditChannelDialogOpen(false);
      setEditingChannel(null);
      setEditChannelName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update channel');
      console.error('Error updating channel:', error);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryName) {
      toast.error('Please enter category name');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_categories')
        .update({ name: editCategoryName })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Category updated successfully');
      setEditCategoryDialogOpen(false);
      setEditingCategory(null);
      setEditCategoryName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
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

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryChannels = channels.filter(ch => ch.category_id === categoryId);
    
    if (categoryChannels.length > 0) {
      toast.error('Cannot delete category with existing channels. Please delete or move channels first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Category deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  const handleMoveChannel = async (channelId: string, newCategoryId: string) => {
    try {
      const { error } = await supabase
        .from('chat_channels')
        .update({ category_id: newCategoryId })
        .eq('id', channelId);

      if (error) throw error;

      toast.success('Channel moved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to move channel');
      console.error('Error moving channel:', error);
    }
  };

  const openEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setEditChannelName(channel.name);
    setEditChannelDialogOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryDialogOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isCategoryOpen = (categoryId: string) => !collapsedCategories.has(categoryId);

  const getChannelsForCategory = (categoryId: string) => {
    return channels.filter(ch => ch.category_id === categoryId);
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getChannelsForCategory(cat.id).some(ch => 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[hsl(210,18%,11%)] border-[hsl(210,18%,16%)]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl">Channels & Categories</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[hsl(215,60%,60%)] hover:bg-[hsl(215,60%,55%)] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setChannelDialogOpen(true)}>
                <Hash className="h-4 w-4 mr-2" />
                Create Channel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[hsl(210,18%,14%)] border-[hsl(210,18%,20%)] focus:border-[hsl(215,60%,60%)]/40"
            />
          </div>

          {/* Categories and Channels */}
          <div className="space-y-3">
            {filteredCategories.map(category => {
              const categoryChannels = getChannelsForCategory(category.id);
              const isOpen = isCategoryOpen(category.id);
              
              return (
                <Collapsible
                  key={category.id}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category.id)}
                  className="bg-[hsl(210,18%,14%)] rounded-lg border border-[hsl(210,18%,20%)] overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 hover:bg-[hsl(215,60%,60%)]/5 transition-colors">
                     <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-sm uppercase tracking-wide">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({categoryChannels.length})
                      </span>
                      {category.permissions && category.permissions.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(215,60%,60%)]/10 text-[hsl(215,60%,70%)] border border-[hsl(215,60%,60%)]/20">
                          {category.permissions.length} rule{category.permissions.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(expandedPermissions);
                              const key = `cat-${category.id}`;
                              if (newSet.has(key)) {
                                newSet.delete(key);
                              } else {
                                newSet.add(key);
                              }
                              setExpandedPermissions(newSet);
                            }}
                            className={`h-8 w-8 hover:bg-[hsl(215,60%,60%)]/10 ${
                              expandedPermissions.has(`cat-${category.id}`)
                                ? 'bg-[hsl(215,60%,60%)]/15 text-[hsl(215,60%,70%)]'
                                : ''
                            }`}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Manage Permissions</TooltipContent>
                      </Tooltip>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCategory(category);
                        }}
                        className="h-8 w-8 hover:bg-[hsl(215,60%,60%)]/10"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {expandedPermissions.has(`cat-${category.id}`) && (
                    <div className="px-3 pb-3 border-b border-[hsl(210,18%,20%)]">
                      <PermissionsManager
                        entityType="category"
                        entityId={category.id}
                        permissions={category.permissions || []}
                        onUpdate={fetchData}
                      />
                    </div>
                  )}
                  
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="space-y-1.5 mt-2 pl-6 border-l-2 border-[hsl(210,18%,20%)] ml-2">
                      {categoryChannels.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No channels in this category</p>
                      ) : (
                        categoryChannels.map(channel => (
                          <div key={channel.id} className="space-y-1.5">
                            <div className="flex items-center justify-between p-2.5 rounded-md bg-[hsl(210,18%,16%)] hover:bg-[hsl(215,60%,60%)]/8 transition-colors border border-transparent hover:border-[hsl(215,60%,60%)]/20 group">
                              <div className="flex items-center gap-2 flex-1">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{channel.name}</span>
                                {channel.permissions && channel.permissions.length > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[hsl(215,60%,60%)]/10 text-[hsl(215,60%,70%)] border border-[hsl(215,60%,60%)]/20">
                                    {channel.permissions.length}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newSet = new Set(expandedPermissions);
                                        if (newSet.has(channel.id)) {
                                          newSet.delete(channel.id);
                                        } else {
                                          newSet.add(channel.id);
                                        }
                                        setExpandedPermissions(newSet);
                                      }}
                                      className={`h-7 w-7 hover:bg-[hsl(215,60%,60%)]/10 ${
                                        expandedPermissions.has(channel.id)
                                          ? 'bg-[hsl(215,60%,60%)]/15 text-[hsl(215,60%,70%)]'
                                          : ''
                                      }`}
                                    >
                                      <Settings className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Manage Permissions</TooltipContent>
                                </Tooltip>
                                <Select
                                  value={channel.category_id}
                                  onValueChange={(value) => handleMoveChannel(channel.id, value)}
                                >
                                  <SelectTrigger className="h-7 w-7 p-0 border-0 hover:bg-[hsl(215,60%,60%)]/10">
                                    <GripVertical className="h-3.5 w-3.5" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        Move to {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditChannel(channel)}
                                  className="h-7 w-7 hover:bg-[hsl(215,60%,60%)]/10"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteChannel(channel.id)}
                                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {expandedPermissions.has(channel.id) && (
                              <div className="ml-6 p-3 bg-[hsl(210,18%,12%)] border border-[hsl(210,18%,20%)] rounded-md">
                                <PermissionsManager
                                  entityType="channel"
                                  entityId={channel.id}
                                  permissions={channel.permissions || []}
                                  onUpdate={fetchData}
                                  categoryId={category.id}
                                  categoryName={category.name}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Channel Dialog */}
      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent className="bg-[hsl(210,18%,14%)] border-[hsl(210,18%,20%)]">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                placeholder="general-chat"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="bg-[hsl(210,18%,16%)] border-[hsl(210,18%,20%)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="bg-[hsl(210,18%,16%)] border-[hsl(210,18%,20%)]">
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
            <Button onClick={handleCreateChannel} className="bg-[hsl(215,60%,60%)] hover:bg-[hsl(215,60%,55%)]">
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="bg-[hsl(210,18%,14%)] border-[hsl(210,18%,20%)]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="GENERAL"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                className="bg-[hsl(210,18%,16%)] border-[hsl(210,18%,20%)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} className="bg-[hsl(215,60%,60%)] hover:bg-[hsl(215,60%,55%)]">
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={editChannelDialogOpen} onOpenChange={setEditChannelDialogOpen}>
        <DialogContent className="bg-[hsl(210,18%,14%)] border-[hsl(210,18%,20%)]">
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel Name</Label>
              <Input
                placeholder="channel-name"
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                className="bg-[hsl(210,18%,16%)] border-[hsl(210,18%,20%)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChannelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditChannel} className="bg-[hsl(215,60%,60%)] hover:bg-[hsl(215,60%,55%)]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent className="bg-[hsl(210,18%,14%)] border-[hsl(210,18%,20%)]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="CATEGORY NAME"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value.toUpperCase())}
                className="bg-[hsl(210,18%,16%)] border-[hsl(210,18%,20%)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} className="bg-[hsl(215,60%,60%)] hover:bg-[hsl(215,60%,55%)]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

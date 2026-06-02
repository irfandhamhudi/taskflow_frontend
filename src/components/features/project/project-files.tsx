import { useMemo, useState } from 'react';
import { type Task } from '../../../types/index';
import { format } from 'date-fns';
import {
  FileText,
  Image as ImageIcon,
  File,
  Search,
  Download,
  Eye,
  MoreVertical,
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { toast } from 'sonner';

const downloadFile = async (url: string, fileName: string) => {
  try {
    toast.info("Starting download...");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download complete");
  } catch (error) {
    console.error('Download failed', error);
    window.open(url, '_blank');
  }
};

interface ProjectFilesProps {
  tasks: Task[];
}

export default function ProjectFiles({ tasks }: ProjectFilesProps) {
  const [search, setSearch] = useState('');

  // Extract all attachments and map them with task context
  const allFiles = useMemo(() => {
    const files: any[] = [];
    tasks.forEach(task => {
      if (task.attachments) {
        task.attachments.forEach(attachment => {
          files.push({
            ...attachment,
            taskTitle: task.title,
            taskId: task._id
          });
        });
      }
    });
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [tasks]);

  const filteredFiles = useMemo(() =>
    allFiles.filter(f =>
      f.fileName.toLowerCase().includes(search.toLowerCase()) ||
      f.taskTitle.toLowerCase().includes(search.toLowerCase())
    ),
    [allFiles, search]
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-pink-500" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (allFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-xl bg-muted/30">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-xl font-semibold opacity-50">No files yet</p>
        <p className="text-sm text-muted-foreground">Upload attachments to tasks to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files or task titles..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {allFiles.length} Total Files
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-none bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b bg-muted/20">
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file._id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center shrink-0">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate max-w-[300px]">{file.fileName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{file.fileType.split('/')[1]}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs hover:bg-primary/10 transition-colors cursor-pointer">
                      {file.taskTitle}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs opacity-70 italic">{file.fileType}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => downloadFile(file.fileUrl, file.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" asChild>
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" /> View Full
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <ExternalLink className="h-4 w-4" /> Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No files match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

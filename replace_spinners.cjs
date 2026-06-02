const fs = require('fs');
const path = require('path');

const files = [
  'src/components/features/calendar/loader/loading.tsx',
  'src/components/features/dashboard/loader/loading.tsx',
  'src/components/features/profile/loader/loading.tsx',
  'src/components/features/profile/profile-edit-sheet.tsx',
  'src/components/features/profile/profile-header.tsx',
  'src/components/features/project/project-members.tsx',
  'src/components/notifications/NotificationDropdown.tsx',
  'src/components/notifications/NotificationItem.tsx',
  'src/components/notifications/NotificationPreferences.tsx',
  'src/components/projects/create-task-sheet.tsx',
  'src/components/rooting/guestRoot.tsx',
  'src/components/rooting/protect-route.tsx',
  'src/components/rooting/rootRedirect.tsx',
  'src/components/ui/sonner.tsx',
  'src/pages/Auth/oauth-callback/index.tsx',
  'src/pages/Joining/index.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Handle lucide-react import
  if (content.includes('Loader2')) {
    // Check if it's imported alone or with others
    if (/import\s*\{\s*Loader2\s*\}\s*from\s*['"]lucide-react['"]/.test(content)) {
      content = content.replace(/import\s*\{\s*Loader2\s*\}\s*from\s*['"]lucide-react['"];?/, '');
    } else {
      content = content.replace(/,\s*Loader2|Loader2\s*,/, '');
    }
    
    // Add Spinner import
    const spinnerImport = `import { Spinner } from '@/components/ui/spinner';\n`;
    if (!content.includes('import { Spinner }')) {
      content = spinnerImport + content;
    }
    
    // Replace <Loader2 ... /> with <Spinner className="size-8" />
    content = content.replace(/<Loader2[^>]*>/g, '<Spinner className="size-8" />');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + file);
  }
});

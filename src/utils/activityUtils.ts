// activityUtils.ts

interface ActivityLog {
  action: string;
  user?: {
    name?: string;
    username?: string;
    [key: string]: any;
  };
  entityName?: string;
  details?: Record<string, any>;
  entityType?: string;
  createdAt?: string | Date;
  [key: string]: any;
}

export const stripHtml = (html: string | undefined): string => {
  if (!html) return '';
  // Menghapus tag HTML menggunakan regex sederhana (aman untuk preview singkat)
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

export const shorten = (text: string | undefined, max = 60): string => {
  const plainText = stripHtml(text);
  return plainText && plainText.length > max ? plainText.substring(0, max) + '...' : (plainText ?? '');
};

export const normalizeKey = (value?: string): string =>
  (value || '').toLowerCase().trim().replace(/\s+/g, '');

// Helper format tanggal (tetap ada untuk keperluan lain jika perlu)
export const formatDate = (date: any): string => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

// Filter perubahan yang benar-benar berbeda
export const getRealChanges = (
  changes: Array<{ field: string; oldValue?: any; newValue?: any }> | undefined
) => {
  if (!changes) return [];

  return changes.filter((c) => {
    if (c.oldValue == null && c.newValue == null) return false;
    const oldStr = c.oldValue == null ? '' : JSON.stringify(c.oldValue);
    const newStr = c.newValue == null ? '' : JSON.stringify(c.newValue);
    return oldStr !== newStr;
  });
};

// ──────────────────────────────────────────────────────────────
// 1. Subject (judul utama aktivitas)
// ──────────────────────────────────────────────────────────────
// Helper baru: buat avatar HTML kecil (bisa dipakai di subject atau detail)
export const getUserAvatarHtml = (user: { name: string; profilePicture?: string } | string, size = 20): string => {
  const name = typeof user === 'string' ? user : user.name;
  const picture = typeof user === 'string' ? undefined : user.profilePicture;

  const initial = name?.charAt(0).toUpperCase() || '?';

  if (picture) {
    return `<img src="${picture}" alt="${name}" class="w-[${size}px] h-[${size}px] rounded-full object-cover inline-block align-middle border border-white/40" onerror="this.style.display='none';this.nextSibling.style.display='inline-flex'" />`;
  }

  return `<span class="w-[${size}px] h-[${size}px] rounded-full bg-secondary inline-flex items-center justify-center text-[${Math.floor(size/2.5)}px] font-bold align-middle">${initial}</span>`;
};
export const getActivitySubject = (log: ActivityLog): string => {
  const { action, user, entityName, details = {}, entityType } = log;
  const actorName = user?.name || user?.username || 'Someone';
  // Ambil informasi user yang diubah rolenya
  const memberName = details.memberName || 'a member';
  const newRole = details.newRole || 'unknown';
  const oldRole = details.oldRole || 'unknown';

  switch (action) {
    // ── Task Update ────────────────────────────────────────────────

  case 'task_created': {
  const assigned = details.assignedUsers as Array<{ name: string }> | undefined;
  if (assigned?.length) {
    if (assigned.length === 1) {
      return `${actorName} created task <strong>${shorten(entityName)}</strong> and assigned ${assigned[0].name}`;
    } else {
      return `${actorName} created task <strong>${shorten(entityName)}</strong> and assigned ${assigned.length} members`;
    }
  }
  return `${actorName} created task <strong>${shorten(entityName)}</strong>`;
}

  case 'task_updated': {
  const realChanges = getRealChanges(details?.changes);

  if (!realChanges.length) {
    return `${actorName} made some changes to task <strong>${shorten(entityName)}</strong>`;
  }

  // Khusus hanya assignee yang berubah
  const assignedChange = realChanges.find(c => c.field === 'assignedTo');
  if (assignedChange && realChanges.length === 1) {
    const addedNames = assignedChange.addedUserNames as string[] | undefined;
    const removedNames = assignedChange.removedUserNames as string[] | undefined;

    if (addedNames?.length && !removedNames?.length) {
      // Hanya nambah
      if (addedNames.length === 1) {
        return `${actorName} assigned <strong>${addedNames[0]}</strong> to <strong>${shorten(entityName)}</strong>`;
      }
      if (addedNames.length <= 3) {
        const last = addedNames.pop();
        return `${actorName} assigned ${addedNames.join(', ')} and ${last} to <strong>${shorten(entityName)}</strong>`;
      }
      return `${actorName} assigned ${addedNames[0]} + ${addedNames.length - 1} others to <strong>${shorten(entityName)}</strong>`;
    }

    if (removedNames?.length && !addedNames?.length) {
      // Hanya ngurangin
      if (removedNames.length === 1) {
        return `${actorName} removed <strong>${removedNames[0]}</strong> from <strong>${shorten(entityName)}</strong>`;
      }
      if (removedNames.length <= 3) {
        const last = removedNames.pop();
        return `${actorName} removed ${removedNames.join(', ')} and ${last} from <strong>${shorten(entityName)}</strong>`;
      }
      return `${actorName} removed ${removedNames[0]} + ${removedNames.length - 1} others from <strong>${shorten(entityName)}</strong>`;
    }

    // Ada tambah & kurang sekaligus (jarang, tapi mungkin)
    return `${actorName} updated assignees of <strong>${shorten(entityName)}</strong>`;
  }

  

  // Kasus spesial: HANYA startDate dan/atau dueDate yang berubah
  const dateFields = ['startDate', 'dueDate'];
  const dateChanges = realChanges.filter(c => dateFields.includes(c.field));

  if (dateChanges.length > 0 && dateChanges.length === realChanges.length) {
    // Hanya tanggal yang berubah → tidak tampilkan parentheses, biarkan subject sederhana
    // Tanggal akan ditangani manual di DashboardPage dengan icon
    return `${actorName} updated task <strong>${shorten(entityName)}</strong>`;
  }

  // Kasus 1 field saja (non-tanggal)
  if (realChanges.length === 1) {
    const change = realChanges[0];
    const { field, oldValue, newValue } = change;

    switch (field) {
      case 'title':
        return `${actorName} renamed task to <strong>${shorten(String(newValue))}</strong>`;

      case 'description':
        return `${actorName} updated the description of <strong>${shorten(entityName)}</strong>`;

      case 'assignedTo': {
        const oldCount = Array.isArray(oldValue) ? oldValue.length : 0;
        const newCount = Array.isArray(newValue) ? newValue.length : 0;

        if (newCount > oldCount) {
          return `${actorName} assigned additional member(s) to <strong>${shorten(entityName)}</strong>`;
        }
        if (newCount < oldCount) {
          return `${actorName} removed assignee(s) from <strong>${shorten(entityName)}</strong>`;
        }
        return `${actorName} updated assignees of <strong>${shorten(entityName)}</strong>`;
      }

      case 'tags':
        return `${actorName} updated tags of <strong>${shorten(entityName)}</strong>`;

      case 'priority':
        return `${actorName} changed priority of <strong>${shorten(entityName)}</strong>`;

      case 'status':
        return `${actorName} moved <strong>${shorten(entityName)}</strong> to <strong>${String(newValue || 'unknown').toLowerCase()}</strong>`;

      default:
        return `${actorName} updated ${field} of task <strong>${shorten(entityName)}</strong>`;
    }
  }

  // Kasus umum: multiple fields (termasuk campuran tanggal + lainnya)
  const changedFields = realChanges
    .map((c) => {
      switch (c.field) {
        case 'dueDate': return 'due date';
        case 'startDate': return 'start date';
        case 'assignedTo': return 'assignees';
        case 'tags': return 'tags';
        default: return c.field;
      }
    })
    .join(', ');

  return `${actorName} updated <strong>${shorten(entityName)}</strong>: ${changedFields}`;
}

    // ── Status & Priority khusus ───────────────────────────────────
    case 'task_status_changed':
      return `${actorName} changed status of task <strong>${shorten(entityName)}</strong>`;

    case 'task_priority_changed':
      return `${actorName} changed priority of task <strong>${shorten(entityName)}</strong>`;

    // ── Task lainnya ───────────────────────────────────────────────
    // case 'task_created':
    //   return `${actorName} created task <strong>${shorten(entityName)}</strong>`;

    // ── INI TEMPATNYA ────────────────────────────────────────
   case 'task_assigned': {
    // Coba ambil dari struktur baru kalau sudah ada (future-proof)
    const users = details.addedUsers as Array<{ name: string; profilePicture?: string }> | undefined;

    if (users?.length) {
      if (users.length === 1) {
        return `${actorName} assigned ${getUserAvatarHtml(users[0], 18)} <strong>${users[0].name}</strong> to task <strong>${shorten(entityName)}</strong>`;
      }
      // kalau banyak, tetap pakai nama saja biar subject ga terlalu panjang
    }

    // Fallback ke kode lama (masih jalan kalau backend belum update)
    const names = details.addedUserNames as string[] | undefined;
    const count = Number(details.assignedCount) || 0;

    if (!names?.length) {
      return count > 1
        ? `${actorName} assigned ${count} members to <strong>${shorten(entityName)}</strong>`
        : `${actorName} assigned a member to <strong>${shorten(entityName)}</strong>`;
    }

    if (names.length === 1) {
      return `${actorName} assigned <strong>${names[0]}</strong> to task <strong>${shorten(entityName)}</strong>`;
    }

    if (names.length <= 3) {
      const namesCopy = [...names];
      const last = namesCopy.pop();
      return `${actorName} assigned ${namesCopy.join(', ')} and ${last} to task <strong>${shorten(entityName)}</strong>`;
    }

    return `${actorName} assigned ${names[0]} + ${names.length - 1} others to task <strong>${shorten(entityName)}</strong>`;
  }

    case 'task_unassigned': {
    // Coba ambil struktur baru kalau backend sudah update (future-proof)
    const users = details.removedUsers as Array<{ name: string; profilePicture?: string }> | undefined;

    if (users?.length) {
      if (users.length === 1) {
        return `${actorName} removed ${getUserAvatarHtml(users[0], 18)} <strong>${users[0].name}</strong> from task <strong>${shorten(entityName)}</strong>`;
      }
      // Kalau lebih dari satu, biar subject tetap ringkas pakai nama aja (avatarnya nanti di detail change)
    }

    // Fallback ke logic lama (aman kalau backend belum update)
    const names = details.removedUserNames as string[] | undefined;
    const count = Number(details.unassignedCount) || 0;

    if (!names?.length) {
      return count > 1
        ? `${actorName} removed ${count} assignees from <strong>${shorten(entityName)}</strong>`
        : `${actorName} removed an assignee from <strong>${shorten(entityName)}</strong>`;
    }

    if (names.length === 1) {
      return `${actorName} removed <strong>${names[0]}</strong> from task <strong>${shorten(entityName)}</strong>`;
    }

    if (names.length <= 3) {
      const namesCopy = [...names]; // penting: jangan mutate array asli
      const last = namesCopy.pop();
      return `${actorName} removed ${namesCopy.join(', ')} and ${last} from task <strong>${shorten(entityName)}</strong>`;
    }

    return `${actorName} removed ${names[0]} + ${names.length - 1} others from task <strong>${shorten(entityName)}</strong>`;
  }

    case 'task_archived':
      return `${actorName} archived task <strong>${shorten(entityName)}</strong>`;

    case 'task_unarchived':
      return `${actorName} unarchived task <strong>${shorten(entityName)}</strong>`;

    case 'task_deleted':
      return `${actorName} deleted task <strong>${shorten(entityName || details?.title)}</strong>`;

    // ── Project ────────────────────────────────────────────────────
    case 'project_created':
      return `${actorName} created project <strong>${shorten(entityName)} </strong>`;

    case 'project_updated':
      return `${actorName} updated project <strong>${shorten(entityName)}</strong>`;

    case 'project_archived':
      return `${actorName} archived project <strong>${shorten(entityName)}</strong>`;

    case 'project_unarchived':
      return `${actorName} unarchived project <strong>${shorten(entityName)}</strong>`;

    case 'project_deleted':
      return `${actorName} deleted project <strong>${shorten(entityName || details?.name)}</strong>`;

    // ── Membership ─────────────────────────────────────────────────
    case 'member_invited':
      return `${actorName} invited ${details.invitedEmail || 'someone'} as ${details.role || 'member'} to <strong>${shorten(entityName)}</strong>`;

    case 'member_joined':
    case 'member_joined_via_link':
      return `${actorName} joined project <strong>${shorten(entityName)}</strong>`;

    case 'member_removed':
      return `${actorName} removed a member from project <strong>${shorten(entityName)}</strong>`;

    case 'member_role_updated':
      return `${actorName} changed <strong>${memberName}</strong> role from ${oldRole} to ${newRole} in project <strong>${shorten(entityName)}</strong>`; 

    // ── Subtask ────────────────────────────────────────────────────
    case 'subtask_created':
      return `${actorName} added subtask <strong>${shorten(details.subtaskTitle)}</strong> to <strong>${shorten(entityName)}</strong>`;

    case 'subtask_completed':
      return `${actorName} completed subtask <strong>${shorten(details.subtaskTitle)}</strong> in <strong>${shorten(entityName)}</strong>`;

    case 'subtask_incompleted':
      return `${actorName} marked subtask <strong>${shorten(details.subtaskTitle)}</strong> as incomplete in <strong>${shorten(entityName)}</strong>`;

    case 'subtask_deleted':
      return `${actorName} deleted subtask <strong>${shorten(details.subtaskTitle)}</strong> from <strong>${shorten(entityName)}</strong>`;

    // ── Comments ───────────────────────────────────────────────────
    case 'comment_added':
      return `${actorName} commented on task <strong>${shorten(entityName)}</strong>`;

    case 'reply_added':
      return `${actorName} replied to a comment on task <strong>${shorten(entityName)}</strong>`;

    case 'comment_edited':
      return `${actorName} edited their comment on task <strong>${shorten(entityName)}</strong>`;

    case 'comment_deleted':
      return `${actorName} deleted a comment on task <strong>${shorten(entityName)}</strong>`;

    // ── Comment Reactions ──────────────────────────────────────────
    case 'comment_reaction_added':
      return `${actorName} reacted with ${String(details.emoji ?? '?')} to a comment on <strong>${shorten(entityName)}</strong>`;

    case 'comment_reaction_removed':
      return `${actorName} removed ${String(details.emoji ?? '?')} reaction from a comment on <strong>${shorten(entityName)}</strong>`;

    // ── File/Attachments ───────────────────────────────────────────
    case 'file_uploaded': {
      const count = Number(details.count) || 1;
      const target = entityType === 'task' ? 'task' : 'project';
      return `${actorName} uploaded ${count > 1 ? `${count} files` : 'a file'} to ${target} <strong>${shorten(entityName)}</strong>`;
    }

    case 'file_replaced':
      return `${actorName} replaced a file in <strong>${shorten(entityName)}</strong>`;

    case 'file_deleted':
      return `${actorName} deleted file <strong>${shorten(details.fileName)}</strong> from <strong>${shorten(entityName)}</strong>`;

    // ── Meeting ────────────────────────────────────────────────────
    case 'meeting_created':
      return `${actorName} created a ${details.meetingType || 'meeting'} <strong>${shorten(entityName)}</strong>`;

    case 'meeting_deleted':
      return `${actorName} deleted meeting <strong>${shorten(entityName)}</strong>`;

    // ── Fallback ───────────────────────────────────────────────────
    default:
      const typeLabel = entityType
        ? entityType.charAt(0).toUpperCase() + entityType.slice(1)
        : 'item';
      return `${actorName} performed "${action}" on ${typeLabel} <strong>${shorten(entityName)}</strong>`;
  }
};

// ──────────────────────────────────────────────────────────────
// 2. Preview teks biasa (tidak diubah)
// ──────────────────────────────────────────────────────────────
export const getActivityPreview = (log: ActivityLog): string => {
  const { action, details = {}, entityName } = log;

  switch (action) {
    case 'comment_added':
    case 'reply_added':
      return (details.commentText ?? details.replyText ?? details.text);
    case 'comment_edited':
      return (details.newText);
    case 'file_uploaded':
    case 'file_replaced':
      const names = details.fileNames as string[] | undefined;
      return names?.length
        ? shorten(names.join(', '), 100)
        : `${details.count || 1} file${(details.count || 1) > 1 ? 's' : ''}`;
    case 'file_deleted':
      return shorten(details.fileName);
    case 'subtask_created':
    case 'subtask_completed':
    case 'subtask_incompleted':
    case 'subtask_deleted':
      return shorten(details.subtaskTitle);
    case 'task_updated': {
      const descChange = (details.changes || []).find((c: any) => c.field === 'description');
      return descChange ? descChange.newValue : '';
    }
    case 'meeting_created':
      return `Platform: ${details.meetingType === 'zoom' ? 'Zoom' : 'Google Meet'} • Scheduled for ${new Date(details.startTime).toLocaleString()}`;
    case 'meeting_deleted':
      return `Meeting "${entityName || details.title || 'Unknown'}" was removed from the schedule.`;
    default:
      return '';
  }
};

// ──────────────────────────────────────────────────────────────
// 3. Badge untuk status/priority (tetap)
// ──────────────────────────────────────────────────────────────
// export const getStatusPriorityChangeBadge = (log: ActivityLog): string => {
//   const { action, details = {} } = log;

//   let oldValue: string | undefined;
//   let newValue: string | undefined;
//   let isPriorityChange = false;

//   if (action === 'task_priority_changed') {
//     oldValue = details.oldValue;
//     newValue = details.newValue;
//     isPriorityChange = true;
//   } else if (action === 'task_status_changed') {
//     oldValue = details.oldValue;
//     newValue = details.newValue;
//   } else if (action === 'task_updated') {
//     const realChanges = getRealChanges(details.changes);
//     if (!realChanges.length) return '';

//     const priorityCh = realChanges.find((c) => c.field === 'priority');
//     const statusCh = realChanges.find((c) => c.field === 'status');

//     if (priorityCh) {
//       oldValue = priorityCh.oldValue;
//       newValue = priorityCh.newValue;
//       isPriorityChange = true;
//     } else if (statusCh) {
//       oldValue = statusCh.oldValue;
//       newValue = statusCh.newValue;
//     }
//   }

//   if (oldValue == null || newValue == null) return '';

//   const config = isPriorityChange ? priorityConfig : statusConfig;
//   const oldKey = normalizeKey(oldValue) as keyof typeof config;
//   const newKey = normalizeKey(newValue) as keyof typeof config;

//   const oldStyle =
//     config[oldKey]?.className ||
//     'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
//   const newStyle =
//     config[newKey]?.className ||
//     'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

//   const oldLabel = config[oldKey]?.label || oldValue;
//   const newLabel = config[newKey]?.label || newValue;

//   return `
//     <span class="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
//       <span class="px-1.5 py-0.5 rounded font-medium text-[10px] ${oldStyle}">
//         ${oldLabel}
//       </span>
//       <span class="text-muted-foreground/70 font-medium">→</span>
//       <span class="px-1.5 py-0.5 rounded font-medium text-[10px] ${newStyle}">
//         ${newLabel}
//       </span>
//     </span>
//   `;
// };



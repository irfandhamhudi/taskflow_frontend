import { Skeleton } from '@/components/ui/skeleton';
// src/components/profile/ProfileHeader.tsx
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Pencil, Camera } from "lucide-react";
// import { Badge } from "../../../components/ui/badge"; // pastikan sudah diinstall via shadcn
import type { User } from "../../../types/user";
// import { Badge } from "../../ui/badge";

interface ProfileHeaderProps {
  user: User;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  onEditProfile?: () => void;
}

export function ProfileHeader({
  user,
  onUpload,
  isUploading = false,
  onEditProfile,
}: ProfileHeaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(user.profilePicture);

  
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fungsi untuk menentukan warna badge berdasarkan role
  // const getRoleBadgeVariant = (role?: string) => {
  //   switch (role?.toLowerCase()) {
  //     case "admin":
  //       return "destructive"; // merah
  //     case "moderator":
  //       return "secondary"; // abu-abu
  //     case "user":
  //     default:
  //       return "default"; // biru
  //   }
  // };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    try {
      await onUpload(file);
    } catch (err) {
      console.error("Upload gagal", err);
      setPreviewUrl(user.profilePicture);
    } finally {
      setTimeout(() => URL.revokeObjectURL(tempUrl), 1000);
    }
  };

  return (
    <div>
      <div className="p-6 flex flex-col sm:flex-row items-center sm:items-center gap-6">
        {/* Avatar + upload overlay */}
        <div className="relative group shrink-0">
          <Avatar className="h-20 w-20 ">
            <AvatarImage
              src={previewUrl || user.profilePicture}
              alt={user.name || "User Avatar"}
              className="object-cover"
            />
            <AvatarFallback >
              {initials}
            </AvatarFallback>
          </Avatar>

          <label
            htmlFor="avatar-upload"
            className={`
              absolute inset-0 rounded flex items-center justify-center
              bg-black/45 text-white cursor-pointer
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              ${isUploading ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            {isUploading ? (
              <Skeleton className="size-8 rounded-full" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Info teks */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
            {/* Nama + Badge Role */}
            <div className="flex items-start gap-3">
             <div className="text-center sm:text-left">
               <h2 className="text-2xl font-bold tracking-tight truncate">
                {user.name || "-"} 
              </h2>
              {/* Job Title */}
              {user.jobTitle && (
                <p className="text-lg font-medium text-muted-foreground">
                  {user.jobTitle || "-"}
                </p>
              )}
             </div>

              {/* {user.role && (
                <Badge className="text-xs font-medium px-2 py-1 h-auto rounded capitalize translate-1">
                  {user.role}
                </Badge>
              )} */}
            </div>

            {/* Tombol Edit */}
            <Button
              size="sm"
              onClick={onEditProfile}
              disabled={isUploading}
              className="cursor-pointer bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          

          {/* Alamat (opsional) */}
          {/* {user.address && (
            <p className="text-sm text-muted-foreground">
              {user.address}
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
}

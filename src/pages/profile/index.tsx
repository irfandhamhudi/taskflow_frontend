// src/pages/ProfilePage.tsx
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/app-sidebar";
import { SiteHeader } from "../../components/site-header";

import { ProfileHeader } from "../../components/features/profile/profile-header";
import { ProfileInfo } from "../../components/features/profile/profile-info";
import api from "../../utils/api";
import type { User } from "../../types/user";
import { ProfileEditSheet } from "../../components/features/profile/profile-edit-sheet";
import { toast } from "sonner";
import { ProfileLoading } from "../../components/features/profile/loader/loading";
import { ProfileError } from "../../components/features/profile/error/error";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch current user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/auth/me");

        if (response.data?.success) {
          setUser(response.data.data || response.data.user || response.data);
        } else {
          throw new Error(response.data?.message || "Failed to fetch profile data");
        }
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);

        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "An error occurred while loading your profile. Please try logging in again.";

        setError(errorMsg);

        // Optional: redirect to login on 401 Unauthorized
        if (err.response?.status === 401) {
          // window.location.href = "/login";
          // or use navigate() if using react-router
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle profile picture upload
  const handleUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file); // matches multer setup in backend

      const response = await api.put("/profile/picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const newProfilePicture = response.data.data.profilePicture;
        setUser((prev) =>
          prev ? { ...prev, profilePicture: newProfilePicture } : null
        );
        toast.success(response.data.message || "Profile picture updated successfully");
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to upload profile picture. Please try again later.";

      toast.error(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    // toast.success("Profile updated successfully");
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error || !user) {
    return <ProfileError message={error || "Failed to load profile data."} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 overflow-auto">
          <div className="w-full mx-auto max-w-5xl py-10 px-4 md:px-6">
            <div >
              <ProfileHeader
                user={user}
                onUpload={handleUpload}
                isUploading={isUploading}
                onEditProfile={() => setIsEditOpen(true)}
              />

              <div className="grid gap-8">
                <ProfileInfo user={user} />
              </div>
            </div>
          </div>
        </main>

        <ProfileEditSheet
          user={user}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onProfileUpdated={handleProfileUpdated}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
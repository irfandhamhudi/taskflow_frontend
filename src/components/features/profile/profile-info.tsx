// src/components/profile/ProfileInfo.tsx
import { ProfileSection } from "../profile/profile-section";
import { Label } from "../../../components/ui/label";
import { InputWithIcon } from "../../features/profile/icon/input-with-icon";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  FileText,
  MapPin,
} from "lucide-react";
import type { User } from "../../../types/user";

interface ProfileInfoProps {
  user: User;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const formatDate = (date?: Date | string) => {
    if (!date) return "--/--/----";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "--/--/----";
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <ProfileSection title="Personal information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Username & Email - side by side */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <InputWithIcon
            id="username"
            icon={UserIcon}
            value={user.name || "-"}
            disabled
            className="bg-muted cursor-not-allowed font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <InputWithIcon
            id="email"
            icon={Mail}
            type="email"
            value={user.email || "-"}
            disabled
            className="bg-muted cursor-not-allowed font-medium"
          />
        </div>

        {/* First Name & Last Name - side by side */}
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <InputWithIcon
            id="firstName"
            icon={UserIcon}
            value={user.firstName || "-"}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <InputWithIcon
            id="lastName"
            icon={UserIcon}
            value={user.lastName || "-"}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        {/* Phone & Address - side by side */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <InputWithIcon
            id="phone"
            icon={Phone}
            type="tel"
            value={user.phone || "-"}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <InputWithIcon
            id="address"
            icon={MapPin}
            value={user.address || "-"}
            disabled
            className="bg-muted cursor-not-allowed"
          />
        </div>

        {/* Date of Birth & Bio - side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <InputWithIcon
              id="dateOfBirth"
              icon={Calendar}
              value={formatDate(user.dateOfBirth)}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <InputWithIcon
              id="bio"
              icon={FileText}
              value={user.bio || "-"}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}

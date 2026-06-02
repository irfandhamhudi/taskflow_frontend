// src/components/features/profile/ProfileEditSheet.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../../components/ui/sheet";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

import api from "../../../utils/api";
import type { User } from "../../../types/user";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProfileEditSheetProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export function ProfileEditSheet({
  user,
  open,
  onOpenChange,
  onProfileUpdated,
}: ProfileEditSheetProps) {
  // Initial snapshot of user data — used to detect changes
  const initialFormData = useMemo<Partial<User>>(() => ({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    address: user.address || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
    bio: user.bio || "",
    jobTitle: user.jobTitle || "",
  }), [user]);

  const [formData, setFormData] = useState<Partial<User>>(initialFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // States for date of birth dropdowns
  const [birthDay, setBirthDay] = useState<number | undefined>(undefined);
  const [birthMonth, setBirthMonth] = useState<number | undefined>(undefined);
  const [birthYear, setBirthYear] = useState<number | undefined>(undefined);

  // Reset form & birth dropdowns when sheet is opened
  useEffect(() => {
    if (!open) return;

    setFormData(initialFormData);
    setSubmitError(null);

    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        setBirthDay(dob.getDate());
        setBirthMonth(dob.getMonth() + 1);
        setBirthYear(dob.getFullYear());
        return;
      }
    }

    setBirthDay(undefined);
    setBirthMonth(undefined);
    setBirthYear(undefined);
  }, [open, user, initialFormData]);

  // Update dateOfBirth whenever dropdown values change
  useEffect(() => {
    if (!birthYear || !birthMonth || !birthDay) {
      setFormData((prev) => ({ ...prev, dateOfBirth: undefined }));
      return;
    }

    let date = new Date(birthYear, birthMonth - 1, birthDay);

    // Correct invalid dates (e.g., 31 Feb → last valid day)
    if (date.getDate() !== birthDay) {
      const lastDay = new Date(birthYear, birthMonth, 0).getDate();
      setBirthDay(lastDay);
      date = new Date(birthYear, birthMonth - 1, lastDay);
    }

    // Prevent future dates
    if (date > new Date()) {
      toast.error("Date of birth cannot be in the future");
      setBirthDay(undefined);
      setBirthMonth(undefined);
      setBirthYear(undefined);
      return;
    }

    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  }, [birthDay, birthMonth, birthYear]);

  // ────────────────────────────────────────────────────────────────
  //              Detect if form has any changes (dirty check)
  // ────────────────────────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    const stringFields: (keyof typeof formData)[] = [
      "firstName",
      "lastName",
      "phone",
      "address",
      "bio",
      "jobTitle",
    ];

    // Compare string/text fields
    for (const field of stringFields) {
      const initialValue = String(initialFormData[field] ?? "").trim();
      const currentValue = String(formData[field] ?? "").trim();
      if (initialValue !== currentValue) return true;
    }

    // Compare date of birth
    const initialDate = initialFormData.dateOfBirth;
    const currentDate = formData.dateOfBirth;

    if (initialDate instanceof Date && currentDate instanceof Date) {
      if (format(initialDate, "yyyy-MM-dd") !== format(currentDate, "yyyy-MM-dd")) {
        return true;
      }
    } else if (initialDate !== currentDate) {
      // One is null/undefined, the other is not → considered changed
      return true;
    }

    return false;
  }, [formData, initialFormData]);

  const canSubmit = hasChanges && !isSubmitting;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: Record<string, any> = {};

      // Include fields (you may optimize to only send changed fields)
      if (formData.firstName !== undefined) payload.firstName = (formData.firstName ?? "").trim();
      if (formData.lastName !== undefined) payload.lastName = (formData.lastName ?? "").trim();
      if (formData.phone !== undefined) payload.phone = (formData.phone ?? "").trim();
      if (formData.address !== undefined) payload.address = (formData.address ?? "").trim();
      if (formData.bio !== undefined) payload.bio = (formData.bio ?? "").trim();
      if (formData.jobTitle !== undefined) payload.jobTitle = (formData.jobTitle ?? "").trim();

      // Date of birth
      if (formData.dateOfBirth instanceof Date && !isNaN(formData.dateOfBirth.getTime())) {
        payload.dateOfBirth = format(formData.dateOfBirth, "yyyy-MM-dd");
      } else {
        payload.dateOfBirth = null;
      }

      const response = await api.put("/profile", payload);

      if (response.data.success) {
        onProfileUpdated(response.data.data);
        onOpenChange(false);
        toast.success(response.data.message || "Profile updated successfully");
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while saving changes";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Years from 1900 to current year
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  }, []);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = useMemo(() => {
    if (!birthMonth || !birthYear) return Array.from({ length: 31 }, (_, i) => i + 1);

    const date = new Date(birthYear, birthMonth, 0);
    return Array.from({ length: date.getDate() }, (_, i) => i + 1);
  }, [birthMonth, birthYear]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 sm:p-11">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Update your personal information. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName ?? ""}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName ?? ""}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle ?? ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Product Designer"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              name="bio"
              value={formData.bio ?? ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Tell us a little about yourself"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone ?? ""}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="flex gap-2">
              {/* Day */}
              <div>
                <Select
                  value={birthDay?.toString() ?? ""}
                  onValueChange={(val) => setBirthDay(val ? parseInt(val) : undefined)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysInMonth.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div>
                <Select
                  value={birthMonth?.toString() ?? ""}
                  onValueChange={(val) => setBirthMonth(val ? parseInt(val) : undefined)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, idx) => (
                      <SelectItem key={month} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div>
                <Select
                  value={birthYear?.toString() ?? ""}
                  onValueChange={(val) => setBirthYear(val ? parseInt(val) : undefined)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {submitError}
            </div>
          )}

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting} className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit} 
              className="cursor-pointer bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none"
            >
              {isSubmitting ? <p className="font-semibold animate-pulse text-primary">Saving...</p> : <p className="font-semibold text-primary">Save Changes</p>}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

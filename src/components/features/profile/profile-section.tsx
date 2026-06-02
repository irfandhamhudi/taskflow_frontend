// src/components/profile/ProfileSection.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
}

export function ProfileSection({
  title,
  children,
  onEdit,
}: ProfileSectionProps) {
  return (
    <Card className="bg-transparent shadow-none border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit {title.toLowerCase()}</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-1">{children}</CardContent>
    </Card>
  );
}

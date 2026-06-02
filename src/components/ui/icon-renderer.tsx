"use client";

import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer = ({ name, ...props }: IconRendererProps) => {
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    return <LucideIcons.LayoutGrid {...props} />;
  }

  return <IconComponent {...props} />;
};

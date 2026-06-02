"use client"

import { useLocation, Link } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb"
import React, { useState, useEffect } from "react"
import api from "../utils/api"
import { useSocket } from "../context/SocketContext"
import { cn } from "../lib/utils"

const baseRouteTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/calendar": "Calendar",
  "/inbox": "Inbox",
  "/profile": "Profile Settings",
}

export function SiteBreadcrumb({ className }: { className?: string }) {
  const location = useLocation()
  const pathname = location.pathname

  const { socket } = useSocket()

  const [projectName, setProjectName] = useState<string | null>(null)
  const [loadingProjectName, setLoadingProjectName] = useState(false)

  // Deteksi halaman project detail
  const segments = pathname.split("/").filter((seg) => seg.length > 0)
  const isProjectDetail = segments[0] === "projects" && segments.length === 2
  const projectId = isProjectDetail ? segments[1] : null

  // Fetch awal + reset saat projectId berubah
  useEffect(() => {
    if (!isProjectDetail || !projectId) {
      setProjectName(null)
      return
    }

    setProjectName(null)
    setLoadingProjectName(true)

    const fetchProjectName = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`)
        if (res.data.success && res.data.data?.name) {
          setProjectName(res.data.data.name)
        } else {
          setProjectName("Untitled Project")
        }
      } catch (error) {
        console.error("Failed to fetch project name:", error)
        setProjectName("Project Detail")
      } finally {
        setLoadingProjectName(false)
      }
    }

    fetchProjectName()
  }, [projectId, isProjectDetail])

  // ── Realtime update via Socket.IO ──────────────────────────────
  useEffect(() => {
    if (!socket || !isProjectDetail || !projectId) return

    const handleProjectUpdated = (data: any) => {
      if (data.projectId !== projectId) return

      const newName =
        data.project?.name ||
        data.changes?.name ||
        data.name

      if (newName) {
        setProjectName(newName)
      }
    }

    socket.on("project_updated", handleProjectUpdated)

    return () => {
      socket.off("project_updated", handleProjectUpdated)
    }
  }, [socket, projectId, isProjectDetail])

  // Bangun breadcrumb items
  const items: { title: string; url?: string }[] = []

  if (pathname !== "/dashboard") {
    items.push({ title: "Dashboard", url: "/dashboard" })
  }

  if (isProjectDetail) {
    const displayName = loadingProjectName
      ? "Loading..."
      : projectName ?? "Project Detail"
    items.push({ title: displayName })
  } else {
    const baseTitle = baseRouteTitleMap[pathname]
    if (baseTitle) {
      items.push({ title: baseTitle })
    }
  }

  if (items.length === 0) {
    items.push({ title: "Dashboard" })
  }

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.url ? (
                <BreadcrumbLink asChild>
                  <Link to={item.url}>{item.title}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

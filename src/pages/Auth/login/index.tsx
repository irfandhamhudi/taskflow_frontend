import {  Zap } from "lucide-react"
import { LoginForm } from "../../../components/login-form"
import IMG_signin from "../../../assets/IMG_All.jpg"
import { Link } from "react-router-dom"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={IMG_signin}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover brightness-90 dark:brightness-[0.2] dark:grayscale"
        />
        <Link to="/" className="bg-secondary py-2 px-3 border border-primary/20 backdrop-blur-md rounded absolute top-10 right-10 flex items-center gap-2 group transition-all z-10">
            <div className="sm:flex hidden items-center gap-2">
              <div className="bg-primary/10 text-primary backdrop-blur-md flex size-10 items-center justify-center rounded-sm border border-primary/20">
              <Zap className="size-6" />
            </div>
            <p className="text-3xl font-bold text-white drop-shadow-lg">TaskFlow</p>
            </div>
        </Link>
      </div>
    </div>
  )
}


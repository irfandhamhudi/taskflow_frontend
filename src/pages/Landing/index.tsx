import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Zap, Menu, ArrowRight, LayoutDashboard, Search, BarChart3, Calendar, Github, Globe, CheckCircle2, Star } from "lucide-react";
import { ModeToggle } from "../../components/mode-toggle";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scrollReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" }
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background dark:bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]"></div>

        <div className="absolute left-[-15%] top-[-15%] h-[700px] w-[700px] rounded-full bg-primary/20 opacity-20 blur-[140px]"></div>
        <div className="absolute right-[-15%] top-[30%] h-[600px] w-[600px] rounded-full bg-purple-500/15 opacity-20 blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 max-w-6xl w-full mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary/10 text-primary border border-primary/20 flex size-8 items-center justify-center rounded-sm">
              <Zap className="size-5" />
            </div>
            TaskFlow
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#integrations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Integrations</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <ModeToggle />
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold transition-all hover:scale-105">
                <Link to="/register">Join for Free</Link>
              </Button>
            </div>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container max-w-6xl mx-auto px-4 pt-24 text-center">
        <motion.div
          initial="initial" animate="animate" variants={stagger}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground to-foreground/70">
            Manage Projects & Teams with <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">Super Speed</span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for real-time collaboration, Kanban task management, and limitless productivity analytics.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Button size="lg" asChild className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold gap-2 h-14 px-8 text-lg hover:scale-105 transition-all">
              <Link to="/register">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 h-14 px-8 text-lg bg-background/50 backdrop-blur-sm">
              <Link to="/login">
                View Demo
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup Representation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent blur-3xl -z-10 rounded-full"></div>
          <div className="rounded-2xl border bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden ring-1 ring-white/10">
            <div className="h-10 border-b bg-muted/50 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto bg-background/80 rounded-md h-6 w-64 border flex items-center px-3">
                <Search className="w-3 h-3 text-muted-foreground mr-2" />
                <div className="h-2 w-24 bg-muted rounded"></div>
              </div>
            </div>
            <div className="p-6 md:p-8 grid md:grid-cols-4 gap-6">
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col gap-4 border-r pr-6">
                <div className="h-8 w-32 bg-primary/20 rounded-md"></div>
                <div className="h-6 w-24 bg-muted rounded-md mt-4"></div>
                <div className="h-6 w-28 bg-muted rounded-md"></div>
                <div className="h-6 w-20 bg-muted rounded-md"></div>
                <div className="mt-auto h-12 w-full bg-muted/50 rounded-xl"></div>
              </div>
              {/* Content Mock */}
              <div className="md:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="h-10 w-48 bg-foreground/10 rounded-lg"></div>
                  <div className="h-10 w-32 bg-primary/10 border border-primary/20 rounded-lg"></div>
                </div>
                {/* Kanban Mock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background/80 border rounded-xl p-4 shadow-sm">
                      <div className="h-6 w-24 bg-muted rounded-md mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-20 bg-card border rounded-lg p-3 shadow-sm">
                          <div className="h-4 w-3/4 bg-foreground/20 rounded mb-2"></div>
                          <div className="h-3 w-1/2 bg-muted rounded"></div>
                        </div>
                        <div className="h-20 bg-card border rounded-lg p-3 shadow-sm">
                          <div className="h-4 w-5/6 bg-foreground/20 rounded mb-2"></div>
                          <div className="h-3 w-1/3 bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            variants={scrollReveal}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Features Without Compromise</h2>
            <p className="text-lg text-muted-foreground">Everything you need to manage your team and get work done faster, without the complexity.</p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            variants={{
              whileInView: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: LayoutDashboard, title: "Interactive Kanban Board", desc: "Visualize your work progress. Drag and drop tasks between columns seamlessly, set priorities, and monitor status in real-time.", color: "primary" },
              { icon: BarChart3, title: "Analytics Dashboard", desc: "Monitor team productivity with accurate metrics. View weekly activity charts, completed tasks, and project performance instantly.", color: "blue-500" },
              { icon: Search, title: "Global Search", desc: "Find anything in a flash. Our global search system allows you to search for tasks across all projects at once.", color: "purple-500" },
              { icon: Calendar, title: "Calendar View", desc: "Manage deadlines easily with an interactive calendar view. Sync with your workflow so nothing gets missed.", color: "orange-500" },
              { icon: Globe, title: "Team Collaboration", desc: "Invite members with links, set roles (Admin/Member), and see real-time activity with complete project activity logs.", color: "cyan-500" }
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={scrollReveal}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="h-full p-8 rounded-3xl bg-card border shadow-sm transition-all hover:shadow-sm hover:border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <f.icon className="w-32 h-32" />
                  </div>
                  <div className={`bg-${f.color}/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                    <f.icon className={`h-7 w-7 text-${f.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* OAuth Integration Section */}
      <section id="integrations" className="py-24 bg-muted/30 border-y relative overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              variants={scrollReveal}
              className="flex-1"
            >
              <Badge variant="outline" className="mb-4">Security & Accessibility</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Seamless Login</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Forget the routine of creating and remembering new passwords. TaskFlow supports full Single Sign-On (SSO) with your favorite providers for a secure and lightning-fast login experience.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <span className="font-medium">One-click Google Login</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <span className="font-medium">GitHub Authentication Integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <span className="font-medium">Secure OTP & Email Verification</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 w-full relative"
            >
              <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-purple-500/20 blur-3xl -z-10 rounded-full"></div>
              <Card className="max-w-sm w-full mx-auto shadow-sm border-primary/10 bg-background/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Login to TaskFlow</CardTitle>
                  <CardDescription>Choose your login method</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Button variant="outline" className="w-full h-12 relative flex justify-center items-center gap-2 group">
                    <svg className="h-5 w-5 absolute left-4 group-hover:scale-110 transition-transform" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </Button>
                  <Button variant="outline" className="w-full h-12 relative flex justify-center items-center gap-2 group">
                    <Github className="h-5 w-5 absolute left-4 group-hover:scale-110 transition-transform" />
                    Continue with GitHub
                  </Button>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                  </div>
                  <div className="h-10 bg-muted/50 rounded-md border flex items-center px-3">
                    <div className="h-4 w-1/2 bg-muted-foreground/20 rounded"></div>
                  </div>
                  <Button className="w-full h-10 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold">Login</Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            variants={scrollReveal}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Trusted by Professionals</h2>
            <p className="text-lg text-muted-foreground">See how TaskFlow helps teams around the world become more productive.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Andi Wijaya", role: "Product Manager", text: "The recurring task feature saves me hours every week. The UI is very pleasing to the eye, and the dark mode is a winner!" },
              { name: "Siti Rahma", role: "Lead Developer", text: "GitHub login integration makes team onboarding very fast. Global search is also very accurate for finding old issues across other projects." },
              { name: "Budi Santoso", role: "Creative Director", text: "The TaskFlow Kanban board is more responsive than other tools I've tried. Drag & drop is very smooth without any lag." }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                variants={scrollReveal}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card/50 border-none shadow-sm h-full">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-primary text-primary" />)}
                    </div>
                    <p className="mb-6 text-foreground/80 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">{t.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full"></div>

        <motion.div
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          variants={scrollReveal}
          className="container relative max-w-4xl mx-auto px-4 text-center z-10"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to Revolutionize the Way You Work?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of other professionals. Start using TaskFlow today, free forever for small teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold h-14 px-8 text-lg hover:scale-105 transition-all">
              <Link to="/register">Register Now - Free</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required. Setup in less than 1 minute.</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="bg-primary/10 text-primary border border-primary/20 flex size-8 items-center justify-center rounded-sm">
                <Zap className="size-5" />
              </div>
              TaskFlow
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
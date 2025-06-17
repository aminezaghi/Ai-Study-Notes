"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, Zap, Star, ArrowRight, Play, FileText, Target, Sparkles, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu, 
  MobileNavToggle, 
  NavbarLogo, 
  NavbarButton 
} from "@/components/ui/resizable-navbar"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "How it Works", link: "#how-it-works" },
    { name: "Testimonials", link: "#testimonials" },
    { name: "Pricing", link: "#pricing" },
  ]

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
      return
    }

    // Initialize GSAP animations
    const ctx = gsap.context(() => {
      // Hero animations
      const tl = gsap.timeline()

      tl.from(".hero-badge", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
      })
        .from(
          ".hero-title",
          {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.5",
        )
        .from(
          ".hero-subtitle",
          {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.7",
        )
        .from(
          ".hero-buttons",
          {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5",
        )
        .from(
          ".hero-image",
          {
            opacity: 0,
            scale: 0.8,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.8",
        )

      // Stats animation
      gsap.from(".stat-item", {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.7)",
      })

      // Floating animation for hero elements
      gsap.to(".floating-1", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      })

      gsap.to(".floating-2", {
        y: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 0.5,
      })
    })

    // Cleanup function
    return () => {
      ctx.revert() // This will clean up all GSAP animations created in this context
    }
  }, [isAuthenticated, router])

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Analysis",
      description:
        "Advanced AI algorithms analyze your PDFs to extract key concepts and generate comprehensive study materials.",
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Smart Study Notes",
      description:
        "Automatically generated study notes that highlight important information and key takeaways from your documents.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Interactive Flashcards",
      description: "Dynamic flashcards created from your content to help reinforce learning and improve retention.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Custom Quizzes",
      description: "Generate personalized quizzes with multiple choice, true/false, and fill-in-the-blank questions.",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Instant Processing",
      description: "Upload your PDF and get study materials generated in minutes, not hours.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description: "Your documents are processed securely and your data remains private and protected.",
    },
  ]

  const stats = [
    { number: "50K+", label: "Documents Processed" },
    { number: "25K+", label: "Active Students" },
    { number: "1M+", label: "Study Materials Generated" },
    { number: "98%", label: "Success Rate" },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Medical Student",
      content:
        "StudyMate transformed how I study. The AI-generated notes are incredibly accurate and save me hours of work.",
      avatar: "SJ",
    },
    {
      name: "Mike Chen",
      role: "Law Student",
      content:
        "The quiz generation feature is amazing. It helps me test my knowledge and identify areas I need to focus on.",
      avatar: "MC",
    },
    {
      name: "Emily Davis",
      role: "Engineering Student",
      content:
        "I love how quickly it processes complex technical documents. The flashcards are perfect for quick reviews.",
      avatar: "ED",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Navigation */}
      <Navbar className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="relative z-20 flex items-center space-x-4">
            <NavbarButton href="/login" variant="secondary" isSignIn>
              Sign In
            </NavbarButton>
            <NavbarButton href="/register" variant="gradient">
              Get Started
            </NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                className="w-full px-4 py-2 text-lg text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-4 px-4">
              <NavbarButton href="/login" variant="secondary" className="w-full">
                Sign In
              </NavbarButton>
              <NavbarButton href="/register" variant="gradient" className="w-full">
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-40 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="hero-badge inline-flex bg-purple-600/20 text-purple-300 border-purple-500/30 mb-6">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Study Assistant
          </Badge>

          <h1 className="hero-title text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Transform PDFs into
            <br />
            <span className="text-purple-400">Smart Study Materials</span>
          </h1>

          <p className="hero-subtitle text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload your documents and let AI generate comprehensive study notes, interactive flashcards, and
            personalized quizzes in minutes.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-4">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 text-lg px-8 py-4"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Hero Image/Illustration */}
          <div className="hero-image relative max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-500/30">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="floating-1 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      <span className="text-sm font-medium">Document Analysis</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  <div className="floating-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <Brain className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-medium">AI Processing</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-1/2"></div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <BookOpen className="h-32 w-32 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Better Learning</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to transform your study materials and accelerate your learning process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 px-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Students Worldwide</h2>
            <p className="text-xl text-gray-300">Join thousands of students who are already studying smarter</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How StudyMate Works</h2>
            <p className="text-xl text-gray-400">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your PDF",
                description: "Simply drag and drop your study materials or textbook chapters",
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our AI processes your document and extracts key information",
              },
              {
                step: "03",
                title: "Study & Learn",
                description: "Access your generated notes, flashcards, and take custom quizzes",
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-purple-600 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-xl text-gray-400">Real feedback from real students</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Study Smarter?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of students who are already using StudyMate</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold">StudyMate</span>
              </div>
              <p className="text-gray-400">Transform your learning experience with AI-powered study materials.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StudyMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

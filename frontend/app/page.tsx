"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, BookOpen, Brain, Zap, FileText } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const pathname = usePathname()

  // Fixed particle positions and delays to prevent hydration errors
  const particles = [
    { left: 76.15, top: 34.79, delay: 0.19 },
    { left: 9.61, top: 53.55, delay: 3.75 },
    { left: 50.66, top: 59.12, delay: 1.03 },
    { left: 75.83, top: 9.15, delay: 4.23 },
    { left: 65.99, top: 9.68, delay: 0.07 },
    { left: 93.92, top: 79.95, delay: 0.00 },
    { left: 98.73, top: 4.55, delay: 4.48 },
    { left: 92.67, top: 13.61, delay: 3.53 },
    { left: 60.39, top: 71.07, delay: 3.83 },
    { left: 62.91, top: 50.46, delay: 4.26 },
    { left: 7.85, top: 34.04, delay: 5.84 },
    { left: 76.07, top: 47.91, delay: 5.58 },
    { left: 40.93, top: 28.95, delay: 2.60 },
    { left: 78.77, top: 58.60, delay: 3.43 },
    { left: 58.30, top: 16.81, delay: 0.36 },
    { left: 2.65, top: 18.40, delay: 5.40 },
    { left: 52.20, top: 77.47, delay: 2.06 },
    { left: 22.83, top: 17.08, delay: 5.40 },
    { left: 56.07, top: 39.22, delay: 2.35 },
    { left: 76.79, top: 99.97, delay: 0.34 },
  ];

  useEffect(() => {
    // Always reset elements to visible state before animating
    gsap.set([".hero-title", ".hero-subtitle", ".hero-cta", ".hero-mockup"], { opacity: 1, y: 0, scale: 1 })
    gsap.set(".feature-card", { opacity: 1, y: 0 })
    gsap.set(".step-item", { opacity: 1, x: 0 })

    // Hero animations
    const tl = gsap.timeline()
    tl.from(".hero-title", { duration: 1, y: 50, opacity: 0, ease: "power3.out" })
      .from(".hero-subtitle", { duration: 1, y: 30, opacity: 0, ease: "power3.out" }, "-=0.5")
      .from(".hero-cta", { duration: 1, y: 20, opacity: 0, ease: "power3.out" }, "-=0.5")
      .from(".hero-mockup", { duration: 1.5, scale: 0.8, opacity: 0, ease: "power3.out" }, "-=0.8")

    // Features scroll animation
    if (featuresRef.current) {
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: "power3.out",
      })
    }

    // Steps animation
    if (stepsRef.current) {
      gsap.from(".step-item", {
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 80%",
        },
        duration: 0.8,
        x: -50,
        opacity: 0,
        stagger: 0.3,
        ease: "power3.out",
      })
    }

    return () => {
      gsap.killTweensOf([".hero-title", ".hero-subtitle", ".hero-cta", ".hero-mockup", ".feature-card", ".step-item"])
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      // Optionally clear props to reset styles
      gsap.set([".hero-title", ".hero-subtitle", ".hero-cta", ".hero-mockup", ".feature-card", ".step-item"], { clearProps: "all" })
    }
  }, [pathname])

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI extracts key concepts and creates comprehensive study materials from your documents.",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Smart Study Notes",
      description: "Generate structured, enhanced study notes with definitions, examples, and key points.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Interactive Flashcards",
      description: "Create personalized flashcards with spaced repetition for effective memorization.",
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Dynamic Quizzes",
      description: "Generate multiple choice, true/false, and fill-in-the-blank quizzes instantly.",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Upload Documents",
      description: "Simply drag and drop your PDF documents or select them from your device.",
    },
    {
      number: "02",
      title: "AI Processing",
      description: "Our advanced AI analyzes your content and extracts key information.",
    },
    {
      number: "03",
      title: "Study Materials",
      description: "Get comprehensive study notes, flashcards, and quizzes ready for learning.",
    },
    {
      number: "04",
      title: "Learn & Practice",
      description: "Use interactive tools to master your subjects effectively.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyMate
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particles.map((particle, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full animate-float opacity-20"
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                  }}
                />
              ))}
            </div>

            <h1 className="hero-title text-5xl md:text-7xl font-bold mb-6">
              Transform Your Documents into{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Interactive Study Materials
              </span>
            </h1>

            <p className="hero-subtitle text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Harness the power of AI to generate comprehensive study notes, flashcards, and quizzes from your PDF
              documents in seconds.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href={user ? "/dashboard" : "/register"}>
                <Button size="lg" className="animate-pulse-glow">
                  {user ? "Go to Dashboard" : "Start Learning Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="glass bg-transparent">
                Watch Demo
              </Button>
            </div>

            {/* Hero Mockup */}
            <div className="hero-mockup relative max-w-4xl mx-auto">
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 glass">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="feature-card">
                    <CardContent className="p-6">
                      <FileText className="h-8 w-8 text-blue-600 mb-4" />
                      <h3 className="font-semibold mb-2">Study Notes</h3>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="feature-card">
                    <CardContent className="p-6">
                      <BookOpen className="h-8 w-8 text-purple-600 mb-4" />
                      <h3 className="font-semibold mb-2">Flashcards</h3>
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg p-4">
                        <div className="text-sm text-center">What is AI?</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="feature-card">
                    <CardContent className="p-6">
                      <Zap className="h-8 w-8 text-green-600 mb-4" />
                      <h3 className="font-semibold mb-2">Quizzes</h3>
                      <div className="space-y-2">
                        <div className="text-sm">Question 1 of 10</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full w-1/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Effective Learning
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to transform your study materials and accelerate your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="feature-card group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 opacity-100"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={stepsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in minutes with our simple, AI-powered process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="step-item text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-30"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students who are already using StudyMate to ace their studies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? "/dashboard" : "/register"}>
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  {user ? "Go to Dashboard" : "Start Free Today"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StudyMate
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-300">
            © 2024 StudyMate. All rights reserved. Built with ❤️ for learners everywhere.
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900 flex flex-col">
      {/* Header */}
      <header
        className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition"
            />
          </Link>

          {/* Nav */}
          <nav className="flex gap-10 items-center">
            <Link
              href="/register/teacher"
              className="text-base font-semibold tracking-wide text-gray-800 hover:text-indigo-600 transition-colors"
            >
              Become a Tutor
            </Link>
            <Link
              href="/login"
              className="text-base font-semibold tracking-wide text-gray-800 hover:text-indigo-600 transition-colors"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full flex items-center justify-center text-center min-h-screen px-6">
        {/* Background Video */}
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/landingPage.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* Overlay Content */}
        <div className="relative z-10 max-w-4xl flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
            Find the Perfect Tutor for You
          </h1>
          <p className="text-lg md:text-2xl mb-10 text-white/90 drop-shadow-md">
            Learn any subject, anywhere — online or in-person, with verified and
            passionate teachers.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <Link
            href="/dashboard/student/teachers"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold px-10 py-4 rounded-full shadow-lg hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
            >
              Find a Teacher
            </Link>
            <Link
              href="/register/teacher"
              className="inline-block bg-white border-2 border-indigo-600 text-indigo-600 text-lg font-semibold px-10 py-4 rounded-full shadow-lg hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
            >
              Become a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-indigo-50 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-14 text-indigo-700 tracking-wide">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
                Verified Teachers
              </h3>
              <p className="text-gray-700 leading-relaxed">
                All teachers go through a thorough approval process to ensure
                quality and expertise.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
                Flexible Learning
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Choose your tutor, schedule, and learning style — online or
                offline — all tailored to your needs.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
                Request-Based Help
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Need help with a specific topic? Send a request and get fast,
                personalized tutoring support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-14 text-indigo-700 text-center tracking-wide">
          What Our Students Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <blockquote className="bg-white rounded-xl shadow-md p-8 italic text-gray-800 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <img
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=72&h=72&q=80"
              alt="Sarah K."
              className="mb-6 rounded-full shadow-md object-cover"
              width={72}
              height={72}
              loading="lazy"
            />
            “This platform helped me find an amazing tutor who made learning so
            much easier and fun!”
            <footer className="mt-6 font-semibold text-indigo-600">
              — Sarah K.
            </footer>
          </blockquote>

          <blockquote className="bg-white rounded-xl shadow-md p-8 italic text-gray-800 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <img
              src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=72&h=72&q=80"
              alt="Ahmed R."
              className="mb-6 rounded-full shadow-md object-cover"
              width={72}
              height={72}
              loading="lazy"
            />
            “Flexible scheduling and great teachers. I highly recommend it to
            anyone who wants personalized learning.”
            <footer className="mt-6 font-semibold text-indigo-600">
              — Ahmed R.
            </footer>
          </blockquote>

          <blockquote className="bg-white rounded-xl shadow-md p-8 italic text-gray-800 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=72&h=72&q=80"
              alt="Priya M."
              className="mb-6 rounded-full shadow-md object-cover"
              width={72}
              height={72}
              loading="lazy"
            />
            “Quick help whenever I needed it. The request-based tutoring saved
            my grades!”
            <footer className="mt-6 font-semibold text-indigo-600">
              — Priya M.
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="bg-indigo-600 py-16 px-6 text-center rounded-t-3xl shadow-lg mx-6 md:mx-20 mb-12 text-white">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
          Ready to start learning?
        </h2>
        <p className="mb-8 max-w-xl mx-auto text-lg opacity-90">
          Join thousands of learners and teachers making education accessible
          and flexible.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-indigo-700 font-semibold text-lg px-10 py-4 rounded-full shadow-lg hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
        >
          Sign Up Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-indigo-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Tutogogy. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="#"
              aria-label="Facebook"
              className="hover:text-indigo-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22 12a10 10 0 10-11.62 9.86v-6.97H8v-2.9h2.38V9.41c0-2.35 1.4-3.65 3.56-3.65 1.03 0 2.1.18 2.1.18v2.3h-1.18c-1.16 0-1.52.72-1.52 1.46v1.75h2.6l-.42 2.9h-2.18v6.97A10 10 0 0022 12z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="hover:text-indigo-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23 3a10.9 10.9 0 01-3.14.86 5.48 5.48 0 002.4-3.03 10.92 10.92 0 01-3.48 1.33A5.44 5.44 0 0016.67 2a5.48 5.48 0 00-5.45 6.7A15.5 15.5 0 013 3.16 5.44 5.44 0 004.15 9.7a5.37 5.37 0 01-2.48-.7v.07a5.49 5.49 0 004.4 5.38 5.42 5.42 0 01-2.47.09 5.49 5.49 0 005.13 3.8 10.97 10.97 0 01-6.8 2.35c-.44 0-.87-.02-1.3-.08a15.43 15.43 0 008.36 2.45c10.04 0 15.53-8.32 15.53-15.53 0-.24 0-.49-.02-.73A11.1 11.1 0 0023 3z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="hover:text-indigo-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 2A3.75 3.75 0 004 7.75v8.5A3.75 3.75 0 007.75 20h8.5a3.75 3.75 0 003.75-3.75v-8.5A3.75 3.75 0 0016.25 4h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm4.5-3a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

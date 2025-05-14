import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="w-full   bg-white">
  <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
    <div className="text-2xl font-bold text-indigo-600">LOGO</div>
    <div className="flex gap-6">
      <Link href="/register/teacher" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
        Become a Tutor
      </Link>
      <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
        Login
      </Link>
    </div>
  </div>
</header>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-6  text-dark">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Find the Perfect Tutor for You</h1>
        <p className="text-lg md:text-2xl mb-6 max-w-2xl">
          Learn any subject, anywhere — online or in-person.
        </p>
        <div className="flex gap-4">
          <Link href="/teachers">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Find a Teacher
            </button>
          </Link>
          <Link href="/register/teacher">
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Become a Teacher
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <div>
            <h3 className="text-xl font-semibold mb-2">Verified Teachers</h3>
            <p>All teachers go through an approval process to ensure quality learning.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Flexible Learning</h3>
            <p>Choose your tutor, schedule, and learning style — online or offline.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Request-Based Help</h3>
            <p>Need help with a topic? Send a request and get quick tutoring support.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

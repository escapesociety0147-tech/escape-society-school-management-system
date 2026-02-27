export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* Add your terms content here */}
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using EduManage, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            {/* Add more sections as needed */}
          </div>
        </div>
      </div>
    </div>
  )
}